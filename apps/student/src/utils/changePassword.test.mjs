// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PASSWORD_MIN,
  PASSWORD_MAX,
  changePasswordProblem,
  newPasswordProblem,
  errorMessageOf,
} from "./changePassword.js";

const ok = {
  currentPassword: "old-pass-1",
  newPassword: "new-pass-1",
  confirmPassword: "new-pass-1",
};

test("a complete, valid form has no problem", () => {
  assert.equal(changePasswordProblem(ok), null);
});

test("every field is required", () => {
  assert.match(
    changePasswordProblem({ ...ok, currentPassword: "" }),
    /current password/,
  );
  assert.match(
    changePasswordProblem({ ...ok, newPassword: "" }),
    /new password/,
  );
  assert.match(changePasswordProblem({}), /current password/);
});

test("length matches the API: 8..128", () => {
  const short = "x".repeat(PASSWORD_MIN - 1);
  const long = "x".repeat(PASSWORD_MAX + 1);
  assert.match(
    changePasswordProblem({
      ...ok,
      newPassword: short,
      confirmPassword: short,
    }),
    /at least 8/,
  );
  assert.match(
    changePasswordProblem({ ...ok, newPassword: long, confirmPassword: long }),
    /at most 128/,
  );
  const edge = "x".repeat(PASSWORD_MIN);
  assert.equal(
    changePasswordProblem({ ...ok, newPassword: edge, confirmPassword: edge }),
    null,
  );
});

test("the new password must differ from the current one", () => {
  assert.match(
    changePasswordProblem({
      currentPassword: "same-pass",
      newPassword: "same-pass",
      confirmPassword: "same-pass",
    }),
    /different/,
  );
});

test("confirmation must match", () => {
  assert.match(
    changePasswordProblem({ ...ok, confirmPassword: "other-pass" }),
    /do not match/,
  );
});

test("newPasswordProblem applies the same rules without a current password", () => {
  assert.equal(newPasswordProblem("abcdefgh", "abcdefgh"), null);
  assert.match(newPasswordProblem("abc", "abc"), /at least 8/);
  assert.match(newPasswordProblem("abcdefgh", "abcdefgx"), /do not match/);
  assert.match(newPasswordProblem("", ""), /new password/);
});

test("errorMessageOf prefers the server message", () => {
  assert.equal(
    errorMessageOf({
      response: { data: { message: "Current password is incorrect" } },
    }),
    "Current password is incorrect",
  );
  assert.equal(errorMessageOf(new Error("boom")), "boom");
  assert.equal(errorMessageOf(null, "fallback"), "fallback");
});
