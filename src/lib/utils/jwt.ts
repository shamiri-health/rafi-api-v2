import jwt from "jsonwebtoken";
/*
import { database } from '../db';
import { eq } from 'drizzle-orm';
import { blacklistToken, human } from '../../database/schema';
import { httpErrors } from '@fastify/sensible';
*/

const DEFAULT_SECRET = "shamiri is the best";

export function encodeAuthToken(
  humanId: number,
  access: "user" | "therapist" | "admin",
) {
  const now = Date.now();
  const sixtyDaysInSeconds = 60 * 24 * 3600; // sixty days in seconds
  const payload = {
    exp: Math.floor((now + sixtyDaysInSeconds) / 1000), // required to convert to seconds
    iat: Math.floor(now / 1000),
    sub: humanId,
    access,
  };

  return jwt.sign(payload, process.env.JWT_SECRET ?? DEFAULT_SECRET, {
    algorithm: "HS256",
  });
}

// // FIXME: tighten type of logger
// export async function decodeAuthToken(token: string, db: database['db'], logger: any) {
//   const invalidToken = await db.query.blacklistToken.findFirst({
//     where: eq(blacklistToken.token, token)
//   })
//
//   if (invalidToken) {
//     throw httpErrors.forbidden("Token is invalid, please reauthenticate")
//   }
//
//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET ?? DEFAULT_SECRET, { algorithms: ['HS256'] })
//     console.log(typeof payload.sub);
//     const existingHuman = await db.query.human.findFirst({
//       // @ts-ignore
//       where: eq(human.id, payload.sub)
//     })
//
//     if (!existingHuman) {
//       throw httpErrors.notFound(`Account with given id ${payload.sub} was not found`)
//     }
//   } catch (err) {
//     // @t
//     logger.error(err.message)
//
//   }
// }
