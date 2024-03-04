ALTER TABLE "answers" DROP CONSTRAINT "answers_questionId_questions_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_questions_id_fk" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
