import crypto from "crypto";
import { env } from "../config/validateEnv";

const getHashSecret = (): string => {
  return (
    env.jwt.refreshHashSecret ||
    env.jwt.refreshSecret ||
    env.jwt.accessSecret ||
    ""
  );
};

export const hashToken = (
  token: string,
  secret: string = getHashSecret(),
): string => {
  if (!secret) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  return crypto.createHmac("sha256", secret).update(token).digest("hex");
};

export const isMatchingTokenHash = (
  token: string,
  hashedToken: string,
): boolean => {
  return hashToken(token) === hashedToken;
};
