// Session-level refusals the API can send on any request (and on login /
// refresh). Errors carry `message` and, from newer API builds, a `code`; the
// message text is matched only when the code is missing.

export const PLAN_REFUSAL_CODES = [
  "PLAN_DASHBOARD_DISABLED",
  "PLAN_PLATFORM_DISABLED",
];
export const PASSWORD_CHANGE_CODE = "PASSWORD_CHANGE_REQUIRED";

// Narrow on purpose: a feature-level 403 ("your plan does not include the
// library module") must not end the session.
const PLAN_REFUSAL_TEXT = [
  /does not include this dashboard/i,
  /does not include the (web portal|android app|ios app)/i,
];

// `?reason=` key the sign-in page shows a plan refusal for, and the text used
// when the server's own message is not available.
export const PLAN_REASON = "plan-disabled";
export const PLAN_REASON_FALLBACK =
  "Your school’s plan does not include this dashboard. Please contact the school administrator.";

// The server's message rides from the redirect to the sign-in page here.
export const SIGNIN_NOTICE_KEY = "signin-notice";
const NOTICE_MAX = 300;

export const FORCED_PASSWORD_BANNER = "Please set a new password to continue";

function bodyOf(err) {
  const data = err?.response?.data;
  return data && typeof data === "object" ? data : {};
}

/** The server's message when `err` is a plan refusal (403), else null. */
export function planRefusalMessage(err) {
  if (err?.response?.status !== 403) return null;
  const { code, message } = bodyOf(err);
  const text = typeof message === "string" ? message.trim() : "";
  if (PLAN_REFUSAL_CODES.includes(code)) return text || PLAN_REASON_FALLBACK;
  if (!code && text && PLAN_REFUSAL_TEXT.some((re) => re.test(text)))
    return text;
  return null;
}

/** True when the API refuses the request until the password is changed. */
export function isPasswordChangeRequired(err) {
  return (
    err?.response?.status === 403 && bodyOf(err).code === PASSWORD_CHANGE_CODE
  );
}

/**
 * `mustChangePassword` from a login or /auth/me payload ({ user, mustChangePassword }
 * or the flag on the user itself); undefined when the API did not say.
 */
export function mustChangePasswordOf(payload) {
  if (!payload || typeof payload !== "object") return undefined;
  if (typeof payload.mustChangePassword === "boolean")
    return payload.mustChangePassword;
  const u = payload.user || payload.userCreated;
  if (u && typeof u.mustChangePassword === "boolean")
    return u.mustChangePassword;
  return undefined;
}

/** The user with the payload's `mustChangePassword` recorded on it. */
export function withPasswordFlag(user, payload) {
  if (!user) return user;
  const flag = mustChangePasswordOf(payload);
  return flag === undefined ? user : { ...user, mustChangePassword: flag };
}

/** Message the sign-in page shows for `?reason=plan-disabled`, else null. */
export function planNoticeFor(reason, stored) {
  if (reason !== PLAN_REASON) return null;
  const text =
    typeof stored === "string" ? stored.trim().slice(0, NOTICE_MAX) : "";
  return text || PLAN_REASON_FALLBACK;
}

/** Keep the server's message for the sign-in page (best effort). */
export function rememberSigninNotice(message) {
  try {
    if (typeof window !== "undefined" && message) {
      window.sessionStorage.setItem(
        SIGNIN_NOTICE_KEY,
        String(message).slice(0, NOTICE_MAX),
      );
    }
  } catch {
    // storage blocked: the fixed message is shown instead
  }
}

/** Read and forget the stored sign-in message. */
export function takeSigninNotice() {
  try {
    if (typeof window === "undefined") return null;
    const value = window.sessionStorage.getItem(SIGNIN_NOTICE_KEY);
    window.sessionStorage.removeItem(SIGNIN_NOTICE_KEY);
    return value;
  } catch {
    return null;
  }
}
