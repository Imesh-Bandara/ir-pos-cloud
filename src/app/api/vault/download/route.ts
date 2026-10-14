import { NextRequest, NextResponse } from 'next/server';
import { getVaultBackupById } from '@/lib/vault-store';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing backup id' }, { status: 400 });
    }

    const data = await getVaultBackupById(id);
    if (!data) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    if (data.record.storageType === 'vercel-blob') {
      return NextResponse.redirect(data.record.downloadUrl);
    }

    if (data.buffer) {
      return new NextResponse(new Uint8Array(data.buffer), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${data.record.filename}"`,
          'Content-Length': data.record.size.toString(),
        },
      });
    }

    return NextResponse.json({ error: 'File content unavailable' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Download failed' }, { status: 500 });
  }
}
