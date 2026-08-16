'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    amount: '',
    due_date: '',
    invoice_number: '',
    description: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create invoice');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            ← Back
          </Link>
          <div className="font-bold text-teal-800">Add Invoice</div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Client name *
            </label>
            <input
              required
              value={form.client_name}
              onChange={(e) => update('client_name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone (SMS)
              </label>
              <input
                type="tel"
                value={form.client_phone}
                onChange={(e) => update('client_phone', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="0412 345 678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.client_email}
                onChange={(e) => update('client_email', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="john@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount (AUD) *
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="1250.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Due date *
              </label>
              <input
                required
                type="date"
                value={form.due_date}
                onChange={(e) => update('due_date', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Invoice number
            </label>
            <input
              value={form.invoice_number}
              onChange={(e) => update('invoice_number', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="INV-1042"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Job description (optional)
            </label>
            <input
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Hot water unit replacement"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Start chasing this invoice'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            We’ll automatically send SMS + email reminders on a polite → firm
            schedule until you mark it paid.
          </p>
        </form>
      </main>
    </div>
  );
}
