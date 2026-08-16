import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSms } from '@/lib/sms';
import { sendEmail } from '@/lib/email';
import { getSmsCopy, getEmailCopy } from '@/lib/reminders';

// Use service role for cron job
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // Simple auth for cron (Vercel Cron or external)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Fetch due pending reminders with invoice + profile data
  const { data: reminders, error } = await supabaseAdmin
    .from('reminders')
    .select(
      `
      id,
      channel,
      scheduled_for,
      invoice:invoices (
        id,
        client_name,
        client_phone,
        client_email,
        amount,
        due_date,
        invoice_number,
        description,
        status,
        user_id,
        profile:profiles (
          business_name,
          bank_details
        )
      )
    `
    )
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .limit(50);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const reminder of reminders || []) {
    const inv = reminder.invoice as any;
    if (!inv || inv.status === 'paid') {
      // Cancel if already paid
      await supabaseAdmin
        .from('reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminder.id);
      continue;
    }

    const profile = inv.profile;
    const businessName = profile?.business_name || 'Your Tradie';
    const bankDetails = profile?.bank_details;

    // Determine tone from schedule position (simple heuristic)
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(inv.due_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let tone: 'friendly' | 'polite' | 'firm' | 'final' = 'friendly';
    if (daysOverdue >= 14) tone = 'final';
    else if (daysOverdue >= 7) tone = 'firm';
    else if (daysOverdue >= 3) tone = 'polite';

    try {
      if (reminder.channel === 'sms' && inv.client_phone) {
        const body = getSmsCopy({
          tone,
          clientName: inv.client_name,
          businessName,
          amount: Number(inv.amount),
          invoiceNumber: inv.invoice_number,
          dueDate: inv.due_date,
          bankDetails,
        });

        const result = await sendSms(inv.client_phone, body);

        if (result.success) {
          await supabaseAdmin
            .from('reminders')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', reminder.id);
          sent++;
        } else {
          await supabaseAdmin
            .from('reminders')
            .update({
              status: 'failed',
              error_message: result.error,
            })
            .eq('id', reminder.id);
          failed++;
        }
      } else if (reminder.channel === 'email' && inv.client_email) {
        const { subject, html } = getEmailCopy({
          tone,
          clientName: inv.client_name,
          businessName,
          amount: Number(inv.amount),
          invoiceNumber: inv.invoice_number,
          dueDate: inv.due_date,
          description: inv.description,
          bankDetails,
        });

        const result = await sendEmail({
          to: inv.client_email,
          subject,
          html,
          fromName: businessName,
        });

        if (result.success) {
          await supabaseAdmin
            .from('reminders')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', reminder.id);
          sent++;
        } else {
          await supabaseAdmin
            .from('reminders')
            .update({
              status: 'failed',
              error_message: result.error,
            })
            .eq('id', reminder.id);
          failed++;
        }
      } else {
        // No contact method – cancel
        await supabaseAdmin
          .from('reminders')
          .update({ status: 'cancelled' })
          .eq('id', reminder.id);
      }
    } catch (err: any) {
      console.error('Reminder processing error:', err);
      await supabaseAdmin
        .from('reminders')
        .update({
          status: 'failed',
          error_message: err.message,
        })
        .eq('id', reminder.id);
      failed++;
    }
  }

  return NextResponse.json({
    processed: (reminders || []).length,
    sent,
    failed,
    timestamp: now,
  });
}
