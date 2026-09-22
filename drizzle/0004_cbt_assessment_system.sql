CREATE TABLE "cbt_assessments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "course_slug" varchar(100) NOT NULL,
  "module_id" uuid NOT NULL,
  "title" varchar(300) NOT NULL,
  "topic" varchar(300) NOT NULL,
  "description" text NOT NULL,
  "difficulty" varchar(20) NOT NULL,
  "time_limit_minutes" integer NOT NULL,
  "mcq_count" integer NOT NULL,
  "fill_blank_count" integer NOT NULL,
  "options_per_mcq" integer NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cbt_questions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "assessment_id" uuid NOT NULL,
  "type" varchar(20) NOT NULL,
  "question_text" text NOT NULL,
  "correct_answer" text NOT NULL,
  "acceptable_answers" jsonb,
  "explanation" text NOT NULL,
  "difficulty" varchar(20) NOT NULL,
  "topic" varchar(300) NOT NULL,
  "order_index" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cbt_question_options" (
  "id" uuid PRIMARY KEY NOT NULL,
  "question_id" uuid NOT NULL,
  "option_text" text NOT NULL,
  "order_index" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cbt_attempts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "assessment_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "submitted_at" timestamp with time zone,
  "status" varchar(20) DEFAULT 'in_progress' NOT NULL,
  "score" integer,
  "max_score" integer,
  "percentage" integer,
  "time_taken_seconds" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cbt_answers" (
  "id" uuid PRIMARY KEY NOT NULL,
  "attempt_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "answer" text,
  "marked_for_review" integer DEFAULT 0 NOT NULL,
  "is_correct" integer,
  "marks_awarded" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cbt_assessments" ADD CONSTRAINT "cbt_assessments_course_slug_courses_slug_fk" FOREIGN KEY ("course_slug") REFERENCES "public"."courses"("slug") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_assessments" ADD CONSTRAINT "cbt_assessments_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_assessments" ADD CONSTRAINT "cbt_assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict;
--> statement-breakpoint
ALTER TABLE "cbt_questions" ADD CONSTRAINT "cbt_questions_assessment_id_cbt_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."cbt_assessments"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_question_options" ADD CONSTRAINT "cbt_question_options_question_id_cbt_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."cbt_questions"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_attempts" ADD CONSTRAINT "cbt_attempts_assessment_id_cbt_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."cbt_assessments"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_attempts" ADD CONSTRAINT "cbt_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_answers" ADD CONSTRAINT "cbt_answers_attempt_id_cbt_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."cbt_attempts"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "cbt_answers" ADD CONSTRAINT "cbt_answers_question_id_cbt_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."cbt_questions"("id") ON DELETE cascade;
