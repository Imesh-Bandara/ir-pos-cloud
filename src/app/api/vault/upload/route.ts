import { NextRequest, NextResponse } from 'next/server';
import { validateVaultKey, saveBackupToVault } from '@/lib/vault-store';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('x-vault-key');
    if (!validateVaultKey(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing Vault API key' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Case A: Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const storeId = (formData.get('storeId') as string) || 'default-store';
      const storeName = (formData.get('storeName') as string) || 'IR POS Terminal';
      const appVersion = (formData.get('appVersion') as string) || '1.0.0';
      const schemaVersion = (formData.get('schemaVersion') as string) || '1';

      if (!file) {
        return NextResponse.json({ error: 'Missing backup file' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const record = await saveBackupToVault({
        fileBuffer: buffer,
        filename: file.name || `backup-${Date.now()}.irposbackup`,
        storeId,
        storeName,
        appVersion,
        schemaVersion,
      });

      return NextResponse.json({
        success: true,
        message: 'Backup successfully saved to IR Vault',
        backup: record,
      });
    }

    // Case B: JSON with base64 payload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { fileBase64, filename, storeId, storeName, appVersion, schemaVersion } = body;

      if (!fileBase64) {
        return NextResponse.json({ error: 'Missing fileBase64 data' }, { status: 400 });
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      const record = await saveBackupToVault({
        fileBuffer: buffer,
        filename: filename || `backup-${Date.now()}.irposbackup`,
        storeId: storeId || 'default-store',
        storeName: storeName || 'IR POS Terminal',
        appVersion: appVersion || '1.0.0',
        schemaVersion: schemaVersion || '1',
      });

      return NextResponse.json({
        success: true,
        message: 'Backup successfully saved to IR Vault',
        backup: record,
      });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json' }, { status: 415 });
  } catch (err: any) {
    console.error('Vault upload error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error while saving backup' }, { status: 500 });
  }
}
