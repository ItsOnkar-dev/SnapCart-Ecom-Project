import crypto from "crypto";

export const generateResetToken = () => {
  // raw token: what gets emailed to the user, never touches the DB
  const rawToken = crypto.randomBytes(32).toString("hex");

  // hashed token: what gets stored in the DB, so a DB leak is useless to an attacker
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
};
