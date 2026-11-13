// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  enabledFeaturesOf,
  isFeatureEnabled,
  featureForPath,
  visibleNavItems,
  isFeatureDisabledError,
} from "./planFeatures.js";

test("enabledFeaturesOf: null, missing or malformed means all enabled", () => {
  assert.equal(enabledFeaturesOf(undefined), null);
  assert.equal(enabledFeaturesOf({}), null);
  assert.equal(enabledFeaturesOf({ features: null }), null);
  assert.equal(enabledFeaturesOf({ features: "library" }), null);
});

test("enabledFeaturesOf: keeps only known keys", () => {
  assert.deepEqual(enabledFeaturesOf({ features: ["library", "core", "x"] }), [
    "library",
  ]);
  assert.deepEqual(enabledFeaturesOf({ features: [] }), []);
});

test("isFeatureEnabled", () => {
  assert.equal(isFeatureEnabled(null, "library"), true);
  assert.equal(isFeatureEnabled(undefined, "leave"), true);
  assert.equal(isFeatureEnabled([], "library"), false);
  assert.equal(isFeatureEnabled(["library"], "library"), true);
  assert.equal(isFeatureEnabled(["library"], "leave"), false);
  // Core / unknown keys are never gated.
  assert.equal(isFeatureEnabled([], "homework"), true);
});

test("featureForPath", () => {
  assert.equal(featureForPath("/dashboard/library"), "library");
  assert.equal(featureForPath("/dashboard/library/"), "library");
  assert.equal(featureForPath("/dashboard/library/x"), "library");
  assert.equal(featureForPath("/dashboard/leave"), "leave");
  assert.equal(featureForPath("/dashboard/libraryx"), null);
  assert.equal(featureForPath("/dashboard"), null);
  assert.equal(featureForPath(null), null);
});

test("visibleNavItems hides disabled modules only", () => {
  const items = [
    { path: "/dashboard" },
    { path: "/dashboard/library" },
    { path: "/dashboard/leave" },
  ];
  assert.deepEqual(visibleNavItems(items, null), items);
  assert.deepEqual(
    visibleNavItems(items, ["leave"]).map((i) => i.path),
    ["/dashboard", "/dashboard/leave"],
  );
  assert.deepEqual(
    visibleNavItems(items, []).map((i) => i.path),
    ["/dashboard"],
  );
});

test("isFeatureDisabledError", () => {
  const err = (status, code) => ({ response: { status, data: { code } } });
  assert.equal(isFeatureDisabledError(err(403, "PLAN_FEATURE_DISABLED")), true);
  assert.equal(isFeatureDisabledError(err(403, "OTHER")), false);
  assert.equal(
    isFeatureDisabledError(err(400, "PLAN_FEATURE_DISABLED")),
    false,
  );
  assert.equal(isFeatureDisabledError(undefined), false);
});
