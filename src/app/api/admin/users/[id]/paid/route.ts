import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { markUserPaid, unmarkUserPaid } from '@/lib/auth/paidUsers';
import { getUserById } from '@/lib/auth/store';

export const runtime = 'nodejs';

interface RouteParams {
  params: { id: string };
}

const markPaidSchema = z.object({
  plan: z.string().max(50).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

/** Admin: manually record a user as paid. See paidUsers schema comment — no real payment gateway exists. */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const target = await getUserById(params.id);
  if (!target) {
    return NextResponse.json({ success: false, error: { code: 'user_not_found', message: 'User not found.' } }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // no body is fine — all fields optional
  }

  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'invalid_request', message: 'Malformed fields.' } }, { status: 400 });
  }

  const record = await markUserPaid(params.id, { ...parsed.data, activatedBy: auth.user.id });
  return NextResponse.json({ success: true, paidUser: record });
}

/** Admin: remove a user's paid status. */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAdmin(req);
  if ('response' in auth) return auth.response;

  const removed = await unmarkUserPaid(params.id);
  if (!removed) {
    return NextResponse.json({ success: false, error: { code: 'not_paid', message: 'This user is not marked as paid.' } }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
