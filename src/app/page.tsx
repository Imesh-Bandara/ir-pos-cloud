'use client';

import { useState, useEffect } from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Clock, 
  Database, 
  HardDrive, 
  Key, 
  CheckCircle2, 
  Copy, 
  Upload, 
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

interface VaultBackup {
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
}

export default function VaultDashboard() {
  const [backups, setBackups] = useState<VaultBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const vaultUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ir-vault.vercel.app';
  const defaultApiKey = 'ir-vault-secret-key-2026';

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vault/backups');
      const data = await res.json();
      if (data.backups) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to load backups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', 'manual-portal');
      formData.append('storeName', 'IR Vault Web Portal');
      formData.append('appVersion', '1.0.0');
      formData.append('schemaVersion', '1');

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${defaultApiKey}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        setUploadSuccess(`Uploaded "${file.name}" successfully!`);
        fetchBackups();
      } else {
        alert(json.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const totalStorage = backups.reduce((sum, b) => sum + b.size, 0);
  const latestBackup = backups[0];

  const filteredBackups = backups.filter(b => 
    b.filename.toLowerCase().includes(search.toLowerCase()) ||
    b.storeName.toLowerCase().includes(search.toLowerCase()) ||
    b.storeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-blue-100/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/30">
              <Cloud size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">IR Vault</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">Automated Hourly Backups for IR POS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Hourly Sync Active
            </span>
            <button 
              onClick={fetchBackups}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
              title="Refresh Backups"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* METRICS ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Database size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Backups</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{backups.length}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Encrypted Snapshots</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Latest Sync</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[170px]">
                {latestBackup ? formatDate(latestBackup.createdAt) : 'Awaiting 1st Sync'}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} />
                {latestBackup ? 'Sync Verified' : 'Ready'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
              <HardDrive size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Storage Used</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{formatBytes(totalStorage)}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Vercel Blob / Cloud Storage</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sync Frequency</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">Every 1 Hour</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Continuous Protection</p>
            </div>
          </div>

        </section>

        {/* CONNECTION & LINKING WIDGET */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 blur-2xl pointer-events-none" />
          
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1">
                <Lock size={12} />
                POS Connection Credentials
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Connect IR POS to your IR Vault
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Copy these connection settings into your <strong>IR POS Desktop Application</strong> (Settings &gt; Backup &amp; Restore) to enable automated hourly cloud synchronization.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Vault URL */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                  <span>Vault Service URL</span>
                  <button 
                    onClick={() => copyToClipboard(vaultUrl, 'url')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedUrl ? <CheckCircle2 size={13} className="text-emerald-300" /> : <Copy size={13} />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-semibold truncate text-white bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                  {vaultUrl}
                </div>
              </div>

              {/* API Key */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                  <span>Vault Secret API Key</span>
                  <button 
                    onClick={() => copyToClipboard(defaultApiKey, 'key')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedKey ? <CheckCircle2 size={13} className="text-emerald-300" /> : <Copy size={13} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-semibold truncate text-white bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                  {defaultApiKey}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* BACKUPS TIMELINE & LEDGER */}
        <section className="bg-white rounded-2xl shadow-xs border border-blue-100 overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-50/40 via-white to-blue-50/20">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Hourly Backups Ledger
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {backups.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-500">Every hourly snapshot sent from your IR POS system</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by store or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full sm:w-64 bg-white"
              />

              {/* Manual Test Upload */}
              <label className="cursor-pointer px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs shadow-blue-500/20">
                <Upload size={14} />
                <span>{uploading ? 'Uploading...' : 'Manual Upload'}</span>
                <input 
                  type="file" 
                  accept=".irposbackup,.db" 
                  className="hidden" 
                  onChange={handleManualUpload}
                  disabled={uploading} 
                />
              </label>
            </div>
          </div>

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-xs px-6 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {uploadSuccess}
              </span>
              <button onClick={() => setUploadSuccess(null)} className="text-emerald-700 hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Timestamp & Frequency</th>
                  <th className="py-3 px-6">Store & Terminal</th>
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Integrity Checksum</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && backups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin mx-auto text-blue-500 mb-2" />
                      Loading IR Vault snapshots...
                    </td>
                  </tr>
                ) : filteredBackups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Cloud size={36} className="mx-auto text-blue-300 mb-2" />
                      <p className="font-semibold text-slate-800">No backups in vault yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Connect IR POS with your Vault URL to receive hourly syncs, or click "Manual Upload".
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBackups.map((b) => (
                    <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDate(b.createdAt)}</div>
                        <span className="text-[11px] text-blue-600 flex items-center gap-1">
                          <Clock size={11} /> Hourly Auto-Sync
                        </span>
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{b.storeName}</span>
                        <div className="text-xs text-slate-400 font-mono">{b.storeId}</div>
                      </td>

                      <td className="py-3.5 px-6 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {b.filename}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatBytes(b.size)}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-xs text-slate-400 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600 border border-slate-200">
                          sha256: {b.checksum.substring(0, 10)}...
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <a
                          href={b.downloadUrl}
                          download={b.filename}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors border border-blue-200"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>
    </div>
  );
}
