import crypto from "crypto";
import { hashToken } from "./hashToken";

export const generateResetToken = () => {
  // raw token: what gets emailed to the user, never touches the DB
  const rawToken = crypto.randomBytes(32).toString("hex");

  // hashed token: what gets stored in the DB, so a DB leak is useless to an attacker
  const hashedToken = hashToken(rawToken);

  return { rawToken, hashedToken };
};
