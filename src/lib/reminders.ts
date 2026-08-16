import { addDays, isBefore, startOfDay } from 'date-fns';

export interface ReminderScheduleItem {
  daysAfterDue: number;
  channel: 'sms' | 'email';
  tone: 'friendly' | 'polite' | 'firm' | 'final';
}

// Default sequence for Australian tradies
export const DEFAULT_SEQUENCE: ReminderScheduleItem[] = [
  { daysAfterDue: 0, channel: 'sms', tone: 'friendly' },
  { daysAfterDue: 0, channel: 'email', tone: 'friendly' },
  { daysAfterDue: 3, channel: 'sms', tone: 'polite' },
  { daysAfterDue: 3, channel: 'email', tone: 'polite' },
  { daysAfterDue: 7, channel: 'sms', tone: 'firm' },
  { daysAfterDue: 7, channel: 'email', tone: 'firm' },
  { daysAfterDue: 14, channel: 'sms', tone: 'final' },
  { daysAfterDue: 14, channel: 'email', tone: 'final' },
];

export function buildReminderSchedule(dueDate: string) {
  const due = startOfDay(new Date(dueDate));
  const now = new Date();

  return DEFAULT_SEQUENCE.map((item) => {
    const scheduled = addDays(due, item.daysAfterDue);
    // If the scheduled time is in the past, schedule it for now + small buffer
    const scheduledFor = isBefore(scheduled, now)
      ? new Date(now.getTime() + 2 * 60 * 1000) // 2 min from now
      : scheduled;

    return {
      channel: item.channel,
      scheduled_for: scheduledFor.toISOString(),
      tone: item.tone,
    };
  });
}

export function getSmsCopy(params: {
  tone: string;
  clientName: string;
  businessName: string;
  amount: number;
  invoiceNumber: string | null;
  dueDate: string;
  bankDetails?: string | null;
  paymentLink?: string | null;
}) {
  const {
    tone,
    clientName,
    businessName,
    amount,
    invoiceNumber,
    dueDate,
    bankDetails,
    paymentLink,
  } = params;

  const inv = invoiceNumber ? ` #${invoiceNumber}` : '';
  const amountStr = `$${amount.toFixed(2)}`;
  const firstName = clientName.split(' ')[0];

  const paymentLine = paymentLink
    ? `Pay here: ${paymentLink}`
    : bankDetails
    ? `Bank details: ${bankDetails}`
    : 'Please reply for payment details.';

  switch (tone) {
    case 'friendly':
      return `Hi ${firstName}, just a friendly reminder that invoice${inv} for ${amountStr} was due on ${dueDate}. ${paymentLine} Thanks, ${businessName}`;
    case 'polite':
      return `Hi ${firstName}, following up on invoice${inv} for ${amountStr} which is now a few days overdue. ${paymentLine} Cheers, ${businessName}`;
    case 'firm':
      return `Hi ${firstName}, invoice${inv} for ${amountStr} is now overdue. Please arrange payment as soon as possible. ${paymentLine} ${businessName}`;
    case 'final':
      return `Hi ${firstName}, this is a final reminder that invoice${inv} for ${amountStr} remains unpaid. Please pay today to avoid further action. ${paymentLine} ${businessName}`;
    default:
      return `Hi ${firstName}, reminder about invoice${inv} for ${amountStr}. ${paymentLine} ${businessName}`;
  }
}

export function getEmailCopy(params: {
  tone: string;
  clientName: string;
  businessName: string;
  amount: number;
  invoiceNumber: string | null;
  dueDate: string;
  description?: string | null;
  bankDetails?: string | null;
  paymentLink?: string | null;
}) {
  const {
    tone,
    clientName,
    businessName,
    amount,
    invoiceNumber,
    dueDate,
    description,
    bankDetails,
    paymentLink,
  } = params;

  const inv = invoiceNumber ? ` #${invoiceNumber}` : '';
  const amountStr = `$${amount.toFixed(2)}`;
  const firstName = clientName.split(' ')[0];

  const subjectMap: Record<string, string> = {
    friendly: `Friendly reminder – Invoice${inv} for ${amountStr}`,
    polite: `Following up – Invoice${inv} is overdue`,
    firm: `Overdue Invoice${inv} – ${amountStr}`,
    final: `Final reminder – Invoice${inv} still unpaid`,
  };

  const subject = subjectMap[tone] || `Invoice reminder${inv}`;

  const paymentSection = paymentLink
    ? `<p><a href="${paymentLink}" style="background:#0f766e;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Pay Now</a></p>`
    : bankDetails
    ? `<p><strong>Payment details:</strong><br/>${bankDetails.replace(/\n/g, '<br/>')}</p>`
    : `<p>Please reply to this email for payment details.</p>`;

  const bodyMap: Record<string, string> = {
    friendly: `
      <p>Hi ${firstName},</p>
      <p>Just a friendly reminder that invoice${inv} for <strong>${amountStr}</strong> was due on ${dueDate}.</p>
      ${description ? `<p>Job: ${description}</p>` : ''}
      ${paymentSection}
      <p>Thanks,<br/>${businessName}</p>
    `,
    polite: `
      <p>Hi ${firstName},</p>
      <p>I'm following up on invoice${inv} for <strong>${amountStr}</strong> which is now a few days overdue (due ${dueDate}).</p>
      ${description ? `<p>Job: ${description}</p>` : ''}
      ${paymentSection}
      <p>Cheers,<br/>${businessName}</p>
    `,
    firm: `
      <p>Hi ${firstName},</p>
      <p>Invoice${inv} for <strong>${amountStr}</strong> is now overdue (due ${dueDate}). Please arrange payment as soon as possible.</p>
      ${description ? `<p>Job: ${description}</p>` : ''}
      ${paymentSection}
      <p>${businessName}</p>
    `,
    final: `
      <p>Hi ${firstName},</p>
      <p>This is a final reminder that invoice${inv} for <strong>${amountStr}</strong> remains unpaid (due ${dueDate}).</p>
      <p>Please pay today to avoid further action.</p>
      ${description ? `<p>Job: ${description}</p>` : ''}
      ${paymentSection}
      <p>${businessName}</p>
    `,
  };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      ${bodyMap[tone] || bodyMap.friendly}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#6b7280;">This is an automated reminder from ${businessName}. Reply STOP to opt out of SMS.</p>
    </div>
  `;

  return { subject, html };
}
