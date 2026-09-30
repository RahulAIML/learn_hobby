import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import { listModulesOverview } from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const modules = await listModulesOverview();
  return NextResponse.json({ success: true, data: { modules } });
}
