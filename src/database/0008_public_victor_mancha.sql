CREATE TABLE IF NOT EXISTS "subscription_v2" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"subscription_type_id" varchar(1000) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_v2" ADD CONSTRAINT "subscription_v2_subscription_type_id_subscription_type_id_fk" FOREIGN KEY ("subscription_type_id") REFERENCES "subscription_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
