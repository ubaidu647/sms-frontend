"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, LogOut } from "lucide-react";
import ChangePasswordForm from "@/component/ChangePasswordForm";
import { useUserStore } from "@/store/userStore";
import { FORCED_PASSWORD_BANNER } from "@/utils/authErrors";

/**
 * Shown by the dashboard layout instead of the dashboard while the account
 * must change its password (login / /auth/me said `mustChangePassword`, or a
 * request came back 403 PASSWORD_CHANGE_REQUIRED). It renders no sidebar,
 * topbar or page, so nothing else calls the API — which refuses every request
 * but change-password, /auth/me and logout in this state.
 */
export default function ForcedPasswordChange({ onLogout }) {
  const router = useRouter();

  const onChanged = () => {
    const { user, setUser } = useUserStore.getState();
    if (user) setUser({ ...user, mustChangePassword: false });
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-[rgb(246,246,246)] dark:bg-[#161616] p-6">
      <div className="w-full max-w-xl space-y-6 mt-10">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{FORCED_PASSWORD_BANNER}</span>
        </div>
        <div className="flex items-start gap-4">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 items-center justify-center text-teal-600 dark:text-teal-300">
            <KeyRound className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Change password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Enter your current password, then choose a new one.
            </p>
          </div>
        </div>
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <ChangePasswordForm onSuccess={onChanged} />
        </section>
        {onLogout && (
          <button
            type="button"
            onClick={() => onLogout()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
