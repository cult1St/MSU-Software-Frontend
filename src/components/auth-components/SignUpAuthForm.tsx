"use client";

import Link from "next/link";
import { Home } from "lucide-react";

/** Public self-signup is disabled — Registrars create staff under Admin. */
function SignUpAuthForm() {
  return (
    <div className="max-w-md mx-auto space-y-6 text-center py-8">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-ink">Staff accounts</h1>
        <p className="text-sm text-surface-muted leading-relaxed">
          Public sign-up is not available. Ask a Registrar to create your staff
          account from Administration, then sign in with that email and password.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-[#B71C1C] text-white text-sm font-semibold"
        >
          Go to sign in
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-surface-border text-sm font-semibold"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}

export default SignUpAuthForm;
