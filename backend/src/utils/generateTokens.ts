import jwt from "jsonwebtoken";
import { env } from "../config/validateEnv";
import { v4 as uuidv4 } from "uuid";

// Creates a short-lived token (15 minutes) — used to access protected routes
export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role, jti: uuidv4() }, // data to store inside the token. // jti: unique token ID
    env.jwt.accessSecret as string, // secret key to sign the token
    { expiresIn: "15m" }, // token dies after 15 minutes
  );
};

// Creates a long-lived token (7 days) — used to generate new access tokens
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    env.jwt.refreshSecret as string,
    { expiresIn: "7d" }, // token dies after 7 days
  );
};
