import { Resend } from "resend";

export const sendWishlistEmail = async (toEmail: string, wishlistLink: string, senderName: string) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL as string,
    to: toEmail,
    subject: `${senderName} shared a SnapCart Wishlist with you!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #111;">SnapCart Wishlist</h2>
        <p>Hi there,</p>
        <p><strong>${senderName}</strong> has shared their SnapCart wishlist with you. You can view the items and add them to your cart by clicking the link below:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${wishlistLink}"
             style="display:inline-block; padding:12px 24px; background:#000; color:#fff;
                    text-decoration:none; border-radius:6px; font-weight: bold;">
            View Shared Wishlist
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          Happy Shopping!<br/>
          The SnapCart Team
        </p>
      </div>
    `,
  });
};
