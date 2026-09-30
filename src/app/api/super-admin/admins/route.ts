import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import { listAdminAccounts } from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const admins = await listAdminAccounts();
  return NextResponse.json({ success: true, data: { admins } });
}
