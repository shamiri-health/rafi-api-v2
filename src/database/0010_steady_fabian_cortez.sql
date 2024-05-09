ALTER TABLE "rewardHubRecord" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "userAchievement" ADD COLUMN "level" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewardHubRecord" ADD CONSTRAINT "rewardHubRecord_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
