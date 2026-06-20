declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    NODE_ENV: "development" | "production" | "test";
    MONGODB_URI: string;

    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_SECRET: string;

    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GOOGLE_CALLBACK_URL: string;

    FRONTEND_URL: string;
  }
}
