import { connect } from "getstream";

const client = connect(
  process.env.STREAM_API_KEY ?? "something fake",
  process.env.STREAM_API_SECRET ?? "something fake",
);

export default client;
