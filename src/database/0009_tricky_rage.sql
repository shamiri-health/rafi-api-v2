-- Custom SQL migration file, put you code below! --
UPDATE "userAchievement"
SET "user_id" = "userRewardHub"."userId"
FROM "userRewardHub"
WHERE "userAchievement"."userRewardHubId" = "userRewardHub"."id"
