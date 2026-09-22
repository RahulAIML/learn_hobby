import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { paidUsers } from '@/lib/db/schema';

/**
 * Manual membership tracking — see schema.ts's comment on `paidUsers` for
 * the honesty note: no payment gateway exists, so activation is an admin
 * action, not an automatic result of a real charge.
 */

export interface PaidUserRecord {
  userId: string;
  plan: string;
  amount: number | null;
  currency: string | null;
  activatedBy: string | null;
  notes: string | null;
  activatedAt: string;
  expiresAt: string | null;
}

function rowToRecord(row: typeof paidUsers.$inferSelect): PaidUserRecord {
  return {
    userId: row.userId,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    activatedBy: row.activatedBy,
    notes: row.notes,
    activatedAt: row.activatedAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  };
}

export async function listPaidUsers(): Promise<PaidUserRecord[]> {
  const db = await getDb();
  const rows = await db.select().from(paidUsers);
  return rows.map(rowToRecord);
}

export async function getPaidUser(userId: string): Promise<PaidUserRecord | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(paidUsers).where(eq(paidUsers.userId, userId)).limit(1);
  return row ? rowToRecord(row) : undefined;
}

export interface MarkPaidInput {
  plan?: string;
  amount?: number;
  currency?: string;
  notes?: string;
  activatedBy: string;
}

export async function markUserPaid(userId: string, input: MarkPaidInput): Promise<PaidUserRecord> {
  const db = await getDb();
  const [row] = await db
    .insert(paidUsers)
    .values({
      userId,
      plan: input.plan ?? 'standard',
      amount: input.amount ?? null,
      currency: input.currency ?? null,
      notes: input.notes ?? null,
      activatedBy: input.activatedBy,
    })
    .onConflictDoUpdate({
      target: paidUsers.userId,
      set: {
        plan: input.plan ?? 'standard',
        amount: input.amount ?? null,
        currency: input.currency ?? null,
        notes: input.notes ?? null,
        activatedBy: input.activatedBy,
        activatedAt: new Date(),
      },
    })
    .returning();
  return rowToRecord(row);
}

export async function unmarkUserPaid(userId: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db.delete(paidUsers).where(eq(paidUsers.userId, userId)).returning();
  return deleted.length > 0;
}
