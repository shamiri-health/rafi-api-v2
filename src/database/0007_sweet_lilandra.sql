CREATE TABLE IF NOT EXISTS "subscription_type" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"duration_days" integer,
	"duration_months" integer,
	"price" integer
);
