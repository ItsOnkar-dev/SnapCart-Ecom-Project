// utils/sendPasswordResetEmail.ts
import { Resend } from "resend";
import { IUser } from "../types/user.types";

// sends the actual email — takes the user and the RAW token
// (same shape as sendVerificationEmail: raw token here, hashed token in DB)
export const sendPasswordResetEmail = async (user: IUser, rawToken: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // FRONTEND_URL because the link should land on a frontend page
  // that page collects the new password, then calls your backend API with the token
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  await resend.emails.send({ 
    from: process.env.RESEND_FROM_EMAIL as string,
    to: user.email,
    subject: "Reset your SnapCart password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Reset your password</h2>
        <p>Hi ${user.name}, we received a request to reset your SnapCart password. This link expires in 15 minutes.</p>
        <a href="${resetLink}"
           style="display:inline-block; padding:12px 24px; background:#000; color:#fff;
                  text-decoration:none; border-radius:6px; margin-top:12px;">
          Reset Password
        </a>
        <p style="margin-top:24px; color:#888; font-size:13px;">
          If you didn't request this, you can safely ignore this email — your password will not be changed.
        </p>
      </div>
    `,
  });
};
