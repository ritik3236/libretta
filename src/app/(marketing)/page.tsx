import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, BookCheck, Banknote, FileDown } from "lucide-react";
import { appConfig } from "@/lib/app-config";

export default function LandingPage() {
  return (
    <main className="app-shell flex min-h-dvh flex-col px-6 pb-12 pt-16">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
          <BookCheck className="h-5 w-5" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">{appConfig.name}</span>
      </div>

      <div className="mt-16 flex-1">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
          Your digital khata.
          <br />
          <span className="text-emerald-600">Give, get, settled.</span>
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-slate-500">
          Record what you give and get from each customer. Balances update
          automatically. Multi-currency, with CSV & PDF export — built for your phone.
        </p>

        <div className="mt-10 space-y-3">
          <Feature icon={<Banknote className="h-5 w-5" />} text="Auto running balance per customer" />
          <Feature icon={<FileDown className="h-5 w-5" />} text="Export ledgers to CSV & PDF" />
          <Feature icon={<BookCheck className="h-5 w-5" />} text="Works like an app, installable" />
        </div>
      </div>

      <div className="space-y-3">
        <SignedOut>
          <Link
            href="/sign-up"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[.98]"
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="flex w-full items-center justify-center rounded-2xl border border-slate-200 py-4 text-base font-semibold text-slate-700"
          >
            I already have an account
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-base font-semibold text-white active:scale-[.98]"
          >
            Open dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
