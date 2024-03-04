import { test } from "tap";
import { build } from "../../helper";

test("GET /ask-a-therapist/community-questions should return a set of 5 questions", async (t) => {
  // given
  const app = await build(t);

  // when
  const res = await app.inject().get("/ask-a-therapist/community-questions");
  const body = await res.json();

  // then
  t.equal(body.length, 5);
  t.hasProps(body[0], ["question", "answer", "category"]);
});
