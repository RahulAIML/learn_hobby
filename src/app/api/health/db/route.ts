import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';

export const runtime = 'nodejs';

/** Verifies Postgres connectivity without leaking connection details. */
export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch {
    return NextResponse.json({ status: 'error', database: 'unreachable' }, { status: 503 });
  }
}
