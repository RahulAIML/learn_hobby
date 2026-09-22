import { pgTable, uuid, varchar, text, integer, timestamp, primaryKey, jsonb } from 'drizzle-orm/pg-core';

/**
 * Drizzle schema — source of truth for the Postgres schema, migrated with
 * drizzle-kit (see drizzle.config.ts and scripts/db-migrate.ts). Do not
 * hand-edit tables in the database; change this file and regenerate a
 * migration instead.
 */

export const users = pgTable('users', {
  // Generated in application code (crypto.randomUUID()), not DB-side, to
  // avoid depending on the pgcrypto extension being enabled on every
  // Postgres provider (Render, local Docker, PGlite in tests).
  id: uuid('id').primaryKey(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  // NOTE: `mobile` and `phone_no` are both present per spec as distinct
  // fields. Neither existed in the app before this migration (no prior
  // data forces a meaning on either), so no assumption is made about which
  // is "primary" — both are optional free-form contact numbers until
  // product/business defines a real distinction between them.
  mobile: varchar('mobile', { length: 20 }),
  phoneNo: varchar('phone_no', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('student'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const enrollments = pgTable(
  'enrollments',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseSlug: varchar('course_slug', { length: 100 }).notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.courseSlug] }),
  })
);

export const courses = pgTable('courses', {
  slug: varchar('slug', { length: 100 }).primaryKey(),
  title: varchar('title', { length: 300 }).notNull(),
});

/**
 * Membership/tier tracking, kept as its own table per your instruction to
 * separate paid users from the main users table. LIMITATION (disclosed
 * honestly, same pattern as every other placeholder in this project): no
 * payment gateway is integrated. There is no real transaction processing,
 * no card handling, no Razorpay/Stripe call here — `activatedBy` and
 * `notes` exist so an admin can manually record a payment taken outside
 * the app (bank transfer, in person, etc.) until a real gateway is wired
 * in. Do not treat rows here as proof of an actual charge having occurred.
 */
export const paidUsers = pgTable('paid_users', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull().default('standard'),
  amount: integer('amount'),
  currency: varchar('currency', { length: 10 }),
  activatedBy: uuid('activated_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  activatedAt: timestamp('activated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export const modules = pgTable('modules', {
  id: uuid('id').primaryKey(),
  courseSlug: varchar('course_slug', { length: 100 })
    .notNull()
    .references(() => courses.slug, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  order: integer('order').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const courseDocuments = pgTable('course_documents', {
  id: uuid('id').primaryKey(),
  courseSlug: varchar('course_slug', { length: 100 })
    .notNull()
    .references(() => courses.slug, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 300 }).notNull(),
  filename: varchar('filename', { length: 300 }).notNull(),
  mimeType: varchar('mime_type', { length: 150 }).notNull(),
  // Base64-encoded raw file bytes — same representation the in-memory
  // store used, now durable. `text` rather than `bytea` keeps the store
  // code (and the base64 encode/decode call sites) unchanged.
  data: text('data').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey(),
  moduleId: uuid('module_id')
    .notNull()
    .unique()
    .references(() => modules.id, { onDelete: 'cascade' }),
  courseSlug: varchar('course_slug', { length: 100 }).notNull(),
  title: varchar('title', { length: 300 }).notNull(),
  instructions: text('instructions').notNull(),
  rubric: text('rubric').notNull().default(''),
  maxScore: integer('max_score').notNull().default(100),
  allowedFormats: jsonb('allowed_formats').$type<string[]>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull(),
  courseSlug: varchar('course_slug', { length: 100 }).notNull(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 300 }).notNull(),
  mimeType: varchar('mime_type', { length: 150 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('evaluating'),
  // The full structured Gemini evaluation result (see src/lib/assessment/schema.ts),
  // stored alongside the submission it belongs to rather than a separate table —
  // it's always read/written together with its submission, never independently.
  evaluation: jsonb('evaluation'),
});
