-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "Tip" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(10),
	"text" varchar(4000),
	"summary" varchar(500),
	"modifyDatetime" timestamp,
	"frequency" double precision,
	"relatedGoal1" integer,
	"relatedGoal2" integer,
	CONSTRAINT "Tip_name_key" UNIQUE("name"),
	CONSTRAINT "Tip_text_key" UNIQUE("text"),
	CONSTRAINT "Tip_summary_key" UNIQUE("summary")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affirmation" (
	"id" varchar(120),
	"createdAt" timestamp,
	"updatedAt" timestamp,
	"deletedAt" timestamp,
	"content" text,
	"category" text,
	"userId" integer,
	"background_file_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affirmation_of_the_day" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"category" text,
	"sub_category" text,
	"affirmation" text,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affirmation_reminder" (
	"id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"category" text,
	"name" text,
	"frequency" text,
	"number_of_times" integer,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alacarteOrder" (
	"id" integer PRIMARY KEY NOT NULL,
	"userId" integer,
	"insuranceId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alembic_version" (
	"version_num" varchar(32) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "answers" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"answer" varchar(1000),
	"questionId" varchar,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blacklistToken" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(500) NOT NULL,
	"blacklistedOn" timestamp NOT NULL,
	CONSTRAINT "blacklistToken_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"googleId" varchar(120),
	"summary" varchar(80),
	"timeZone" varchar(40) DEFAULT 'Africa/Nairobi'::character varying,
	"description" varchar(80),
	"type" varchar(40),
	CONSTRAINT "calendar_googleId_key" UNIQUE("googleId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cbtCourse" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"summary" varchar(100) NOT NULL,
	"modulesString" varchar(200) NOT NULL,
	"relatedDomains" varchar(80) NOT NULL,
	"about" varchar(1500),
	"assetUrl" varchar,
	"backgroundColor" varchar DEFAULT 'rgba(67, 143, 120, 0.1)',
	"buttonColor" varchar(30) DEFAULT 'rgba(67, 143, 120)'::character varying
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cbtEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"userModule" integer,
	"cbtCourseId" integer,
	"userProgress" varchar(10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cbtModule" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"cbtCourseId" integer,
	"name" varchar(100) NOT NULL,
	"about" varchar(1500),
	"assetUrl" varchar(500)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cbtTopic" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"cbtModuleId" varchar(10),
	"name" varchar(100) NOT NULL,
	"type" varchar(20),
	"thumbnailUrl" varchar(500),
	"resource" varchar(100000)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat" (
	"id" serial PRIMARY KEY NOT NULL,
	"datetime" timestamp,
	"userId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chatEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"therapistId" integer,
	"timeZone" varchar(40),
	"startTime" timestamp,
	"endTime" timestamp,
	"mobile" varchar(13),
	"dataPrivacyString" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client" (
	"id" serial PRIMARY KEY NOT NULL,
	"companyName" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"industry" varchar(120),
	"contactEmail" varchar(200),
	"KRAPin" varchar(200),
	"nEmployees" integer,
	CONSTRAINT "client_companyName_key" UNIQUE("companyName"),
	CONSTRAINT "client_label_key" UNIQUE("label"),
	CONSTRAINT "client_KRAPin_key" UNIQUE("KRAPin")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coachingSession" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_check_in" (
	"id" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"how_are_you_feeling" text,
	"mood_description" text,
	"mood_description_cause_category_1" text,
	"mood_description_cause_response_1" text,
	"mood_description_cause_category_2" text,
	"mood_description_cause_response_2" text,
	"mood_description_cause_category_3" text,
	"mood_description_cause_response_3" text,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discountCode" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"channel" varchar(20),
	"channelAgentRef" varchar(20),
	"timeStamp" timestamp,
	"completeDateTime" timestamp,
	"orderId" integer,
	"discount" integer,
	"ref" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enterpriseStandard" (
	"id" integer PRIMARY KEY NOT NULL,
	"clientId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favourited_affirmation" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"removed_at" timestamp,
	"category" text,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fitnessClass" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goal_category" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"title" varchar(255),
	"background_image_colour" varchar(100),
	"user_id" integer,
	"background_image_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goal_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"goal_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goals" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"description" text NOT NULL,
	"duration_start" timestamp with time zone,
	"duration_end" timestamp with time zone,
	"time_of_day" varchar(50),
	"weekly_frequency" integer,
	"reason_for_goal" text,
	"parent_goal_id" text,
	"goal_category_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groupEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"timeZone" varchar(40) DEFAULT 'Africa/Nairobi'::character varying,
	"groupTopicId" integer,
	"groupSessionId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groupPlan" (
	"id" serial PRIMARY KEY NOT NULL,
	"phoneEventCredits" integer,
	"groupEventCredits" integer,
	"onsiteEventCredits" integer,
	"timestamp" timestamp NOT NULL,
	"expireTime" timestamp NOT NULL,
	"clientId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groupPlanOrder" (
	"id" integer PRIMARY KEY NOT NULL,
	"groupPlanId" integer,
	"userId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groupSession" (
	"id" serial PRIMARY KEY NOT NULL,
	"startTime" timestamp,
	"endTime" timestamp,
	"therapistId" integer DEFAULT 8 NOT NULL,
	"groupTopicId" integer,
	"discordLink" varchar(120),
	"capacity" integer DEFAULT 15
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groupTopic" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"about" varchar(500) NOT NULL,
	"summary" varchar(100) NOT NULL,
	"relatedDomains" varchar(80) NOT NULL,
	"backgroundColor" varchar(30),
	"buttonColor" varchar(30),
	"assetUrl" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gymPass" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "human" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50),
	"name" varchar(80),
	"email" varchar(400),
	"mobile" varchar(120),
	"lastLogin" timestamp,
	CONSTRAINT "human_email_key" UNIQUE("email"),
	CONSTRAINT "mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "individualBasic" (
	"id" integer PRIMARY KEY NOT NULL,
	"autoRenew" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "insurance" (
	"id" integer PRIMARY KEY NOT NULL,
	"underwriter" varchar(200) NOT NULL,
	"underwriterRef" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"active" boolean,
	"userId" integer,
	CONSTRAINT "insurance_userId_key" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "joinShamiri" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(80),
	"organisationName" varchar(120),
	"contactEmail" varchar(120),
	"homeCity" varchar(120),
	"phoneNumber" varchar(120),
	"note" varchar(120)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journal" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"createdAt" timestamp,
	"userId" integer,
	"deletedAt" timestamp,
	"updatedAt" timestamp,
	"question_1" text NOT NULL,
	"content_1" text NOT NULL,
	"question_2" text,
	"content_2" text,
	"question_3" text,
	"content_3" text,
	"tag" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"datetime" timestamp,
	"text" varchar(1000),
	"chatId" integer NOT NULL,
	"role" varchar(20) DEFAULT 'assistant'::character varying NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onsiteEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"summary" varchar(500),
	"startTime" timestamp,
	"endTime" timestamp,
	"dataPrivacyString" varchar(100),
	"therapistId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" varchar(200),
	"quantity" integer,
	"unitPrice" integer,
	"currency" varchar(20),
	"timestamp" timestamp,
	"completeTimestamp" timestamp,
	"paymentMethod" varchar(15),
	"paymentRef" varchar(50),
	"paymentNote" varchar(100),
	"kind" varchar(25) DEFAULT 'subscriptionOrder'::character varying,
	CONSTRAINT "order_paymentRef_key" UNIQUE("paymentRef")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50),
	"name" varchar(80),
	"email" varchar(400),
	"phone" varchar(120),
	"location" varchar(6000),
	CONSTRAINT "organization_email_key" UNIQUE("email"),
	CONSTRAINT "organization_phone_key" UNIQUE("phone"),
	CONSTRAINT "organization_location_key" UNIQUE("location")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phoneEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"therapistId" integer DEFAULT 205,
	"googleTherapistEventId" varchar(120),
	"summary" varchar(500),
	"timeZone" varchar(40) DEFAULT 'Africa/Nairobi'::character varying,
	"startTime" timestamp,
	"endTime" timestamp,
	"mobile" varchar(13),
	"dataPrivacyString" varchar(100),
	CONSTRAINT "phoneEvent_googleTherapistEventId_key" UNIQUE("googleTherapistEventId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider" (
	"id" integer PRIMARY KEY NOT NULL,
	"photoUrl" varchar(500),
	"about" varchar(500),
	"summary" varchar(100),
	"timeZone" varchar(80),
	"workingTimeStart" varchar(15),
	"workingTimeEnd" varchar(15),
	"type" varchar(80)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "providerSession" (
	"id" serial PRIMARY KEY NOT NULL,
	"startTime" timestamp,
	"endTime" timestamp,
	"providerId" integer,
	"capacity" integer,
	"summary" varchar(200),
	"about" varchar(1000),
	"credit" integer,
	"type" varchar(80)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"question" varchar(1000),
	"userId" integer,
	"therapistId" integer,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickReplies" (
	"id" integer PRIMARY KEY NOT NULL,
	"optionId" integer,
	"value" integer,
	"text" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewardHubRecord" (
	"id" serial PRIMARY KEY NOT NULL,
	"userRewardHubId" integer,
	"level" integer,
	"levelName" varchar(15),
	"streak" integer,
	"gemsHave" integer,
	"gemsNextLevel" integer,
	"timestamp" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shamiriScore" (
	"id" serial PRIMARY KEY NOT NULL,
	"userDisplayId" integer,
	"domain" varchar(20) NOT NULL,
	"score" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"type" varchar NOT NULL,
	"timestamp" timestamp NOT NULL,
	"expireTime" timestamp NOT NULL,
	"totalCredit" integer,
	"remCredit" integer,
	"ref" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptionOrder" (
	"id" integer PRIMARY KEY NOT NULL,
	"userId" integer,
	"subscriptionId" integer,
	"subscriptionType" varchar(50),
	"type" varchar(200),
	"actionNow" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "systemResponse" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"responseId" integer,
	"measure" varchar(40),
	"measureShortName" varchar(40),
	"delay" integer,
	"variable" boolean,
	"text" varchar(200) NOT NULL,
	"altText1" varchar(500),
	"altText2" varchar(500),
	"altText3" varchar(500),
	"altText4" varchar(500),
	"wellbeing" boolean,
	"satisfaction" boolean,
	"social" boolean,
	"motivation" boolean,
	"purpose" boolean,
	"rewardHubActions" json[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teamAdmin" (
	"id" integer PRIMARY KEY NOT NULL,
	"clientId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teletherapyOrder" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"therapySessionType" varchar DEFAULT 'phoneEvent'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "text" (
	"id" integer PRIMARY KEY NOT NULL,
	"value" varchar(300)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapist" (
	"id" integer PRIMARY KEY NOT NULL,
	"photoUrl" varchar(500),
	"dateOfBirth" date NOT NULL,
	"about" varchar(500),
	"summary" varchar(100),
	"gmail" varchar(200) NOT NULL,
	"clinicalLevel" integer,
	"timeZone" varchar(80),
	"workingTimeStart" varchar(15),
	"workingTimeEnd" varchar(15),
	"specialtyTags" varchar(80),
	"supportPhone" boolean,
	"supportInPerson" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapistCal" (
	"id" integer PRIMARY KEY NOT NULL,
	"therapistId" integer,
	CONSTRAINT "therapistCal_therapistId_key" UNIQUE("therapistId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "therapySession" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(80),
	"clinicalLevel" integer,
	"relatedDomains" varchar(100),
	"recommendDatetime" timestamp,
	"completeDatetime" timestamp,
	"enrollDatetime" timestamp,
	"credit" integer,
	"userRecordId" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" integer PRIMARY KEY NOT NULL,
	"registeredOn" timestamp,
	"alias" varchar(120),
	"dateOfBirth" date,
	"avatarId" integer,
	"clientId" integer,
	"rafibot" "bytea",
	"gender" integer,
	"edLevel" integer,
	"marStatus" integer,
	"orgLevel" integer,
	"department" varchar(200),
	"workingTimeStart" varchar(15),
	"workingTimeEnd" varchar(15),
	"timeZone" varchar DEFAULT 'Africa/Nairobi',
	"gender2" varchar,
	"maritalStatus" varchar,
	"organizationalLevel" varchar,
	"educationalLevel" varchar,
	"pinH" "bytea" NOT NULL,
	"profession" text,
	CONSTRAINT "user_alias_key" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userAchievement" (
	"id" serial PRIMARY KEY NOT NULL,
	"userRewardHubId" integer,
	"achStreak1" timestamp,
	"achStreak2" timestamp,
	"achStreak3" timestamp,
	"achStreak4" timestamp,
	"achStreak5" timestamp,
	"achStreak6" timestamp,
	"achCheckin1" timestamp,
	"achCheckin2" timestamp,
	"achCheckin3" timestamp,
	"achCheckin4" timestamp,
	"achCheckin5" timestamp,
	"achCheckin6" timestamp,
	"achLevel1" timestamp,
	"achLevel2" timestamp,
	"achLevel3" timestamp,
	"achLevel4" timestamp,
	"achLevel5" timestamp,
	"achLevel6" timestamp,
	"achLevel7" timestamp,
	"achLevel8" timestamp,
	"achLevel9" timestamp,
	"achLevel10" timestamp,
	"gems" integer,
	"streak" integer,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"user_id" integer,
	"streak_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userBaselineRecord" (
	"id" integer PRIMARY KEY NOT NULL,
	"ed_level" integer,
	"gender" integer,
	"goal1Id" integer,
	"goal2Id" integer,
	"gad2_1" integer,
	"gad2_2" integer,
	"ghq12_1" integer,
	"ghq12_10" integer,
	"ghq12_11" integer,
	"ghq12_12" integer,
	"ghq12_2" integer,
	"ghq12_3" integer,
	"ghq12_4" integer,
	"ghq12_5" integer,
	"ghq12_6" integer,
	"ghq12_7" integer,
	"ghq12_8" integer,
	"ghq12_9" integer,
	"phq2_1" integer,
	"phq2_2" integer,
	"shamiri_1_1" integer,
	"shamiri_1_2" integer,
	"shamiri_2_1" integer,
	"shamiri_2_2" integer,
	"shamiri_3_1" integer,
	"shamiri_3_2" integer,
	"shamiri_4_1" integer,
	"shamiri_4_2" integer,
	"shamiri_5_1" integer,
	"shamiri_5_2" integer,
	"shamiriIndex" integer,
	"ghq8Index" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userCheckinRecord" (
	"id" integer PRIMARY KEY NOT NULL,
	"gad2_1" integer,
	"gad2_2" integer,
	"gadphq2_f" integer,
	"ghq4_1_1" integer,
	"ghq4_1_2" integer,
	"ghq4_1_3" integer,
	"ghq4_1_9" integer,
	"ghq4_2_10" integer,
	"ghq4_2_12" integer,
	"ghq4_2_4" integer,
	"ghq4_2_6" integer,
	"ghq4_3_11" integer,
	"ghq4_3_5" integer,
	"ghq4_3_7" integer,
	"ghq4_3_8" integer,
	"mspss_1" integer,
	"mspss_10" integer,
	"mspss_11" integer,
	"mspss_12" integer,
	"mspss_2" integer,
	"mspss_3" integer,
	"mspss_4" integer,
	"mspss_5" integer,
	"mspss_6" integer,
	"mspss_7" integer,
	"mspss_8" integer,
	"mspss_9" integer,
	"phq2_1" integer,
	"phq2_2" integer,
	"pils4_1" integer,
	"pils4_2" integer,
	"pils4_3" integer,
	"pils4_4" integer,
	"shamiri_1_1" integer,
	"shamiri_1_2" integer,
	"shamiri_2_1" integer,
	"shamiri_2_2" integer,
	"shamiri_3_1" integer,
	"shamiri_3_2" integer,
	"shamiri_4_1" integer,
	"shamiri_4_2" integer,
	"shamiri_5_1" integer,
	"shamiri_5_2" integer,
	"satisfaction_sha_2_1" integer,
	"motivation_pils4_4" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userDisplay" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"wellbeing" integer NOT NULL,
	"satisfaction" integer NOT NULL,
	"social" integer NOT NULL,
	"motivation" integer NOT NULL,
	"purpose" integer NOT NULL,
	"dateTime" timestamp NOT NULL,
	"userRecordId" integer,
	"dalleRef" varchar(50),
	"streamId" varchar(50),
	"discoverStreamId" varchar(50),
	CONSTRAINT "userDisplay_streamId_key" UNIQUE("streamId"),
	CONSTRAINT "userDisplay_discoverStreamId_key" UNIQUE("discoverStreamId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userGoal" (
	"id" serial PRIMARY KEY NOT NULL,
	"userRewardHubId" integer,
	"goal1Id" integer,
	"goal2Id" integer,
	"goal1Timeframe" integer,
	"goal1Scale" integer,
	"goal2Timeframe" integer,
	"goal2Scale" integer,
	"timestamp" timestamp NOT NULL,
	"goal1Baseline" double precision,
	"goal2Baseline" double precision
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userRecord" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"flow" varchar(60),
	"completeTimestamp" timestamp,
	"tags" varchar(200),
	"goals" varchar(200),
	"timestamp" timestamp,
	"stateId" varchar DEFAULT 'intake'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userResponse" (
	"id" serial PRIMARY KEY NOT NULL,
	"responseId" integer,
	"responseType" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userRewardHub" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"level" integer NOT NULL,
	"gemsHave" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userService" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"notificationTime" varchar(8) DEFAULT '10:00 AM'::character varying,
	"notificationOn" boolean DEFAULT true,
	"notificationOn2" boolean DEFAULT true,
	"notificationTime2" varchar DEFAULT '10:00 AM',
	"assignedTherapistId" integer DEFAULT 205
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userSystemResponse" (
	"id" serial PRIMARY KEY NOT NULL,
	"systemResponse_id" varchar(20),
	"userResponse_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wellnessEvent" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(80),
	"providerId" integer,
	"recommendDatetime" timestamp,
	"completeDatetime" timestamp,
	"enrollDatetime" timestamp,
	"providerSessionId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friendRequest" (
	"initiatorId" integer NOT NULL,
	"targetId" integer NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp,
	CONSTRAINT "friendRequest_pkey" PRIMARY KEY("initiatorId","targetId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friendship" (
	"leftId" integer NOT NULL,
	"rightId" integer NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp,
	CONSTRAINT "friendship_pkey" PRIMARY KEY("leftId","rightId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin" ADD CONSTRAINT "admin_id_fkey" FOREIGN KEY ("id") REFERENCES "human"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affirmation" ADD CONSTRAINT "affirmation_user_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affirmation_of_the_day" ADD CONSTRAINT "affirmation_of_the_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "affirmation_reminder" ADD CONSTRAINT "affirmation_reminder_creator_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alacarteOrder" ADD CONSTRAINT "alacarteOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alacarteOrder" ADD CONSTRAINT "alacarteOrder_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "insurance"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alacarteOrder" ADD CONSTRAINT "alacarteOrder_id_fkey" FOREIGN KEY ("id") REFERENCES "order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cbtEvent" ADD CONSTRAINT "cbtEvent_cbtCourseId_fkey" FOREIGN KEY ("cbtCourseId") REFERENCES "cbtCourse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cbtEvent" ADD CONSTRAINT "cbtEvent_id_fkey" FOREIGN KEY ("id") REFERENCES "therapySession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cbtModule" ADD CONSTRAINT "cbtModule_cbtCourseId_fkey" FOREIGN KEY ("cbtCourseId") REFERENCES "cbtCourse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cbtTopic" ADD CONSTRAINT "cbtTopic_cbtModuleId_fkey" FOREIGN KEY ("cbtModuleId") REFERENCES "cbtModule"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatEvent" ADD CONSTRAINT "chatEvent_id_fkey" FOREIGN KEY ("id") REFERENCES "therapySession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chatEvent" ADD CONSTRAINT "chatEvent_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coachingSession" ADD CONSTRAINT "coachingSession_id_fkey" FOREIGN KEY ("id") REFERENCES "providerSession"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_check_in" ADD CONSTRAINT "daily_check_in_user_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discountCode" ADD CONSTRAINT "discountCode_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enterpriseStandard" ADD CONSTRAINT "enterpriseStandard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enterpriseStandard" ADD CONSTRAINT "enterpriseStandard_id_fkey" FOREIGN KEY ("id") REFERENCES "subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favourited_affirmation" ADD CONSTRAINT "favourited_affirmation_user_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fitnessClass" ADD CONSTRAINT "fitnessClass_id_fkey" FOREIGN KEY ("id") REFERENCES "providerSession"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_category" ADD CONSTRAINT "goal_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_parent_goal_id_fkey" FOREIGN KEY ("parent_goal_id") REFERENCES "goals"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_goal_category_id_fkey" FOREIGN KEY ("goal_category_id") REFERENCES "goal_category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupEvent" ADD CONSTRAINT "groupEvent_groupSessionId_fkey" FOREIGN KEY ("groupSessionId") REFERENCES "groupSession"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupEvent" ADD CONSTRAINT "groupEvent_groupTopicId_fkey" FOREIGN KEY ("groupTopicId") REFERENCES "groupTopic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupEvent" ADD CONSTRAINT "groupEvent_id_fkey" FOREIGN KEY ("id") REFERENCES "therapySession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupPlan" ADD CONSTRAINT "groupPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupPlanOrder" ADD CONSTRAINT "groupPlanOrder_groupPlanId_fkey" FOREIGN KEY ("groupPlanId") REFERENCES "groupPlan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupPlanOrder" ADD CONSTRAINT "groupPlanOrder_id_fkey" FOREIGN KEY ("id") REFERENCES "order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupPlanOrder" ADD CONSTRAINT "groupPlanOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupSession" ADD CONSTRAINT "groupSession_groupTopicId_fkey" FOREIGN KEY ("groupTopicId") REFERENCES "groupTopic"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groupSession" ADD CONSTRAINT "groupSession_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gymPass" ADD CONSTRAINT "gymPass_id_fkey" FOREIGN KEY ("id") REFERENCES "providerSession"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "individualBasic" ADD CONSTRAINT "individualBasic_id_fkey" FOREIGN KEY ("id") REFERENCES "subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "insurance" ADD CONSTRAINT "insurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journal" ADD CONSTRAINT "journal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onsiteEvent" ADD CONSTRAINT "fk_onsiteevent_therapist_id" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onsiteEvent" ADD CONSTRAINT "fk_onsiteevent_therapysession_id" FOREIGN KEY ("id") REFERENCES "therapySession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phoneEvent" ADD CONSTRAINT "phoneEvent_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phoneEvent" ADD CONSTRAINT "phoneEvent_id_fkey" FOREIGN KEY ("id") REFERENCES "therapySession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider" ADD CONSTRAINT "provider_id_fkey" FOREIGN KEY ("id") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "providerSession" ADD CONSTRAINT "providerSession_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quickReplies" ADD CONSTRAINT "quickReplies_id_fkey" FOREIGN KEY ("id") REFERENCES "userResponse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewardHubRecord" ADD CONSTRAINT "rewardHubRecord_userRewardHubId_fkey" FOREIGN KEY ("userRewardHubId") REFERENCES "userRewardHub"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shamiriScore" ADD CONSTRAINT "shamiriScore_userDisplayId_fkey" FOREIGN KEY ("userDisplayId") REFERENCES "userDisplay"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptionOrder" ADD CONSTRAINT "subscriptionOrder_id_fkey" FOREIGN KEY ("id") REFERENCES "order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptionOrder" ADD CONSTRAINT "subscriptionOrder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptionOrder" ADD CONSTRAINT "subscriptionOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teamAdmin" ADD CONSTRAINT "teamAdmin_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teamAdmin" ADD CONSTRAINT "teamAdmin_id_fkey" FOREIGN KEY ("id") REFERENCES "human"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teletherapyOrder" ADD CONSTRAINT "teletherapyOrder_userid_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teletherapyOrder" ADD CONSTRAINT "teletherapyOrder_id_fkey" FOREIGN KEY ("id") REFERENCES "order"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "text" ADD CONSTRAINT "text_id_fkey" FOREIGN KEY ("id") REFERENCES "userResponse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapist" ADD CONSTRAINT "therapist_id_fkey" FOREIGN KEY ("id") REFERENCES "human"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapistCal" ADD CONSTRAINT "therapistCal_id_fkey" FOREIGN KEY ("id") REFERENCES "calendar"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapistCal" ADD CONSTRAINT "therapistCal_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "therapySession" ADD CONSTRAINT "therapySession_userRecordId_fkey" FOREIGN KEY ("userRecordId") REFERENCES "userRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_id_fkey" FOREIGN KEY ("id") REFERENCES "human"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userAchievement" ADD CONSTRAINT "userAchievement_userRewardHubId_fkey" FOREIGN KEY ("userRewardHubId") REFERENCES "userRewardHub"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userAchievement" ADD CONSTRAINT "userAchievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userBaselineRecord" ADD CONSTRAINT "userBaselineRecord_id_fkey" FOREIGN KEY ("id") REFERENCES "userRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userCheckinRecord" ADD CONSTRAINT "userCheckinRecord_id_fkey" FOREIGN KEY ("id") REFERENCES "userRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userDisplay" ADD CONSTRAINT "userDisplay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userDisplay" ADD CONSTRAINT "userDisplay_userRecordId_fkey" FOREIGN KEY ("userRecordId") REFERENCES "userRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userGoal" ADD CONSTRAINT "userGoal_userRewardHubId_fkey" FOREIGN KEY ("userRewardHubId") REFERENCES "userRewardHub"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userRecord" ADD CONSTRAINT "userRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userRewardHub" ADD CONSTRAINT "userRewardHub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userService" ADD CONSTRAINT "userService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userService" ADD CONSTRAINT "userService_assignedTherapistId_fkey" FOREIGN KEY ("assignedTherapistId") REFERENCES "therapist"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userSystemResponse" ADD CONSTRAINT "userSystemResponse_systemResponse_id_fkey" FOREIGN KEY ("systemResponse_id") REFERENCES "systemResponse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userSystemResponse" ADD CONSTRAINT "userSystemResponse_userResponse_id_fkey" FOREIGN KEY ("userResponse_id") REFERENCES "userResponse"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wellnessEvent" ADD CONSTRAINT "wellnessEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "provider"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendRequest" ADD CONSTRAINT "friendRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendship" ADD CONSTRAINT "friendship_leftId_fkey" FOREIGN KEY ("leftId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friendship" ADD CONSTRAINT "friendship_rightId_fkey" FOREIGN KEY ("rightId") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

*/