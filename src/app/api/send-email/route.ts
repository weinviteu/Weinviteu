import { z } from 'zod';
import nodemailer from 'nodemailer';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { inviteUrlPath } from '@/lib/slug';

const SUBJECT = 'Your custom invitation is ready - WeInviteU';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

function emailHtml(clientName: string, inviteUrl: string) {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #222; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Hello, ${escapeHtml(clientName)}!</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #444;">
          Your custom 3D digital invitation is ready to view and share with your guests.
        </p>
        <div style="margin: 28px 0;">
          <a href="${escapeHtml(inviteUrl)}" style="background: #d4af37; color: #0b0903; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            Open Your Invitation
          </a>
        </div>
        <p style="font-size: 13px; color: #777; margin-bottom: 0;">
          Direct link: <a href="${escapeHtml(inviteUrl)}" style="color: #d4af37;">${escapeHtml(inviteUrl)}</a>
        </p>
      </div>
    `;
}

function emailProvider() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || emailUser;
  if (emailUser && emailPass && !emailUser.includes('your_email@gmail.com') && !emailPass.includes('your_16_digit_app_password')) {
    return { kind: 'smtp' as const, user: emailUser, pass: emailPass };
  }
  if (resendApiKey && emailFrom) return { kind: 'resend' as const, apiKey: resendApiKey, from: emailFrom };
  return null;
}

async function deliver(provider: NonNullable<ReturnType<typeof emailProvider>>, to: string, html: string, idempotencyKey: string) {
  if (provider.kind === 'smtp') {
    try {
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: provider.user, pass: provider.pass } });
      await transporter.sendMail({ from: `"WeInviteU" <${provider.user}>`, to, subject: SUBJECT, html });
    } catch (err) {
      console.error('SMTP send failed:', err);
      throw new HttpError(502, 'The email could not be sent. Check EMAIL_USER and EMAIL_PASS.');
    }
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: provider.from, to: [to], subject: SUBJECT, html }),
  });
  if (!response.ok) throw new HttpError(502, 'The email provider could not send it. Please retry.');
}

export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const parsed = z.object({ orderId: z.uuid() }).safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, 'Invalid order ID.');

    const { data: order, error } = await db
      .from('orders')
      .select('id,slug,email,client_name,published_file,status,email_sent_count')
      .eq('id', parsed.data.orderId)
      .single();

    if (error || !order?.published_file) throw new HttpError(400, 'Save this invitation before sending it.');
    if (!z.email().safeParse(order.email).success) throw new HttpError(400, 'A valid client email is required.');

    const provider = emailProvider();
    if (!provider) throw new HttpError(503, 'Email delivery is not configured; copy the invitation link to share it.');

    const siteUrl = process.env.SITE_URL || new URL(request.url).origin;
    const inviteUrl = new URL(inviteUrlPath(order), siteUrl).href;
    const sendNumber = (order.email_sent_count ?? 0) + 1;

    try {
      // Retries of the same send are deduplicated; an intentional resend is a new send number.
      await deliver(provider, order.email, emailHtml(order.client_name, inviteUrl), `invite-${order.published_file}-${sendNumber}`);
    } catch (sendError) {
      const reason = sendError instanceof HttpError ? sendError.message : 'The email could not be sent.';
      await db.from('orders').update({ last_email_error: reason }).eq('id', order.id);
      throw sendError;
    }

    const sentAt = new Date().toISOString();
    const tracking = {
      // A finished order stays finished when the link is re-sent.
      status: order.status === 'Completed' ? 'Completed' : 'Link Delivered',
      email_sent_at: sentAt, email_sent_to: order.email, email_sent_count: sendNumber, last_email_error: null, updated_at: sentAt,
    };
    const { error: updateError } = await db.from('orders').update(tracking).eq('id', order.id);
    if (updateError) throw new HttpError(500, 'Email sent, but the delivery tracking could not be saved.');

    return Response.json({ success: true, ...tracking });
  } catch (error) {
    return apiError(error);
  }
}
