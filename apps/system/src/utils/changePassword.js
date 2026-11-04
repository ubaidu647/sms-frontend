// Client-side mirror of the API's password rules for POST /auth/change-password.
// The server is the authority; these checks only save a round trip.
export const PASSWORD_MIN = 8;
// bcrypt reads only the first 72 bytes; the API refuses anything past 128.
export const PASSWORD_MAX = 128;

/**
 * The first problem with a change-password form, or null when it may be sent.
 * @param {{ currentPassword?: string, newPassword?: string, confirmPassword?: string }} form
 */
export function changePasswordProblem({ currentPassword, newPassword, confirmPassword } = {}) {
  if (!currentPassword) return 'Enter your current password';
  if (!newPassword) return 'Enter a new password';
  if (newPassword.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters`;
  }
  if (newPassword.length > PASSWORD_MAX) {
    return `Password must be at most ${PASSWORD_MAX} characters`;
  }
  if (newPassword === currentPassword) {
    return 'New password must be different from your current password';
  }
  if (newPassword !== confirmPassword) return 'Passwords do not match';
  return null;
}

/**
 * The problem with a password an administrator sets for someone else (no
 * current password involved), or null.
 */
export function newPasswordProblem(newPassword, confirmPassword) {
  if (!newPassword) return 'Enter a new password';
  if (newPassword.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters`;
  }
  if (newPassword.length > PASSWORD_MAX) {
    return `Password must be at most ${PASSWORD_MAX} characters`;
  }
  if (newPassword !== confirmPassword) return 'Passwords do not match';
  return null;
}

/** The server's message from a failed request (axios error or plain Error). */
export function errorMessageOf(err, fallback = 'Could not change your password') {
  return err?.response?.data?.message || err?.message || fallback;
}
