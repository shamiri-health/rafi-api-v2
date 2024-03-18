import { FastifyPluginAsync } from "fastify";
import { sample, sampleSize } from "lodash";
import { systemResponse, userResponse, userSystemResponse } from "../../database/schema";
import { inArray, eq } from "drizzle-orm";
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
  "shamiri4_1",
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

const weeklyCheckInRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
  fastify.get("/question-set", {}, async (request, reply) => {
    const wellbeingQuestionIds = sampleSize(WELLBEING_QUESTION_IDS, 4);

    /*
     * checks to ensure that we don't select duplicate question IDs
     * in case they were already selected in the wellbeing category
     */
    const socialQuestionId: any = sample(
      SOCIAL_QUESTION_IDS.filter((id) => !wellbeingQuestionIds.includes(id)),
    );
    const satisfactionQuestionId: any = sample(
      SATISFACTION_QUESTION_IDS.filter(
        (id) => !wellbeingQuestionIds.includes(id),
      ),
    );
    const motivationQuestionId: any = sample(
      MOTIVATION_QUESTION_IDS.filter(
        (id) => !wellbeingQuestionIds.includes(id),
      ),
    );

    const purposeQuestionId: any = sample(
      PURPOSE_QUESTION_IDS.filter((id) => !wellbeingQuestionIds.includes(id)),
    );

    const questionIdArray = [
      ...wellbeingQuestionIds,
      socialQuestionId,
      satisfactionQuestionId,
      motivationQuestionId,
      purposeQuestionId,
    ];

    const questionResponses = await fastify.db
      .select()
      .from(systemResponse)
      .leftJoin(userSystemResponse, eq(systemResponse.id, userSystemResponse.systemResponseId))
      .leftJoin(userResponse, eq(userSystemResponse.userResponseId, userResponse.id))
      .where(inArray(systemResponse.id, questionIdArray));

    const apiResponse = questionResponses.map((response) => {
      const questionTextVariants = [
        response.systemResponse.text,
        response.systemResponse.altText1,
        response.systemResponse.altText2,
        response.systemResponse.altText3,
        response.systemResponse.altText4,
      ];

      const text = questionTextVariants.filter((qst) => !!qst);
      const domain = getDomain(
        response.systemResponse.id,
        wellbeingQuestionIds,
        motivationQuestionId,
        purposeQuestionId,
        satisfactionQuestionId,
        socialQuestionId,
      );

      return {
        domain,
        text
      }
    });

    console.log(apiResponse)
    return apiResponse
  });
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
