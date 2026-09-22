import { NextRequest, NextResponse } from 'next/server';
import { listUsers } from '@/lib/auth/store';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { listPaidUsers } from '@/lib/auth/paidUsers';

export const runtime = 'nodejs';

/** Admin: list every registered user (real Postgres data, never includes passwordHash), with paid status. */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const [users, paidUsers] = await Promise.all([listUsers(), listPaidUsers()]);
  const paidUserIds = new Set(paidUsers.map((p) => p.userId));
  const usersWithPaidStatus = users.map((u) => ({ ...u, isPaid: paidUserIds.has(u.id) }));

  return NextResponse.json({ success: true, users: usersWithPaidStatus });
}
