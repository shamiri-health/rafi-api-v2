import { connect } from "getstream";

const client = connect(
  process.env.STREAM_API_KEY ?? "something fake",
  process.env.STREAM_API_SECRET ?? "something fake",
);

export function addUserToStream(
  userId: string,
  userName: string,
  phoneNumber: string,
) {
  return client.user(userId).create({
    name: userName,
    phoneNumber,
  });
}

// export default client;
