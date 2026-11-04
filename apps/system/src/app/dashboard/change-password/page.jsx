'use client';

import { KeyRound } from 'lucide-react';
import ChangePasswordForm from '@/component/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 items-center justify-center text-teal-600 dark:text-teal-300">
            <KeyRound className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Change password</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Enter your current password, then choose a new one.
            </p>
          </div>
        </div>
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
