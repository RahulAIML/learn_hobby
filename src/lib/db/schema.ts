import { pgTable, uuid, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';

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
