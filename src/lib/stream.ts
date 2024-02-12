import { connect } from "getstream";

const client = connect(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET,
);

export default client;
