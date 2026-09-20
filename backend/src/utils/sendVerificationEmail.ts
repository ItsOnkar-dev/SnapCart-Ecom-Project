import crypto from "crypto";
import { Resend } from "resend";
import { env } from "../config/validateEnv";
import { IUser } from "../types/user.types";

export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

export const sendVerificationEmail = async (user: IUser, rawToken: string) => {
  const resend = new Resend(env.email.resendApiKey);
  const verificationLink = `${env.frontendUrl}/verify-email?token=${rawToken}`;

  await resend.emails.send({
    from: `SnapCart <${env.email.resendFrom}>` as string,
    to: user.email,
    subject: "Verify your SnapCart account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to SnapCart, ${user.name}!</h2>
        <p>Click the button below to verify your email address. This link expires in 10 minutes.</p>
        <a href="${verificationLink}"
           style="display:inline-block; padding:12px 24px; background:#000; color:#fff;
                  text-decoration:none; border-radius:6px; margin-top:12px;">
          Verify Email
        </a>
        <p style="margin-top:24px; color:#888; font-size:13px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};
