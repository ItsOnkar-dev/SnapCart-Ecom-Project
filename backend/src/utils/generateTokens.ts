import jwt from "jsonwebtoken";

// Creates a short-lived token (15 minutes) — used to access protected routes
export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role }, // data to store inside the token
    process.env.ACCESS_TOKEN_SECRET as string, // secret key to sign the token
    { expiresIn: "15m" }, // token dies after 15 minutes
  );
};

// Creates a long-lived token (7 days) — used to generate new access tokens
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: "7d" }, // token dies after 7 days
  );
};
