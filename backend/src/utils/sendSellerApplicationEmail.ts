import { Resend } from "resend";
import { env } from "../config/validateEnv";
import { IUser } from "../types/user.types";

export const sendSellerApplicationEmail = async (applicant: IUser) => {
  const resend = new Resend(env.email.resendApiKey);
  const application = applicant.sellerApplication;

  await resend.emails.send({
    from: `SnapCart <${env.email.resendFrom}>` as string,
    to: env.email.adminNotificationEmail as string, // admin's email from env — never hardcoded
    subject: "New seller application — SnapCart",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>New Seller Application</h2>
        <p>A user has submitted a seller application and is waiting for review.</p>
        <table style="width:100%; border-collapse:collapse; margin-top:16px;">
          <tr>
            <td style="padding:8px; color:#888;">Name</td>
            <td style="padding:8px;"><strong>${applicant.name}</strong></td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:8px; color:#888;">Email</td>
            <td style="padding:8px;">${applicant.email}</td>
          </tr>
          <tr>
            <td style="padding:8px; color:#888;">Applied at</td>
            <td style="padding:8px;">${new Date().toLocaleString()}</td>
          </tr>
          ${
            application?.storeName
              ? `<tr style="background:#f9f9f9;">
                  <td style="padding:8px; color:#888;">Store</td>
                  <td style="padding:8px;">${application.storeName}</td>
                </tr>`
              : ""
          }
          ${
            application?.contactPhone
              ? `<tr>
                  <td style="padding:8px; color:#888;">Phone</td>
                  <td style="padding:8px;">${application.contactPhone}</td>
                </tr>`
              : ""
          }
        </table>
        <a href="${env.frontendUrl}/admin/review-seller"
           style="display:inline-block; padding:12px 24px; background:#000; color:#fff;
                  text-decoration:none; border-radius:6px; margin-top:24px;">
          Review Application
        </a>
        <p style="margin-top:24px; color:#888; font-size:13px;">
          You are receiving this because you are the SnapCart admin.
        </p>
      </div>
    `,
  });
};
