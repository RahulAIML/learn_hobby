ALTER TABLE "users" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goal_category" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goal_subcategory" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goal_option" varchar(150);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_completed_at" timestamp with time zone;
