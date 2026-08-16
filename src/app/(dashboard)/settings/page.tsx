'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    bank_details: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('business_name, phone, bank_details')
      .eq('id', user.id)
      .single();

    if (data) {
      setForm({
        business_name: data.business_name || '',
        phone: data.phone || '',
        bank_details: data.bank_details || '',
      });
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: form.business_name,
        phone: form.phone,
        bank_details: form.bank_details,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      setMessage('Error saving: ' + error.message);
    } else {
      setMessage('Settings saved successfully');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            ← Back
          </Link>
          <div className="font-bold text-teal-800">Settings</div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Business / Trading name
            </label>
            <input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Jay’s Plumbing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Your phone number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="0412 345 678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Bank / Payment details
            </label>
            <textarea
              rows={4}
              value={form.bank_details}
              onChange={(e) => setForm({ ...form, bank_details: e.target.value })}
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder={"BSB: 062-000\nAccount: 1234 5678\nAccount name: Jay’s Plumbing"}
            />
            <p className="text-xs text-slate-500 mt-1">
              These details are included in reminder messages so clients can pay easily.
            </p>
          </div>

          {message && (
            <p className={`text-sm p-3 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </main>
    </div>
  );
}
