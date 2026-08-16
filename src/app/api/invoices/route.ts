import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildReminderSchedule } from '@/lib/reminders';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    client_name,
    client_phone,
    client_email,
    amount,
    due_date,
    invoice_number,
    description,
  } = body;

  if (!client_name || !amount || !due_date) {
    return NextResponse.json(
      { error: 'client_name, amount and due_date are required' },
      { status: 400 }
    );
  }

  // Create invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_name,
      client_phone: client_phone || null,
      client_email: client_email || null,
      amount: Number(amount),
      due_date,
      invoice_number: invoice_number || null,
      description: description || null,
      status: 'outstanding',
    })
    .select()
    .single();

  if (invError || !invoice) {
    return NextResponse.json(
      { error: invError?.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }

  // Build and insert reminder schedule
  const schedule = buildReminderSchedule(due_date);

  const reminderRows = schedule.map((item) => ({
    invoice_id: invoice.id,
    channel: item.channel,
    scheduled_for: item.scheduled_for,
    status: 'pending',
  }));

  const { error: remError } = await supabase
    .from('reminders')
    .insert(reminderRows);

  if (remError) {
    console.error('Failed to schedule reminders:', remError);
    // Invoice still created – non-fatal
  }

  return NextResponse.json(invoice, { status: 201 });
}
