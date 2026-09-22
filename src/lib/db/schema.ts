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

// CBT assessments deliberately use their own tables.  The existing
// `assessments`/`submissions` pair is the document-upload evaluation product;
// combining the two would expose incompatible lifecycle and scoring rules.
export const cbtAssessments = pgTable('cbt_assessments', {
  id: uuid('id').primaryKey(),
  courseSlug: varchar('course_slug', { length: 100 }).notNull().references(() => courses.slug, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  topic: varchar('topic', { length: 300 }).notNull(),
  description: text('description').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  timeLimitMinutes: integer('time_limit_minutes').notNull(),
  mcqCount: integer('mcq_count').notNull(),
  fillBlankCount: integer('fill_blank_count').notNull(),
  optionsPerMcq: integer('options_per_mcq').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cbtQuestions = pgTable('cbt_questions', {
  id: uuid('id').primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => cbtAssessments.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
  questionText: text('question_text').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  acceptableAnswers: jsonb('acceptable_answers').$type<string[]>(),
  explanation: text('explanation').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  topic: varchar('topic', { length: 300 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cbtQuestionOptions = pgTable('cbt_question_options', {
  id: uuid('id').primaryKey(),
  questionId: uuid('question_id').notNull().references(() => cbtQuestions.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cbtAttempts = pgTable('cbt_attempts', {
  id: uuid('id').primaryKey(),
  assessmentId: uuid('assessment_id').notNull().references(() => cbtAssessments.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'),
  score: integer('score'),
  maxScore: integer('max_score'),
  percentage: integer('percentage'),
  timeTakenSeconds: integer('time_taken_seconds'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cbtAnswers = pgTable('cbt_answers', {
  id: uuid('id').primaryKey(),
  attemptId: uuid('attempt_id').notNull().references(() => cbtAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => cbtQuestions.id, { onDelete: 'cascade' }),
  answer: text('answer'),
  markedForReview: integer('marked_for_review').notNull().default(0),
  isCorrect: integer('is_correct'),
  marksAwarded: integer('marks_awarded'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
