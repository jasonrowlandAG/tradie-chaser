'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Invoice } from '@/lib/types';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single();

    if (profile?.business_name) setBusinessName(profile.business_name);

    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    setInvoices(data || []);
    setLoading(false);
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    if (res.ok) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: 'paid' } : inv
        )
      );
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const outstanding = invoices.filter((i) => i.status === 'outstanding');
  const totalOwed = outstanding.reduce((sum, i) => sum + Number(i.amount), 0);

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-teal-800">TradieChaser</div>
            {businessName && (
              <div className="text-xs text-slate-500">{businessName}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-800"
            >
              + Add Invoice
            </Link>
            <Link
              href="/settings"
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-slate-500 mb-1">Total outstanding</div>
            <div className="text-3xl font-bold text-slate-900">
              ${totalOwed.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-slate-500 mb-1">Active chases</div>
            <div className="text-3xl font-bold text-slate-900">
              {outstanding.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b font-semibold">Invoices</div>
          {invoices.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <p className="mb-4">No invoices yet.</p>
              <Link
                href="/invoices/new"
                className="text-teal-700 font-medium hover:underline"
              >
                Add your first invoice →
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => {
                const days =
                  inv.status === 'outstanding'
                    ? Math.floor(
                        (Date.now() - new Date(inv.due_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;
                return (
                  <div
                    key={inv.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{inv.client_name}</div>
                      <div className="text-sm text-slate-500">
                        {inv.invoice_number && `#${inv.invoice_number} · `}
                        Due {inv.due_date}
                        {days !== null && days > 0 && (
                          <span className="text-amber-600">
                            {' '}· {days} day{days === 1 ? '' : 's'} overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">
                        ${Number(inv.amount).toFixed(2)}
                      </div>
                      {inv.status === 'outstanding' ? (
                        <button
                          onClick={() => markPaid(inv.id)}
                          className="text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className="text-sm text-emerald-600 font-medium">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
