import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/adminGuard';
import { getRecentActivity } from '@/lib/superAdmin/realData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 20)) : 20;

  const activity = await getRecentActivity(limit);
  return NextResponse.json({ success: true, data: { activity } });
}
