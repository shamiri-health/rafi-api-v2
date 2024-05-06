CREATE TABLE IF NOT EXISTS "subscription_payment" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"subscription_id" varchar(36) NOT NULL,
	"amount_paid" integer NOT NULL,
	"payment_timestamp" timestamp NOT NULL,
	"payment_method" text NOT NULL,
	"status" text NOT NULL,
	"meta_data" jsonb
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_subscription_id_subscription_v2_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "subscription_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
