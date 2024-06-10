ALTER TABLE "questions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "question" SET NOT NULL;
