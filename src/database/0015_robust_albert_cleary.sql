ALTER TABLE "subscription_v2" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_v2" ADD COLUMN "is_one_off" boolean DEFAULT false NOT NULL;