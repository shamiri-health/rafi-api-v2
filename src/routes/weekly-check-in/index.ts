import { FastifyPluginAsync } from "fastify";
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

const journalRouter: FastifyPluginAsync = async (
  fastify,
  _,
): Promise<void> => {};

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

export default journalRouter;
