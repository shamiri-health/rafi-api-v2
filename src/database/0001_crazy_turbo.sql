ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "systemResponse" ALTER COLUMN "rewardHubActions" SET DATA TYPE json[];
