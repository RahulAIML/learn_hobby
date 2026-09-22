import { randomUUID } from 'crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users, enrollments } from '../src/lib/db/schema';
import { hashPassword } from '../src/lib/auth/password';

/**
 * Development seed data — inserted INTO Postgres, never hardcoded as the
 * app's runtime "database". Run explicitly:
 *   npm run db:seed
 * Never run automatically on application startup.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  const existing = await db.select().from(users).where(eq(users.email, 'student@gurukul.dev')).limit(1);

  if (existing.length > 0) {
    console.log('Demo student already seeded, skipping.');
  } else {
    const studentId = randomUUID();
    await db.insert(users).values({
      id: studentId,
      username: 'demo_student',
      email: 'student@gurukul.dev',
      name: 'Demo Student',
      passwordHash: hashPassword('student123'),
      role: 'student',
    });
    await db.insert(enrollments).values({ userId: studentId, courseSlug: 'data-science' });
    console.log('Seeded demo student: student@gurukul.dev / student123 (enrolled in data-science)');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
