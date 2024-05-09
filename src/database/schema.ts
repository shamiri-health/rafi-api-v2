import {
  pgTable,
  foreignKey,
  text,
  timestamp,
  integer,
  varchar,
  unique,
  serial,
  boolean,
  doublePrecision,
  date,
  json,
  primaryKey,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const affirmationOfTheDay = pgTable("affirmation_of_the_day", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
  category: text("category"),
  subCategory: text("sub_category"),
  affirmation: text("affirmation"),
  userId: integer("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
});

export const affirmationReminder = pgTable("affirmation_reminder", {
  id: text("id"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  category: text("category"),
  name: text("name"),
  frequency: text("frequency"),
  numberOfTimes: integer("number_of_times"),
  userId: integer("user_id").references(() => user.id),
});

export const alacarteOrder = pgTable("alacarteOrder", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => order.id),
  userId: integer("userId").references(() => user.id),
});

export const alembicVersion = pgTable("alembic_version", {
  versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const cbtEvent = pgTable("cbtEvent", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .notNull()
    .references(() => therapySession.id, { onDelete: "cascade" }),
  userModule: integer("userModule"),
  cbtCourseId: integer("cbtCourseId").references(() => cbtCourse.id),
  userProgress: varchar("userProgress", { length: 10 }),
});

export const blacklistToken = pgTable(
  "blacklistToken",
  {
    id: serial("id").primaryKey().notNull(),
    token: varchar("token", { length: 500 }).notNull(),
    blacklistedOn: timestamp("blacklistedOn", { mode: "date" }).notNull(),
  },
  (table) => {
    return {
      blacklistTokenTokenKey: unique("blacklistToken_token_key").on(
        table.token,
      ),
    };
  },
);

export const cbtModule = pgTable("cbtModule", {
  id: varchar("id", { length: 10 }).primaryKey().notNull(),
  cbtCourseId: integer("cbtCourseId").references(() => cbtCourse.id),
  name: varchar("name", { length: 100 }).notNull(),
  about: varchar("about", { length: 1500 }),
  assetUrl: varchar("assetUrl", { length: 500 }),
});

export const calendar = pgTable(
  "calendar",
  {
    id: serial("id").primaryKey().notNull(),
    googleId: varchar("googleId", { length: 120 }),
    summary: varchar("summary", { length: 80 }),
    timeZone: varchar("timeZone", { length: 40 }).default(
      sql`'Africa/Nairobi'::character varying`,
    ),
    description: varchar("description", { length: 80 }),
    type: varchar("type", { length: 40 }),
  },
  (table) => {
    return {
      calendarGoogleIdKey: unique("calendar_googleId_key").on(table.googleId),
    };
  },
);

export const admin = pgTable("admin", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => human.id),
});

export const affirmation = pgTable("affirmation", {
  id: varchar("id", { length: 120 }),
  createdAt: timestamp("createdAt", { mode: "date" }),
  updatedAt: timestamp("updatedAt", { mode: "date" }),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
  content: text("content"),
  category: text("category"),
  userId: integer("userId").references(() => user.id),
  backgroundFileName: text("background_file_name"),
});

export const answers = pgTable("answers", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  answer: varchar("answer", { length: 1000 }),
  questionId: varchar("questionId").references(() => questions.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
});

export const cbtCourse = pgTable("cbtCourse", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  summary: varchar("summary", { length: 100 }).notNull(),
  modulesString: varchar("modulesString", { length: 200 }).notNull(),
  relatedDomains: varchar("relatedDomains", { length: 80 }).notNull(),
  about: varchar("about", { length: 1500 }),
  assetUrl: varchar("assetUrl"),
  backgroundColor: varchar("backgroundColor").default(
    "rgba(67, 143, 120, 0.1)",
  ),
  buttonColor: varchar("buttonColor", { length: 30 }).default(
    sql`'rgba(67, 143, 120)'::character varying`,
  ),
});

export const chat = pgTable("chat", {
  id: serial("id").primaryKey().notNull(),
  datetime: timestamp("datetime", { mode: "date" }),
  userId: integer("userId")
    .notNull()
    .references(() => user.id),
});

export const cbtTopic = pgTable("cbtTopic", {
  id: varchar("id", { length: 10 }).primaryKey().notNull(),
  cbtModuleId: varchar("cbtModuleId", { length: 10 }).references(
    () => cbtModule.id,
  ),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  resource: varchar("resource", { length: 100000 }),
});

export const chatEvent = pgTable("chatEvent", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .notNull()
    .references(() => therapySession.id, { onDelete: "cascade" }),
  therapistId: integer("therapistId").references(() => therapist.id),
  timeZone: varchar("timeZone", { length: 40 }),
  startTime: timestamp("startTime", { mode: "date" }),
  endTime: timestamp("endTime", { mode: "date" }),
  mobile: varchar("mobile", { length: 13 }),
  dataPrivacyString: varchar("dataPrivacyString", { length: 100 }),
});

export const client = pgTable(
  "client",
  {
    id: serial("id").primaryKey().notNull(),
    companyName: varchar("companyName", { length: 80 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    industry: varchar("industry", { length: 120 }),
    contactEmail: varchar("contactEmail", { length: 200 }),
    kraPin: varchar("KRAPin", { length: 200 }),
    nEmployees: integer("nEmployees"),
  },
  (table) => {
    return {
      clientCompanyNameKey: unique("client_companyName_key").on(
        table.companyName,
      ),
      clientLabelKey: unique("client_label_key").on(table.label),
      clientKraPinKey: unique("client_KRAPin_key").on(table.kraPin),
    };
  },
);

export const discountCode = pgTable("discountCode", {
  id: varchar("id", { length: 15 }).primaryKey().notNull(),
  channel: varchar("channel", { length: 20 }),
  channelAgentRef: varchar("channelAgentRef", { length: 20 }),
  timeStamp: timestamp("timeStamp", { mode: "date" }),
  completeDateTime: timestamp("completeDateTime", { mode: "date" }),
  orderId: integer("orderId").references(() => order.id),
  discount: integer("discount"),
  ref: varchar("ref", { length: 100 }),
});

export const dailyCheckIn = pgTable("daily_check_in", {
  id: text("id"),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  howAreYouFeeling: text("how_are_you_feeling"),
  moodDescription: text("mood_description"),
  moodDescriptionCauseCategory1: text("mood_description_cause_category_1"),
  moodDescriptionCauseResponse1: text("mood_description_cause_response_1"),
  moodDescriptionCauseCategory2: text("mood_description_cause_category_2"),
  moodDescriptionCauseResponse2: text("mood_description_cause_response_2"),
  moodDescriptionCauseCategory3: text("mood_description_cause_category_3"),
  moodDescriptionCauseResponse3: text("mood_description_cause_response_3"),
  userId: integer("user_id").references(() => user.id),
});

export const favouritedAffirmation = pgTable("favourited_affirmation", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  removedAt: timestamp("removed_at", { mode: "date" }),
  category: text("category"),
  userId: integer("user_id").references(() => user.id),
});

export const goals = pgTable(
  "goals",
  {
    id: varchar("id", { length: 100 }).primaryKey().notNull(),
    userId: integer("user_id").references(() => user.id),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    description: text("description").notNull(),
    durationStart: timestamp("duration_start", {
      withTimezone: true,
      mode: "date",
    }),
    durationEnd: timestamp("duration_end", {
      withTimezone: true,
      mode: "date",
    }),
    timeOfDay: varchar("time_of_day", { length: 50 }),
    weeklyFrequency: integer("weekly_frequency"),
    reasonForGoal: text("reason_for_goal"),
    parentGoalId: text("parent_goal_id"),
    goalCategoryId: text("goal_category_id").references(() => goalCategory.id, {
      onDelete: "set null",
    }),
  },
  (table) => {
    return {
      goalsParentGoalIdFkey: foreignKey({
        columns: [table.parentGoalId],
        foreignColumns: [table.id],
        name: "goals_parent_goal_id_fkey",
      }).onDelete("set null"),
    };
  },
);

export const groupEvent = pgTable("groupEvent", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .notNull()
    .references(() => therapySession.id, { onDelete: "cascade" }),
  timeZone: varchar("timeZone", { length: 40 }).default(
    sql`'Africa/Nairobi'::character varying`,
  ),
  groupTopicId: integer("groupTopicId").references(() => groupTopic.id),
  groupSessionId: integer("groupSessionId").references(() => groupSession.id),
});

export const groupTopic = pgTable("groupTopic", {
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  about: varchar("about", { length: 500 }).notNull(),
  summary: varchar("summary", { length: 100 }).notNull(),
  relatedDomains: varchar("relatedDomains", { length: 80 }).notNull(),
  backgroundColor: varchar("backgroundColor", { length: 30 }),
  buttonColor: varchar("buttonColor", { length: 30 }),
  assetUrl: varchar("assetUrl", { length: 100 }),
});

export const groupSession = pgTable("groupSession", {
  id: serial("id").primaryKey().notNull(),
  startTime: timestamp("startTime", { mode: "date" }),
  endTime: timestamp("endTime", { mode: "date" }),
  therapistId: integer("therapistId")
    .default(8)
    .notNull()
    .references(() => therapist.id),
  groupTopicId: integer("groupTopicId").references(() => groupTopic.id),
  discordLink: varchar("discordLink", { length: 120 }),
  capacity: integer("capacity").default(15),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  dayOfWeek: integer("day_of_week"),
});

export const goalCategory = pgTable("goal_category", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  title: varchar("title", { length: 255 }),
  backgroundImageColour: varchar("background_image_colour", { length: 100 }),
  userId: integer("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  backgroundImageName: text("background_image_name"),
});

export const groupPlan = pgTable("groupPlan", {
  id: serial("id").primaryKey().notNull(),
  phoneEventCredits: integer("phoneEventCredits"),
  groupEventCredits: integer("groupEventCredits"),
  onsiteEventCredits: integer("onsiteEventCredits"),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  expireTime: timestamp("expireTime", { mode: "date" }).notNull(),
  clientId: integer("clientId").references(() => client.id),
});

export const groupPlanOrder = pgTable("groupPlanOrder", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => order.id),
  groupPlanId: integer("groupPlanId").references(() => groupPlan.id),
  userId: integer("userId").references(() => user.id),
});

export const human = pgTable(
  "human",
  {
    id: serial("id").primaryKey().notNull(),
    role: varchar("role", { length: 50 }),
    name: varchar("name", { length: 80 }),
    email: varchar("email", { length: 400 }),
    mobile: varchar("mobile", { length: 120 }),
    lastLogin: timestamp("lastLogin", { mode: "date" }),
  },
  (table) => {
    return {
      humanEmailKey: unique("human_email_key").on(table.email),
      mobileUnique: unique("mobile_unique").on(table.mobile),
    };
  },
);

export const journal = pgTable("journal", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }),
  userId: integer("userId").references(() => user.id),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
  updatedAt: timestamp("updatedAt", { mode: "date" }),
  question1: text("question_1").notNull(),
  content1: text("content_1").notNull(),
  question2: text("question_2"),
  content2: text("content_2"),
  question3: text("question_3"),
  content3: text("content_3"),
  tag: text("tag"),
});

export const onsiteEvent = pgTable("onsiteEvent", {
  id: varchar("id", { length: 64 })
    .primaryKey()
    .notNull()
    .references(() => therapySession.id, { onDelete: "cascade" }),
  summary: varchar("summary", { length: 500 }),
  startTime: timestamp("startTime", { mode: "date" }),
  endTime: timestamp("endTime", { mode: "date" }),
  dataPrivacyString: varchar("dataPrivacyString", { length: 100 }),
  therapistId: integer("therapistId").references(() => therapist.id),
});

export const phoneEvent = pgTable(
  "phoneEvent",
  {
    id: varchar("id", { length: 64 })
      .primaryKey()
      .notNull()
      .references(() => therapySession.id, { onDelete: "cascade" }),
    therapistId: integer("therapistId")
      .default(205)
      .references(() => therapist.id),
    googleTherapistEventId: varchar("googleTherapistEventId", { length: 120 }),
    summary: varchar("summary", { length: 500 }),
    timeZone: varchar("timeZone", { length: 40 }).default(
      sql`'Africa/Nairobi'::character varying`,
    ),
    startTime: timestamp("startTime", { mode: "date" }),
    endTime: timestamp("endTime", { mode: "date" }),
    mobile: varchar("mobile", { length: 13 }),
    dataPrivacyString: varchar("dataPrivacyString", { length: 100 }),
  },
  (table) => {
    return {
      phoneEventGoogleTherapistEventIdKey: unique(
        "phoneEvent_googleTherapistEventId_key",
      ).on(table.googleTherapistEventId),
    };
  },
);

export const quickReplies = pgTable("quickReplies", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => userResponse.id),
  optionId: integer("optionId"),
  value: integer("value"),
  text: varchar("text", { length: 200 }).notNull(),
});

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: text("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
    archivedAt: timestamp("archived_at", { mode: "date" }),
    email: varchar("email", { length: 100 }),
    referralCode: varchar("referral_code", { length: 100 }),
    clientId: integer("client_id").references(() => client.id),
    name: varchar("name", { length: 100 }),
  },
  (table) => {
    return {
      referralCodesEmailKey: unique("referral_codes_email_key").on(table.email),
      uniqueEmailReferralCodeCombination: unique(
        "unique_email_referral_code_combination",
      ).on(table.email, table.referralCode),
      referralCodesReferralCodeKey: unique(
        "referral_codes_referral_code_key",
      ).on(table.referralCode),
    };
  },
);

export const message = pgTable("message", {
  id: serial("id").primaryKey().notNull(),
  datetime: timestamp("datetime", { mode: "date" }),
  text: varchar("text", { length: 1000 }),
  chatId: integer("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role", { length: 20 })
    .default(sql`'assistant'::character varying`)
    .notNull(),
});

export const order = pgTable(
  "order",
  {
    id: serial("id").primaryKey().notNull(),
    status: varchar("status", { length: 200 }),
    quantity: integer("quantity"),
    unitPrice: integer("unitPrice"),
    currency: varchar("currency", { length: 20 }),
    timestamp: timestamp("timestamp", { mode: "date" }),
    completeTimestamp: timestamp("completeTimestamp", { mode: "date" }),
    paymentMethod: varchar("paymentMethod", { length: 15 }),
    paymentRef: varchar("paymentRef", { length: 50 }),
    paymentNote: varchar("paymentNote", { length: 100 }),
    kind: varchar("kind", { length: 25 }).default(
      sql`'subscriptionOrder'::character varying`,
    ),
  },
  (table) => {
    return {
      orderPaymentRefKey: unique("order_paymentRef_key").on(table.paymentRef),
    };
  },
);

export const questions = pgTable("questions", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  question: varchar("question", { length: 1000 }),
  userId: integer("userId"),
  therapistId: integer("therapistId").references(() => therapist.id),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
});

export const questionRelations = relations(questions, ({ many }) => ({
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

export const rewardHubRecord = pgTable("rewardHubRecord", {
  id: serial("id").primaryKey().notNull(),
  userRewardHubId: integer("userRewardHubId").references(
    () => userRewardHub.id,
  ),
  level: integer("level"),
  levelName: varchar("levelName", { length: 15 }),
  streak: integer("streak"),
  gemsHave: integer("gemsHave"),
  gemsNextLevel: integer("gemsNextLevel"),
  timestamp: timestamp("timestamp", { mode: "date" }),
  userId: integer("user_id").references(() => user.id)
});

export const subscription = pgTable("subscription", {
  id: serial("id").primaryKey().notNull(),
  userId: integer("userId").references(() => user.id),
  type: varchar("type").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  expireTime: timestamp("expireTime", { mode: "date" }).notNull(),
  totalCredit: integer("totalCredit"),
  remCredit: integer("remCredit"),
  ref: varchar("ref", { length: 100 }),
});

export const therapySession = pgTable("therapySession", {
  id: varchar("id", { length: 64 }).primaryKey().notNull(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 80 }),
  clinicalLevel: integer("clinicalLevel"),
  relatedDomains: varchar("relatedDomains", { length: 100 }),
  recommendDatetime: timestamp("recommendDatetime", { mode: "date" }),
  completeDatetime: timestamp("completeDatetime", { mode: "date" }),
  enrollDatetime: timestamp("enrollDatetime", { mode: "date" }),
  credit: integer("credit"),
  userRecordId: integer("userRecordId").references(() => userRecord.id),
});

export const therapist = pgTable("therapist", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => human.id),
  photoUrl: varchar("photoUrl", { length: 500 }),
  dateOfBirth: date("dateOfBirth").notNull(),
  about: varchar("about", { length: 500 }),
  summary: varchar("summary", { length: 100 }),
  gmail: varchar("gmail", { length: 200 }).notNull(),
  clinicalLevel: integer("clinicalLevel"),
  timeZone: varchar("timeZone", { length: 80 }),
  workingTimeStart: varchar("workingTimeStart", { length: 15 }),
  workingTimeEnd: varchar("workingTimeEnd", { length: 15 }),
  specialtyTags: varchar("specialtyTags", { length: 80 }),
  supportPhone: boolean("supportPhone"),
  supportInPerson: boolean("supportInPerson"),
  clientId: integer("client_id").references(() => client.id),
});

export const shamiriScore = pgTable("shamiriScore", {
  id: serial("id").primaryKey().notNull(),
  userDisplayId: integer("userDisplayId").references(() => userDisplay.id),
  domain: varchar("domain", { length: 20 }).notNull(),
  score: integer("score").notNull(),
});

export const subscriptionOrder = pgTable("subscriptionOrder", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => order.id),
  userId: integer("userId").references(() => user.id),
  subscriptionId: integer("subscriptionId").references(() => subscription.id),
  subscriptionType: varchar("subscriptionType", { length: 50 }),
  type: varchar("type", { length: 200 }),
  actionNow: boolean("actionNow").notNull(),
});

export const teletherapyOrder = pgTable("teletherapyOrder", {
  id: serial("id")
    .primaryKey()
    .notNull()
    .references(() => order.id),
  userId: integer("userId").references(() => user.id),
  therapySessionType: varchar("therapySessionType").default("phoneEvent"),
});

export const therapistCal = pgTable(
  "therapistCal",
  {
    id: integer("id")
      .primaryKey()
      .notNull()
      .references(() => calendar.id),
    therapistId: integer("therapistId").references(() => therapist.id),
  },
  (table) => {
    return {
      therapistCalTherapistIdKey: unique("therapistCal_therapistId_key").on(
        table.therapistId,
      ),
    };
  },
);

export const systemResponse = pgTable("systemResponse", {
  id: varchar("id", { length: 20 }).primaryKey().notNull(),
  responseId: integer("responseId"),
  measure: varchar("measure", { length: 40 }),
  measureShortName: varchar("measureShortName", { length: 40 }),
  delay: integer("delay"),
  variable: boolean("variable"),
  text: varchar("text", { length: 200 }).notNull(),
  altText1: varchar("altText1", { length: 500 }),
  altText2: varchar("altText2", { length: 500 }),
  altText3: varchar("altText3", { length: 500 }),
  altText4: varchar("altText4", { length: 500 }),
  wellbeing: boolean("wellbeing"),
  satisfaction: boolean("satisfaction"),
  social: boolean("social"),
  motivation: boolean("motivation"),
  purpose: boolean("purpose"),
  rewardHubActions: json("rewardHubActions").array(),
});

export const userAchievement = pgTable("userAchievement", {
  id: serial("id").primaryKey().notNull(),
  userRewardHubId: integer("userRewardHubId").references(
    () => userRewardHub.id,
  ),
  achStreak1: timestamp("achStreak1", { mode: "date" }),
  achStreak2: timestamp("achStreak2", { mode: "date" }),
  achStreak3: timestamp("achStreak3", { mode: "date" }),
  achStreak4: timestamp("achStreak4", { mode: "date" }),
  achStreak5: timestamp("achStreak5", { mode: "date" }),
  achStreak6: timestamp("achStreak6", { mode: "date" }),
  achCheckin1: timestamp("achCheckin1", { mode: "date" }),
  achCheckin2: timestamp("achCheckin2", { mode: "date" }),
  achCheckin3: timestamp("achCheckin3", { mode: "date" }),
  achCheckin4: timestamp("achCheckin4", { mode: "date" }),
  achCheckin5: timestamp("achCheckin5", { mode: "date" }),
  achCheckin6: timestamp("achCheckin6", { mode: "date" }),
  achLevel1: timestamp("achLevel1", { mode: "date" }),
  achLevel2: timestamp("achLevel2", { mode: "date" }),
  achLevel3: timestamp("achLevel3", { mode: "date" }),
  achLevel4: timestamp("achLevel4", { mode: "date" }),
  achLevel5: timestamp("achLevel5", { mode: "date" }),
  achLevel6: timestamp("achLevel6", { mode: "date" }),
  achLevel7: timestamp("achLevel7", { mode: "date" }),
  achLevel8: timestamp("achLevel8", { mode: "date" }),
  achLevel9: timestamp("achLevel9", { mode: "date" }),
  achLevel10: timestamp("achLevel10", { mode: "date" }),
  gems: integer("gems"),
  streak: integer("streak"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).defaultNow(),
  userId: integer("user_id").references(() => user.id),
  streakUpdatedAt: timestamp("streak_updated_at", {
    withTimezone: true,
    mode: "date",
  }),
  level: integer("level")
});

export const userSystemResponse = pgTable("userSystemResponse", {
  id: serial("id").primaryKey().notNull(),
  systemResponseId: varchar("systemResponse_id", { length: 20 }).references(
    () => systemResponse.id,
  ),
  userResponseId: integer("userResponse_id").references(() => userResponse.id),
});

export const user = pgTable(
  "user",
  {
    id: integer("id")
      .primaryKey()
      .notNull()
      .references(() => human.id),
    registeredOn: timestamp("registeredOn", { mode: "date" }),
    alias: varchar("alias", { length: 120 }),
    dateOfBirth: date("dateOfBirth"),
    avatarId: integer("avatarId"),
    clientId: integer("clientId").references(() => client.id),
    // TODO: failed to parse database type 'bytea'
    rafibot: bytea("rafibot"),
    gender: integer("gender"),
    edLevel: integer("edLevel"),
    marStatus: integer("marStatus"),
    orgLevel: integer("orgLevel"),
    department: varchar("department", { length: 200 }),
    workingTimeStart: varchar("workingTimeStart", { length: 15 }),
    workingTimeEnd: varchar("workingTimeEnd", { length: 15 }),
    timeZone: varchar("timeZone").default("Africa/Nairobi"),
    gender2: varchar("gender2"),
    maritalStatus: varchar("maritalStatus"),
    organizationalLevel: varchar("organizationalLevel"),
    educationalLevel: varchar("educationalLevel"),
    // TODO: failed to parse database type 'bytea'
    pinH: bytea("pinH").notNull(),
    profession: text("profession"),
    referralRecordId: varchar("referral_record_id", { length: 100 }).references(
      () => referralCodes.id,
    ),
  },
  (table) => {
    return {
      userAliasKey: unique("user_alias_key").on(table.alias),
    };
  },
);

export const userRewardHub = pgTable("userRewardHub", {
  id: serial("id").primaryKey().notNull(),
  userId: integer("userId").references(() => user.id),
  level: integer("level").notNull(),
  gemsHave: integer("gemsHave").notNull(),
});

export const userDisplay = pgTable(
  "userDisplay",
  {
    id: serial("id").primaryKey().notNull(),
    userId: integer("userId").references(() => user.id),
    wellbeing: integer("wellbeing").notNull(),
    satisfaction: integer("satisfaction").notNull(),
    social: integer("social").notNull(),
    motivation: integer("motivation").notNull(),
    purpose: integer("purpose").notNull(),
    dateTime: timestamp("dateTime", { mode: "date" }).notNull(),
    userRecordId: integer("userRecordId").references(() => userRecord.id),
    dalleRef: varchar("dalleRef", { length: 50 }),
    streamId: varchar("streamId", { length: 50 }),
    discoverStreamId: varchar("discoverStreamId", { length: 50 }),
  },
  (table) => {
    return {
      userDisplayStreamIdKey: unique("userDisplay_streamId_key").on(
        table.streamId,
      ),
      userDisplayDiscoverStreamIdKey: unique(
        "userDisplay_discoverStreamId_key",
      ).on(table.discoverStreamId),
    };
  },
);

export const userRecord = pgTable("userRecord", {
  id: serial("id").primaryKey().notNull(),
  userId: integer("userId")
    .notNull()
    .references(() => user.id),
  flow: varchar("flow", { length: 60 }),
  completeTimestamp: timestamp("completeTimestamp", { mode: "date" }),
  tags: varchar("tags", { length: 200 }),
  goals: varchar("goals", { length: 200 }),
  timestamp: timestamp("timestamp", { mode: "date" }),
  stateId: varchar("stateId").default("intake"),
});

export const userBaselineRecord = pgTable("userBaselineRecord", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => userRecord.id),
  edLevel: integer("ed_level"),
  gender: integer("gender"),
  goal1Id: integer("goal1Id"),
  goal2Id: integer("goal2Id"),
  gad21: integer("gad2_1"),
  gad22: integer("gad2_2"),
  ghq121: integer("ghq12_1"),
  ghq1210: integer("ghq12_10"),
  ghq1211: integer("ghq12_11"),
  ghq1212: integer("ghq12_12"),
  ghq122: integer("ghq12_2"),
  ghq123: integer("ghq12_3"),
  ghq124: integer("ghq12_4"),
  ghq125: integer("ghq12_5"),
  ghq126: integer("ghq12_6"),
  ghq127: integer("ghq12_7"),
  ghq128: integer("ghq12_8"),
  ghq129: integer("ghq12_9"),
  phq21: integer("phq2_1"),
  phq22: integer("phq2_2"),
  shamiri11: integer("shamiri_1_1"),
  shamiri12: integer("shamiri_1_2"),
  shamiri21: integer("shamiri_2_1"),
  shamiri22: integer("shamiri_2_2"),
  shamiri31: integer("shamiri_3_1"),
  shamiri32: integer("shamiri_3_2"),
  shamiri41: integer("shamiri_4_1"),
  shamiri42: integer("shamiri_4_2"),
  shamiri51: integer("shamiri_5_1"),
  shamiri52: integer("shamiri_5_2"),
  shamiriIndex: integer("shamiriIndex"),
  ghq8Index: integer("ghq8Index"),
});

export const userCheckinRecord = pgTable("userCheckinRecord", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .references(() => userRecord.id),
  gad21: integer("gad2_1"),
  gad22: integer("gad2_2"),
  gadphq2F: integer("gadphq2_f"),
  ghq411: integer("ghq4_1_1"),
  ghq412: integer("ghq4_1_2"),
  ghq413: integer("ghq4_1_3"),
  ghq419: integer("ghq4_1_9"),
  ghq4210: integer("ghq4_2_10"),
  ghq4212: integer("ghq4_2_12"),
  ghq424: integer("ghq4_2_4"),
  ghq426: integer("ghq4_2_6"),
  ghq4311: integer("ghq4_3_11"),
  ghq435: integer("ghq4_3_5"),
  ghq437: integer("ghq4_3_7"),
  ghq438: integer("ghq4_3_8"),
  mspss1: integer("mspss_1"),
  mspss10: integer("mspss_10"),
  mspss11: integer("mspss_11"),
  mspss12: integer("mspss_12"),
  mspss2: integer("mspss_2"),
  mspss3: integer("mspss_3"),
  mspss4: integer("mspss_4"),
  mspss5: integer("mspss_5"),
  mspss6: integer("mspss_6"),
  mspss7: integer("mspss_7"),
  mspss8: integer("mspss_8"),
  mspss9: integer("mspss_9"),
  phq21: integer("phq2_1"),
  phq22: integer("phq2_2"),
  pils41: integer("pils4_1"),
  pils42: integer("pils4_2"),
  pils43: integer("pils4_3"),
  pils44: integer("pils4_4"),
  shamiri11: integer("shamiri_1_1"),
  shamiri12: integer("shamiri_1_2"),
  shamiri21: integer("shamiri_2_1"),
  shamiri22: integer("shamiri_2_2"),
  shamiri31: integer("shamiri_3_1"),
  shamiri32: integer("shamiri_3_2"),
  shamiri41: integer("shamiri_4_1"),
  shamiri42: integer("shamiri_4_2"),
  shamiri51: integer("shamiri_5_1"),
  shamiri52: integer("shamiri_5_2"),
  satisfactionSha21: integer("satisfaction_sha_2_1"),
  motivationPils44: integer("motivation_pils4_4"),
});

export const userGoal = pgTable("userGoal", {
  id: serial("id").primaryKey().notNull(),
  userRewardHubId: integer("userRewardHubId").references(
    () => userRewardHub.id,
  ),
  goal1Id: integer("goal1Id"),
  goal2Id: integer("goal2Id"),
  goal1Timeframe: integer("goal1Timeframe"),
  goal1Scale: integer("goal1Scale"),
  goal2Timeframe: integer("goal2Timeframe"),
  goal2Scale: integer("goal2Scale"),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  goal1Baseline: doublePrecision("goal1Baseline"),
  goal2Baseline: doublePrecision("goal2Baseline"),
});

export const userService = pgTable("userService", {
  id: serial("id").primaryKey().notNull(),
  userId: integer("userId").references(() => user.id),
  notificationTime: varchar("notificationTime", { length: 8 }).default(
    sql`'10:00 AM'::character varying`,
  ),
  notificationOn: boolean("notificationOn").default(true),
  notificationOn2: boolean("notificationOn2").default(true),
  notificationTime2: varchar("notificationTime2").default("10:00 AM"),
  assignedTherapistId: integer("assignedTherapistId")
    .default(205)
    .references(() => therapist.id),
});

export const goalProgress = pgTable("goal_progress", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
  goalId: text("goal_id").references(() => goals.id, {
    onDelete: "set null",
  }),
});

export const userResponse = pgTable("userResponse", {
  id: serial("id").primaryKey().notNull(),
  responseId: integer("responseId"),
  responseType: varchar("responseType", { length: 20 }).notNull(),
});

export const friendRequest = pgTable(
  "friendRequest",
  {
    initiatorId: integer("initiatorId")
      .notNull()
      .references(() => user.id),
    targetId: integer("targetId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt", { mode: "date" }),
    updatedAt: timestamp("updatedAt", { mode: "date" }),
  },
  (table) => {
    return {
      friendRequestPkey: primaryKey({
        columns: [table.initiatorId, table.targetId],
        name: "friendRequest_pkey",
      }),
    };
  },
);

export const friendship = pgTable(
  "friendship",
  {
    leftId: integer("leftId")
      .notNull()
      .references(() => user.id),
    rightId: integer("rightId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt", { mode: "date" }),
    updatedAt: timestamp("updatedAt", { mode: "date" }),
  },
  (table) => {
    return {
      friendshipPkey: primaryKey({
        columns: [table.leftId, table.rightId],
        name: "friendship_pkey",
      }),
    };
  },
);

export const subscriptionType = pgTable("subscription_type", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  description: text("description").notNull(),
  durationDays: integer("duration_days"),
  durationMonths: integer("duration_months"),
  price: integer("price"),
  archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
});

export const subscriptionV2 = pgTable("subscription_v2", {
  id: varchar("id", { length: 100 }).primaryKey().notNull(),
  userId: integer("user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  subscriptionTypeId: varchar("subscription_type_id", { length: 100 })
    .notNull()
    .references(() => subscriptionType.id),
  startDate: timestamp("start_date", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  endDate: timestamp("end_date", {
    mode: "date",
    withTimezone: true,
  }).notNull(),
  cancelledAt: timestamp("cancelled_at", {
    mode: "date",
    withTimezone: true,
  }),
});
