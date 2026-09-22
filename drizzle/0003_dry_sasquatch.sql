CREATE TABLE "paid_users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"plan" varchar(50) DEFAULT 'standard' NOT NULL,
	"amount" integer,
	"currency" varchar(10),
	"activated_by" uuid,
	"notes" text,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "paid_users" ADD CONSTRAINT "paid_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paid_users" ADD CONSTRAINT "paid_users_activated_by_users_id_fk" FOREIGN KEY ("activated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;