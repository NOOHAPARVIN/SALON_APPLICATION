import nodemailer from 'nodemailer';

interface SendApprovalEmailParams {
  toEmail: string;
  ownerName: string;
  companyName: string;
  loginUrl: string;
}

interface SendRejectionEmailParams {
  toEmail: string;
  ownerName: string;
  companyName: string;
}

export async function sendApprovalEmail({ toEmail, ownerName, companyName, loginUrl }: SendApprovalEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log(`[Mailer] Sending workspace approval email to: ${toEmail} for company "${companyName}"...`);

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Salon Management System'}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: toEmail,
        subject: `🎉 Your Workspace "${companyName}" Has Been Approved!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #3a4a35; margin-bottom: 16px;">Congratulations ${ownerName || 'Salon Owner'}!</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Great news! Your workspace registration for <strong style="color: #2d3748;">${companyName}</strong> has been officially approved by our Super Admin.
            </p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #c29957; margin: 24px 0;">
              <p style="margin: 0 0 12px 0; color: #2d3748; font-weight: bold;">🔑 Quick Access Details:</p>
              <p style="margin: 4px 0; color: #718096; font-size: 14px;">Email: <strong>${toEmail}</strong></p>
              <p style="margin: 4px 0; color: #718096; font-size: 14px;">Status: <span style="color: #38a169; font-weight: bold;">Active / Approved</span></p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" style="background-color: #3a4a35; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                Access Your Salon Dashboard
              </a>
            </div>

            <p style="color: #a0aec0; font-size: 12px; border-t: 1px solid #edf2f7; pt: 16px; margin-top: 32px;">
              Direct Link: <a href="${loginUrl}" style="color: #4299e1;">${loginUrl}</a>
            </p>
          </div>
        `
      });

      console.log(`[Mailer] Approval email successfully dispatched to ${toEmail}`);
    } catch (err: any) {
      console.error(`[Mailer] Error sending approval email via SMTP:`, err.message);
    }
  } else {
    console.log(`[Mailer] SMTP credentials not set. Simulated Email Dispatch:
    ---------------------------------------------------
    TO: ${toEmail}
    SUBJECT: 🎉 Your Workspace "${companyName}" Has Been Approved!
    LINK: ${loginUrl}
    ---------------------------------------------------`);
  }
}

export async function sendRejectionEmail({ toEmail, ownerName, companyName }: SendRejectionEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Salon Management System'}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: toEmail,
        subject: `Update regarding your workspace request for "${companyName}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #2d3748;">Hello ${ownerName || 'Applicant'},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Thank you for your interest. Regrettably, your workspace registration request for <strong>${companyName}</strong> was not approved at this time.
            </p>
            <p style="color: #718096; font-size: 14px;">
              If you have any questions or believe this is an error, please contact platform support.
            </p>
          </div>
        `
      });
    } catch (err: any) {
      console.error(`[Mailer] Error sending rejection email:`, err.message);
    }
  }
}

export async function sendInviteLinkEmail({ toEmail, setupUrl }: { toEmail: string; setupUrl: string }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log(`[Mailer] Sending workspace setup invitation email to: ${toEmail}...`);

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Salon Platform Team'}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: toEmail,
        subject: `✨ You are Invited to Set Up Your Salon Workspace!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e6dccb;">
            <h2 style="color: #3a4a35; margin-bottom: 16px;">Welcome to the Salon Platform!</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Our Super Admin has invited you to set up your salon workspace on our platform.
            </p>
            
            <div style="background: #fcfaf7; padding: 20px; border-radius: 10px; border-left: 4px solid #c29957; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; color: #3a4a35; font-weight: bold;">📩 Invited Account Email:</p>
              <p style="margin: 0; color: #2d3748; font-size: 14px; font-weight: bold;">${toEmail}</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${setupUrl}" style="background-color: #3a4a35; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">
                Set Up Your Salon Workspace
              </a>
            </div>

            <p style="color: #718096; font-size: 13px; line-height: 1.5;">
              Clicking the button above will allow you to set your Salon Name, Owner Name, and choose your personal account password.
            </p>

            <p style="color: #a0aec0; font-size: 12px; border-t: 1px solid #edf2f7; pt: 16px; margin-top: 32px;">
              Direct Link: <a href="${setupUrl}" style="color: #c29957;">${setupUrl}</a>
            </p>
          </div>
        `
      });

      console.log(`[Mailer] Invite email successfully dispatched to ${toEmail}`);
    } catch (err: any) {
      console.error(`[Mailer] Error sending invite email via SMTP:`, err.message);
    }
  } else {
    console.log(`[Mailer] SMTP credentials not set. Simulated Email Dispatch:
    ---------------------------------------------------
    TO: ${toEmail}
    SUBJECT: ✨ You are Invited to Set Up Your Salon Workspace!
    LINK: ${setupUrl}
    ---------------------------------------------------`);
  }
}

export interface SendInvoiceEmailParams {
  toEmail: string;
  customerName: string;
  invoiceId?: string | number;
  appointmentDate?: string;
  services?: Array<{
    service_name?: string;
    category?: string;
    staff_name?: string;
    price?: number;
  }>;
  tips?: number;
  totalAmount?: number;
  paymentMethod?: string;
  salonName?: string;
}

export interface MailerResult {
  success: boolean;
  dispatched?: boolean;
  simulated?: boolean;
  note?: string;
  error?: string;
}

export async function sendInvoiceEmail({
  toEmail,
  customerName,
  invoiceId = "#1001",
  appointmentDate = new Date().toISOString().split("T")[0],
  services = [],
  tips = 0,
  totalAmount = 0,
  paymentMethod = "Cash",
  salonName = "Salon",
}: SendInvoiceEmailParams): Promise<MailerResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log(`[Mailer] Sending invoice email to: ${toEmail} for customer "${customerName}"...`);

  const servicesHtml = services
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #edf2f7;">
        <td style="padding: 12px; color: #2d3748; font-weight: 500;">
          ${s.service_name || s.category || "Salon Service"}
          ${s.staff_name ? `<br/><span style="font-size: 12px; color: #718096;">Stylist: ${s.staff_name}</span>` : ""}
        </td>
        <td style="padding: 12px; text-align: right; color: #2d3748; font-weight: 600;">
          QR ${Number(s.price || 0).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; border-bottom: 2px solid #f7fafc; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="color: #3a4a35; margin: 0; font-size: 24px; font-weight: bold;">${salonName}</h1>
        <p style="color: #c29957; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Official Service Receipt / Invoice</p>
      </div>

      <div style="margin-bottom: 24px; background: #fcfaf7; padding: 16px; border-radius: 12px; border-left: 4px solid #c29957;">
        <p style="margin: 0; font-size: 12px; color: #718096; text-transform: uppercase; font-weight: bold;">Billed To</p>
        <p style="margin: 4px 0 0 0; font-size: 16px; color: #2d3748; font-weight: bold;">${customerName || "Valued Customer"}</p>
        <p style="margin: 2px 0 0 0; font-size: 13px; color: #4a5568;">Email: ${toEmail}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Invoice No: <strong>${invoiceId}</strong> &bull; Date: <strong>${appointmentDate}</strong></p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f7fafc; border-bottom: 2px solid #edf2f7;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #718096; text-transform: uppercase;">Service</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #718096; text-transform: uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${servicesHtml || `
            <tr>
              <td style="padding: 12px; color: #2d3748;">Salon Services</td>
              <td style="padding: 12px; text-align: right; color: #2d3748;">QR ${Number(totalAmount).toFixed(2)}</td>
            </tr>
          `}
        </tbody>
      </table>

      <div style="border-top: 2px solid #f7fafc; padding-top: 16px;">
        ${tips > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 6px 12px; color: #4a5568; font-size: 14px;">
            <span>Staff Tips</span>
            <span>QR ${Number(tips).toFixed(2)}</span>
          </div>
        ` : ""}
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #3a4a35; color: #ffffff; border-radius: 8px; font-weight: bold; font-size: 18px; margin-top: 12px;">
          <span>Total Paid</span>
          <span>QR ${Number(totalAmount).toFixed(2)}</span>
        </div>
        <div style="text-align: right; margin-top: 8px;">
          <span style="display: inline-block; background: #def7ec; color: #03543f; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 9999px;">
            Payment Method: ${paymentMethod.toUpperCase()} (PAID)
          </span>
        </div>
      </div>

      <div style="text-align: center; margin-top: 32px; border-top: 1px solid #edf2f7; padding-top: 20px;">
        <p style="color: #718096; font-size: 14px; margin: 0;">Thank you for choosing ${salonName}!</p>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 4px;">We look forward to serving you again.</p>
      </div>
    </div>
  `;

  const isConfigured =
    Boolean(host) &&
    Boolean(user) &&
    Boolean(pass) &&
    !user?.includes("your-email") &&
    !pass?.includes("your-gmail") &&
    !pass?.includes("your-16-digit");

  if (isConfigured && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || salonName}" <${process.env.SMTP_FROM_EMAIL || user}>`,
        to: toEmail,
        subject: `Receipt & Invoice from ${salonName} - ${invoiceId}`,
        html: htmlContent,
      });

      console.log(`[Mailer] Invoice email successfully dispatched to ${toEmail}`);
      return { success: true, dispatched: true };
    } catch (err: any) {
      console.error(`[Mailer] SMTP delivery error (${err.message}). Falling back to log simulation.`);
      return {
        success: true,
        dispatched: false,
        simulated: true,
        note: `SMTP Authentication failed (${err.message}). Check SMTP_USER & SMTP_PASS in .env.local.`,
      };
    }
  } else {
    console.log(`[Mailer] SMTP credentials placeholder or not set. Simulated Invoice Email Dispatch:
    ---------------------------------------------------
    TO: ${toEmail}
    SUBJECT: Receipt & Invoice from ${salonName} - ${invoiceId}
    TOTAL: QR ${totalAmount}
    ---------------------------------------------------`);
    return {
      success: true,
      dispatched: false,
      simulated: true,
      note: "SMTP credentials placeholder detected in .env.local.",
    };
  }
}
