import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-teal-800">TradieChaser</div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            FOR SOLO AUSTRALIAN TRADIES
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Stop chasing invoices.
            <br />
            <span className="text-teal-700">Get paid automatically.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            Add an unpaid invoice once. TradieChaser sends polite → firm SMS and
            email reminders until it’s paid. Built for independent plumbers,
            sparkies and tradies who hate awkward follow-ups.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-teal-700 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-teal-800 transition"
            >
              Start chasing invoices →
            </Link>
            <Link
              href="/login"
              className="border border-slate-300 text-slate-700 font-medium px-8 py-3.5 rounded-xl hover:bg-white transition"
            >
              Log in
            </Link>
          </div>
        </section>

        <section className="bg-white border-y py-14">
          <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-700 mb-2">1</div>
              <h3 className="font-semibold mb-1">Add the invoice</h3>
              <p className="text-sm text-slate-600">
                Client name, amount, due date. Takes 30 seconds.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-700 mb-2">2</div>
              <h3 className="font-semibold mb-1">We send the reminders</h3>
              <p className="text-sm text-slate-600">
                Friendly → polite → firm SMS + email on a smart schedule.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-700 mb-2">3</div>
              <h3 className="font-semibold mb-1">Mark paid & stop</h3>
              <p className="text-sm text-slate-600">
                One click stops all future messages. Cash flow improves.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-slate-500">
        Built for Australian tradies who just want to get paid.
      </footer>
    </div>
  );
}
