"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import apiClient from "@/services/apiClient";
import {
  PASSWORD_MIN,
  PASSWORD_MAX,
  changePasswordProblem,
  errorMessageOf,
} from "@/utils/changePassword";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

const FIELDS = [
  {
    name: "currentPassword",
    label: "Current password",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
];

/**
 * Self-service password change (POST /auth/change-password).
 *
 * The API ends every other session and re-issues this browser's session
 * cookies in the same response, so the user stays signed in here. Should a
 * later request still come back 401, the API client's refresh/sign-out
 * handling takes over as for any ended session.
 */
// `onSuccess(res)` (optional) runs after a successful change — the forced
// first-login change uses it to clear the flag and continue to the dashboard.
export default function ChangePasswordForm({ onSuccess } = {}) {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (pending) return;
    const problem = changePasswordProblem(form);
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiClient.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(EMPTY);
      setSuccess(res.data?.message || "Password changed.");
      onSuccess?.(res);
    } catch (err) {
      setError(errorMessageOf(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {FIELDS.map(({ name, label, autoComplete }) => (
        <div key={name}>
          <label
            htmlFor={`cp-${name}`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
          <div className="relative">
            <input
              id={`cp-${name}`}
              name={name}
              type={show ? "text" : "password"}
              autoComplete={autoComplete}
              value={form[name]}
              onChange={onChange}
              maxLength={PASSWORD_MAX}
              disabled={pending}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161616] px-3 py-2 pr-10 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00918e]"
            />
            {name === "currentPassword" && (
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
              >
                {show ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Use {PASSWORD_MIN}–{PASSWORD_MAX} characters. Changing your password
        signs you out on every other device.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-[#00918e] dark:text-[#33b3b0]">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-[#00918e] px-5 py-2 text-sm font-semibold text-white hover:bg-[#007a77] disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Change password
      </button>
    </form>
  );
}
