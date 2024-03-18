import { FastifyPluginAsync } from "fastify";
import { random, sample, sampleSize } from "lodash";
import {
  quickReplies,
  systemResponse,
  userResponse,
  userSystemResponse,
} from "../../database/schema";
import { inArray, eq } from "drizzle-orm";
import assert from "node:assert";
import { Static, Type } from "@sinclair/typebox";

const WELLBEING_QUESTION_IDS = [
  "ghq12_10",
  "ghq12_11",
  "ghq12_12",
  "ghq12_2",
  "ghq12_3",
  "ghq12_4",
  "ghq12_5",
  "ghq12_6",
  "ghq12_7",
  "ghq12_8",
  "ghq12_9",
];

const SOCIAL_QUESTION_IDS = [
  "mspss_1",
  "mspss_10",
  "mspss_11",
  "mspss_12",
  "mspss_2",
  "mspss_3",
  "mspss_4",
  "mspss_5",
  "mspss_6",
  "mspss_7",
  "mspss_8",
  "mspss_9",
  "shamiri_3_1",
  "shamiri_3_2",
];

const SATISFACTION_QUESTION_IDS = [
  "b_phq2_1",
  "b_phq2_2",
  "ghq12_10",
  "ghq12_12",
  "ghq12_3",
  "ghq12_7",
  "ghq12_9",
  "phq2_1",
  "phq2_2",
  "pils4_1",
  "pils4_2",
  "pils4_3",
  "pils4_4",
  "shamiri_2_1",
  "shamiri_2_2",
  "satisfaction_sha_2_1",
  "motivation_pils4_4",
];

const MOTIVATION_QUESTION_IDS = [
  "gadphq2_f",
  "ghq12_1",
  "ghq12_3",
  "ghq12_4",
  "ghq12_5",
  "ghq12_6",
  "ghq12_8",
  "shamiri_4_1",
  "shamiri_4_2",
  "motivation_pils4_4",
];

const PURPOSE_QUESTION_IDS = [
  "ghq12_11",
  "ghq12_3",
  "pils4_1",
  "pils4_2",
  "pils4_3",
  "pils4_4",
  "shamiri_5_1",
  "shamiri_5_2",
  "motivation_pils4_4",
];

const QuestionSetResponseObject = Type.Object({
  id: Type.String(),
  responseId: Type.Number(),
  measure: Type.String(),
  measureShortName: Type.String(),
  text: Type.String(),
  domain: Type.String(),
  replies: Type.Array(
    Type.Object({
      responseId: Type.Number(),
      systemResponseId: Type.Number(),
      value: Type.Number(),
      id: Type.Number(),
      title: Type.String(),
    }),
  ),
});

const QuestionSetResponseSchema = Type.Array(QuestionSetResponseObject);

type QuestionSetResponseObject = Static<QuestionSetResponseObject>;

const weeklyCheckInRouter: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {
  fastify.get(
    "/question-set",
    { schema: { response: { 200: QuestionSetResponseSchema } } },
    async (request, reply) => {
      const questionIdArray: string[] = [];
      const wellbeingQuestionIds = sampleSize(WELLBEING_QUESTION_IDS, 4);
      wellbeingQuestionIds.forEach((id) => questionIdArray.push(id));

      /*
       * checks to ensure that we don't select duplicate question IDs
       * in case they were already selected in the wellbeing category
       */
      const socialQuestionId: any = sample(
        SOCIAL_QUESTION_IDS.filter((id) => !questionIdArray.includes(id)),
      );
      questionIdArray.push(socialQuestionId);

      const satisfactionQuestionId: any = sample(
        SATISFACTION_QUESTION_IDS.filter((id) => !questionIdArray.includes(id)),
      );
      questionIdArray.push(satisfactionQuestionId);

      const motivationQuestionId: any = sample(
        MOTIVATION_QUESTION_IDS.filter((id) => !questionIdArray.includes(id)),
      );
      questionIdArray.push(motivationQuestionId);

      const purposeQuestionId: any = sample(
        PURPOSE_QUESTION_IDS.filter((id) => !questionIdArray.includes(id)),
      );
      questionIdArray.push(purposeQuestionId);

      const questionResponses = await fastify.db
        .select()
        .from(systemResponse)
        .leftJoin(
          userSystemResponse,
          eq(systemResponse.id, userSystemResponse.systemResponseId),
        )
        .leftJoin(
          userResponse,
          eq(userSystemResponse.userResponseId, userResponse.id),
        )
        .leftJoin(quickReplies, eq(userResponse.id, quickReplies.id))
        .where(inArray(systemResponse.id, questionIdArray));

      const simplifiedQuestionResponse = questionResponses.reduce<
        Record<string, QuestionSetResponseObject>
      >((acc, val) => {
        const { systemResponse: dbSystemResponse } = val;

        if (acc[dbSystemResponse.id]) {
          acc[dbSystemResponse.id].replies.push({
            responseId: val.userResponse?.responseId,
            systemResponseId: val.userResponse?.id,
            value: val.quickReplies?.optionId,
            id: val.userResponse?.id,
            title: val.quickReplies?.text,
          });
        } else {
          const { text, altText1, altText2, altText3, altText4 } =
            dbSystemResponse;

          const textList = [
            text,
            altText1,
            altText2,
            altText3,
            altText4,
          ].filter((t) => Boolean(t));
          acc[dbSystemResponse.id] = {
            id: dbSystemResponse.id,
            responseId: dbSystemResponse.responseId,
            measure: dbSystemResponse.measure,
            measureShortName: dbSystemResponse.measureShortName,
            text: sample(textList),
            domain: getDomain(
              dbSystemResponse.id,
              wellbeingQuestionIds,
              motivationQuestionId,
              purposeQuestionId,
              satisfactionQuestionId,
              socialQuestionId,
            ),
            replies: [
              {
                responseId: val.userResponse?.responseId,
                systemResponseId: val.userResponse?.id,
                value: val.quickReplies?.optionId,
                id: val.userResponse?.id,
                title: val.quickReplies?.text,
              },
            ],
          };
        }

        return acc;
      }, {});

      const formattedQuestionAndReplies = Object.values(
        simplifiedQuestionResponse,
      );
      assert.strictEqual(
        formattedQuestionAndReplies.length,
        8,
        "We were expecting 8 questions but we got a different figure. Initial question ID list: " +
          JSON.stringify(questionIdArray) +
          ", final question ID list: " +
          JSON.stringify(Object.keys(simplifiedQuestionResponse)),
      );

      // sort the array so that wellbeing questions return first
      formattedQuestionAndReplies.sort((a, b) => {
        if (a.domain === "wellbeing") return -1;
        return random(1, 5);
      });

      return formattedQuestionAndReplies;
    },
  );
};

function getDomain(
  key: string,
  wellbeingList: string[],
  motivationKey: string,
  purposeKey: string,
  satisfactionKey: string,
  socialKey: string,
) {
  if (wellbeingList.includes(key)) return "wellbeing";

  switch (key) {
    case motivationKey:
      return "motivation";
    case purposeKey:
      return "purpose";
    case satisfactionKey:
      return "satisfaction";
    case socialKey:
      return "social";
  }

  throw new Error(
    `The supplied question id ${key} does not have an associated domain`,
  );
}

export default weeklyCheckInRouter;
