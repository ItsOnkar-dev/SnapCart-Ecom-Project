import { OAuth2Client } from "google-auth-library";
import { env } from "./validateEnv";

export const getGoogleClient = (): OAuth2Client => {
  return new OAuth2Client(
    env.google.clientId,
    env.google.clientSecret,
    env.google.callbackUrl,
  );
};
