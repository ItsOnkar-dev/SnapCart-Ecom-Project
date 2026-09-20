import { Resend } from "resend";
import { env } from "../config/validateEnv";
import { IUser } from "../types/user.types";

export const sendPasswordResetEmail = async (user: IUser, rawToken: string) => {
  const resend = new Resend(env.email.resendApiKey);

  const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;

  await resend.emails.send({
    from: `SnapCart <${env.email.resendFrom}>` as string,
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
