import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface VaultBackupRecord {
  id: string;
  storeId: string;
  storeName: string;
  filename: string;
  size: number;
  checksum: string;
  createdAt: string;
  appVersion: string;
  schemaVersion: string;
  downloadUrl: string;
  storageType: 'vercel-blob' | 'local';
}

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_BACKUPS_DIR = path.join(LOCAL_DATA_DIR, 'backups');
const LOCAL_META_FILE = path.join(LOCAL_DATA_DIR, 'vault-metadata.json');

function ensureLocalDirs() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_BACKUPS_DIR)) fs.mkdirSync(LOCAL_BACKUPS_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_META_FILE)) fs.writeFileSync(LOCAL_META_FILE, JSON.stringify([]));
}

function getLocalRecords(): VaultBackupRecord[] {
  ensureLocalDirs();
  try {
    const raw = fs.readFileSync(LOCAL_META_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalRecords(records: VaultBackupRecord[]) {
  ensureLocalDirs();
  fs.writeFileSync(LOCAL_META_FILE, JSON.stringify(records, null, 2));
}

export function validateVaultKey(authHeader: string | null): boolean {
  const secretKey = process.env.VAULT_SECRET_KEY || 'ir-vault-secret-key-2026';
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return token === secretKey;
}

export async function saveBackupToVault({
  fileBuffer,
  filename,
  storeId,
  storeName,
  appVersion,
  schemaVersion,
}: {
  fileBuffer: Buffer;
  filename: string;
  storeId: string;
  storeName: string;
  appVersion: string;
  schemaVersion: string;
}): Promise<VaultBackupRecord> {
  const id = crypto.randomUUID();
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const size = fileBuffer.length;
  const createdAt = new Date().toISOString();

  // If Vercel Blob Token is set, upload to Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`backups/${storeId}/${filename}`, fileBuffer, {
      access: 'public',
      contentType: 'application/octet-stream',
    });

    const record: VaultBackupRecord = {
      id,
      storeId,
      storeName,
      filename,
      size,
      checksum,
      createdAt,
      appVersion,
      schemaVersion,
      downloadUrl: blob.url,
      storageType: 'vercel-blob',
    };

    // Save metadata record
    const records = getLocalRecords();
    records.unshift(record);
    saveLocalRecords(records);
    return record;
  }

  // Local filesystem fallback
  ensureLocalDirs();
  const filePath = path.join(LOCAL_BACKUPS_DIR, `${id}_${filename}`);
  fs.writeFileSync(filePath, fileBuffer);

  const record: VaultBackupRecord = {
    id,
    storeId,
    storeName,
    filename,
    size,
    checksum,
    createdAt,
    appVersion,
    schemaVersion,
    downloadUrl: `/api/vault/download?id=${id}`,
    storageType: 'local',
  };

  const records = getLocalRecords();
  records.unshift(record);
  saveLocalRecords(records);

  return record;
}

export async function listVaultBackups(storeId?: string): Promise<VaultBackupRecord[]> {
  const records = getLocalRecords();
  if (storeId) {
    return records.filter(r => r.storeId === storeId);
  }
  return records;
}

export async function getVaultBackupById(id: string): Promise<{ record: VaultBackupRecord; buffer?: Buffer } | null> {
  const records = getLocalRecords();
  const record = records.find(r => r.id === id);
  if (!record) return null;

  if (record.storageType === 'local') {
    ensureLocalDirs();
    const filePath = path.join(LOCAL_BACKUPS_DIR, `${id}_${record.filename}`);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return { record, buffer };
    }
  }

  return { record };
}
