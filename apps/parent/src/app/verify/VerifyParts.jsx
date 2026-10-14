"use client";
// Shared UI for the public /verify pages.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import {
  CODE_LENGTH,
  isValidCode,
  normalizeCode,
} from "@/utils/verifyCertificate";

export function Shell({ children }) {
  return (
    <main className="min-h-screen bg-[rgb(246,246,246)] dark:bg-[#0a0a0a] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-center gap-2 mb-6 text-gray-900 dark:text-gray-100">
          <ShieldCheck className="w-7 h-7 text-[#00918e]" />
          <span className="text-lg font-semibold">
            Certificate verification
          </span>
        </div>
        {children}
        <p className="mt-8 text-center text-sm text-gray-500">
          Parent at this school?{" "}
          <Link href="/signin" className="text-[#00918e] hover:underline">
            Parent sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function CodeForm({ initial = "", note }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    const code = normalizeCode(value);
    if (!isValidCode(code)) {
      setError(
        `Enter the ${CODE_LENGTH}-character code printed on the certificate (letters and digits).`,
      );
      return;
    }
    setError("");
    router.push(`/verify/${code}`);
  };

  return (
    <Card>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Verify a certificate
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {note ||
          "Type the verification code printed on the certificate to check that it is genuine."}
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Verification code
        </label>
        <input
          id="code"
          name="code"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          placeholder="e.g. ABCD EFGH 23"
          aria-invalid={!!error}
          aria-describedby={error ? "code-error" : undefined}
          className={`w-full min-h-11 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] border outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 tracking-widest uppercase focus:ring-4 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-gray-200 dark:border-[#2a2a2a] focus:border-[#00918e] focus:ring-[#00918e]/15"
          }`}
        />
        {error && (
          <p id="code-error" className="text-xs text-red-500">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00918e] hover:bg-[#00736f] text-white font-semibold"
        >
          <Search className="w-4 h-4" />
          Verify
        </button>
      </form>
    </Card>
  );
}
