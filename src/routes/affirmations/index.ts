import { FastifyPluginAsync } from "fastify";
import Affirmations from "../../../static/affirmations.json";

interface Affirmation {
    [category: string]: {
        [subCategory: string]: string[]
    }
}
const CATEGORIES = Object.keys(Affirmations);
const AFFIRMATIONBANK: Affirmation = Affirmations;

const affirmationsRouter: FastifyPluginAsync = async (fastify, _): Promise<void> => {
    // @ts-ignore
    fastify.addHook("onRegister", fastify.authenticate);

    fastify.get("/all", async () => {
        const output: Affirmation = {};
        for (let category of CATEGORIES) {
            const subCategoryObj: { [category: string]: string[] } = {};
            const subCategories = Object.keys(AFFIRMATIONBANK[category]);

            for (let subCategory of subCategories) {
                const prompts = AFFIRMATIONBANK[category][subCategory];
                subCategoryObj[subCategory] = prompts;
            }
            output[category] = subCategoryObj;
        }
        return output;
    })
}

export default affirmationsRouter;

// @router.get("/all", response_model=dict[str, dict[str, list[str]]])
// async def fetch_all_affirmations():
//     categories = list(AFFIRMATION_PROMPTS.keys())
//     random.shuffle(categories)

//     output = {}
//     for category in categories:
//         sub_category_dict = {}
//         sub_categories = list(AFFIRMATION_PROMPTS[category])
//         random.shuffle(sub_categories)

//         for sub_category in sub_categories:
//             prompts = AFFIRMATION_PROMPTS[category][sub_category]
//             random.shuffle(prompts)
//             sub_category_dict[sub_category] = prompts

//         output[category] = sub_category_dict

//     return output