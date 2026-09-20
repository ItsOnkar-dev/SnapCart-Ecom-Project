import crypto from "crypto";
import { hashToken } from "./hashToken";

export const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = hashToken(rawToken);

  return { rawToken, hashedToken };
};
