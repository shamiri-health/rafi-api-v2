DROP TABLE "insurance";--> statement-breakpoint
ALTER TABLE "alacarteOrder" DROP CONSTRAINT "alacarteOrder_insuranceId_insurance_id_fk";
--> statement-breakpoint
ALTER TABLE "alacarteOrder" DROP COLUMN IF EXISTS "insuranceId";