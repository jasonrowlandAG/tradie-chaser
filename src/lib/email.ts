import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}) {
  if (!resend) {
    console.warn('Resend not configured – email skipped');
    return { success: false, error: 'Resend not configured' };
  }

  const from = process.env.EMAIL_FROM || 'reminders@tradiechaser.com';

  try {
    const { data, error } = await resend.emails.send({
      from: `${params.fromName || 'TradieChaser'} <${from}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}
