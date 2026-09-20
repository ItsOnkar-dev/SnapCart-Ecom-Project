import dotenv from "dotenv";
import { z } from "zod";
import { Logger } from "../utils/logger";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

    ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
    REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
    REFRESH_TOKEN_HASH_SECRET: z
      .string()
      .min(1, "REFRESH_TOKEN_HASH_SECRET is required"),

    CLOUDINARY_CLOUD_NAME: z
      .string()
      .min(1, "CLOUDINARY_CLOUD_NAME is required"),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
    CLOUDINARY_API_SECRET: z
      .string()
      .min(1, "CLOUDINARY_API_SECRET is required"),

    RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
    RAZORPAY_WEBHOOK_SECRET: z
      .string()
      .min(1, "RAZORPAY_WEBHOOK_SECRET is required"),

    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    GOOGLE_CALLBACK_URL: z
      .string()
      .url("GOOGLE_CALLBACK_URL must be a valid URL"),

    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z
      .string()
      .email("RESEND_FROM_EMAIL must be a valid email address")
      .optional(),
    RESEND_EMAIL: z
      .string()
      .email("RESEND_EMAIL must be a valid email address")
      .optional(),
    EMAIL_VERIFICATION_DEMO_MODE: z.string().optional().default("true"),

    ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email address"),
    ADMIN_PASSWORD: z
      .string()
      .min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production") {
      const secrets = [
        { key: "ACCESS_TOKEN_SECRET", value: env.ACCESS_TOKEN_SECRET },
        { key: "REFRESH_TOKEN_SECRET", value: env.REFRESH_TOKEN_SECRET },
        {
          key: "REFRESH_TOKEN_HASH_SECRET",
          value: env.REFRESH_TOKEN_HASH_SECRET,
        },
      ];

      secrets.forEach(({ key, value }) => {
        if (value.length < 32) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${key} must be at least 32 characters long in production`,
            path: [key],
          });
        }
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  Logger.error("❌ Invalid or missing environment variables:");

  parsedEnv.error.issues.forEach((issue) => {
    Logger.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });

  process.exit(1);
}

export const env = {
  port: parsedEnv.data.PORT,
  nodeEnv: parsedEnv.data.NODE_ENV,
  mongoUri: parsedEnv.data.MONGO_URI,
  frontendUrl: parsedEnv.data.FRONTEND_URL,

  jwt: {
    accessSecret: parsedEnv.data.ACCESS_TOKEN_SECRET,
    refreshSecret: parsedEnv.data.REFRESH_TOKEN_SECRET,
    refreshHashSecret: parsedEnv.data.REFRESH_TOKEN_HASH_SECRET,
  },

  cloudinary: {
    cloudName: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsedEnv.data.CLOUDINARY_API_KEY,
    apiSecret: parsedEnv.data.CLOUDINARY_API_SECRET,
  },

  razorpay: {
    keyId: parsedEnv.data.RAZORPAY_KEY_ID,
    keySecret: parsedEnv.data.RAZORPAY_KEY_SECRET,
    webhookSecret: parsedEnv.data.RAZORPAY_WEBHOOK_SECRET,
  },

  google: {
    clientId: parsedEnv.data.GOOGLE_CLIENT_ID,
    clientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsedEnv.data.GOOGLE_CALLBACK_URL,
  },

  email: {
    resendApiKey: parsedEnv.data.RESEND_API_KEY,
    resendFrom: parsedEnv.data.RESEND_FROM_EMAIL,
    adminNotificationEmail: parsedEnv.data.RESEND_EMAIL,
    demoMode: parsedEnv.data.EMAIL_VERIFICATION_DEMO_MODE,
  },

  adminBootstrap: {
    email: parsedEnv.data.ADMIN_EMAIL,
    password: parsedEnv.data.ADMIN_PASSWORD,
  },
} as const;
