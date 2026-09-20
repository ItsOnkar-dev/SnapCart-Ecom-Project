import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/validateEnv";

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role, jti: uuidv4() },
    env.jwt.accessSecret as string,
    { expiresIn: "15m" },
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwt.refreshSecret as string, {
    expiresIn: "7d",
  });
};
