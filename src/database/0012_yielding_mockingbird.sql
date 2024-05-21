CREATE TABLE IF NOT EXISTS "subscription_payment" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	"subscription_type_id" varchar(36) NOT NULL,
	"amount_paid" integer NOT NULL,
	"payment_timestamp" timestamp NOT NULL,
	"payment_method" text NOT NULL,
	"status" text NOT NULL,
	"mpesa_ref" text,
	"meta_data" jsonb
);
--> statement-breakpoint
ALTER TABLE "subscription_type" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_v2" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "subscription_v2" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_type_id_subscription_type_id_fk" FOREIGN KEY ("subscription_type_id") REFERENCES "subscription_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
