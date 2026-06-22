import { OAuth2Client } from "google-auth-library";

// Create client fresh each time it's needed
// This ensures .env is already loaded before we read from it
export const getGoogleClient = (): OAuth2Client => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL,
  );
};
