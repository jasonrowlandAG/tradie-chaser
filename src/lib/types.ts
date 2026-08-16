export type InvoiceStatus = 'outstanding' | 'paid';
export type ReminderChannel = 'sms' | 'email';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  business_name: string | null;
  phone: string | null;
  bank_details: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  amount: number;
  currency: string;
  due_date: string;
  invoice_number: string | null;
  description: string | null;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  invoice_id: string;
  channel: ReminderChannel;
  scheduled_for: string;
  sent_at: string | null;
  status: ReminderStatus;
  error_message: string | null;
  created_at: string;
}

export interface InvoiceWithReminders extends Invoice {
  reminders?: Reminder[];
}
