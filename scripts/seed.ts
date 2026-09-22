import { randomUUID } from 'crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users, enrollments, courses, modules, assessments } from '../src/lib/db/schema';
import { hashPassword } from '../src/lib/auth/password';
import { resolveSslOption } from '../src/lib/db/connectionOptions';

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

  const client = postgres(connectionString, { max: 1, ssl: resolveSslOption(connectionString) });
  const db = drizzle(client);

  // Demo student
  const existingStudent = await db.select().from(users).where(eq(users.email, 'student@gurukul.dev')).limit(1);
  if (existingStudent.length > 0) {
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

  // Demo admin
  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@gurukul.dev')).limit(1);
  if (existingAdmin.length > 0) {
    console.log('Demo admin already seeded, skipping.');
  } else {
    await db.insert(users).values({
      id: randomUUID(),
      username: 'admin',
      email: 'admin@gurukul.dev',
      name: 'Gurukul Admin',
      passwordHash: hashPassword('admin12345'),
      role: 'admin',
    });
    console.log('Seeded demo admin: admin@gurukul.dev / admin12345');
  }

  // Flagship course + module + assessment
  const existingCourse = await db.select().from(courses).where(eq(courses.slug, 'data-science')).limit(1);
  if (existingCourse.length > 0) {
    console.log('Course "data-science" already seeded, skipping.');
  } else {
    await db.insert(courses).values({ slug: 'data-science', title: 'Data Science Championship Program™' });

    const moduleId = randomUUID();
    await db.insert(modules).values({
      id: moduleId,
      courseSlug: 'data-science',
      title: 'Module 2: Python for Data Analysis',
      order: 1,
    });

    await db.insert(assessments).values({
      id: randomUUID(),
      moduleId,
      courseSlug: 'data-science',
      title: 'Module 2 Assessment: Lists vs. Tuples',
      instructions:
        'Answer the questions about Python lists and tuples covered in the module document. Explain mutability, syntax differences, and give one real-world use case for each. Upload your answers as a single file.',
      rubric:
        'Full credit requires: correct mutability explanation, correct syntax examples, at least one valid use case per data structure, and clear writing.',
      maxScore: 100,
      allowedFormats: ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'],
      status: 'active',
    });

    console.log('Seeded course "data-science" with a demo module and assessment.');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
