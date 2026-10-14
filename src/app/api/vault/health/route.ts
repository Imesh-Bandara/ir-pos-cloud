import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'IR Vault',
    version: '1.0.0',
    time: new Date().toISOString(),
    features: ['hourly-sync', 'cloud-blob-storage', 'sha256-integrity'],
  });
}
