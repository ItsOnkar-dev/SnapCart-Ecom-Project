// utils/sendVerificationEmail.ts
import crypto from "crypto";
import { Resend } from "resend";
import { IUser } from "../types/user.types";

// generates token pair — exported separately so register controller can use it too
export const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

// sends the actual email — takes the user and the RAW token
export const sendVerificationEmail = async (user: IUser, rawToken: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  // build the link the user will click
  // FRONTEND_URL because the link should land on a frontend page
  // that page will then call your backend API with the token
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
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
