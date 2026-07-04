import crypto from "crypto";

const getHashSecret = (): string => {
  return (
    process.env.REFRESH_TOKEN_HASH_SECRET ||
    process.env.REFRESH_TOKEN_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
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
