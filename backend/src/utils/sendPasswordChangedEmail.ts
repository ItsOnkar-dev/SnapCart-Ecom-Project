import { Resend } from "resend";
import { IUser } from "../types/user.types";

// fires after resetPassword OR changePassword succeeds —
// security notice so the real owner knows if someone else did this
export const sendPasswordChangedEmail = async (user: IUser) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: user.email,
    subject: "Your SnapCart password was changed",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Password changed</h2>
        <p>Hi ${user.name}, your SnapCart account password was just changed.</p>
        <p>If this was you, no action is needed.</p>
        <p style="margin-top:16px;">
          If you did <strong>not</strong> make this change, reset your password immediately:
        </p>
        <a href="${process.env.FRONTEND_URL}/forgot-password"
           style="display:inline-block; padding:12px 24px; background:#e00; color:#fff;
                  text-decoration:none; border-radius:6px; margin-top:8px;">
          Secure My Account
        </a>
        <p style="margin-top:24px; color:#888; font-size:13px;">
          This is an automated security notification from SnapCart.
        </p>
      </div>
    `,
  });
};
