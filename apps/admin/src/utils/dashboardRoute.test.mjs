// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dashboardRedirect, parseRoleCookie } from './dashboardRoute.js';

const go = (pathname, roleName, { hasToken = true, hasActions = true } = {}) =>
  dashboardRedirect({ hasToken, roleName, hasActions, pathname });

test('signin: signed-in users go to the home page, signed-out users stay', () => {
  assert.equal(go('/signin', 'admin'), '/dashboard');
  assert.equal(go('/signin', null, { hasToken: false }), null);
  assert.equal(go('/dashboard', null, { hasToken: false }), '/signin');
  assert.equal(go('/dashboard/school/students', 'admin', { hasToken: false }), '/signin');
});

test('landing page: signed-in users go to the dashboard, visitors see the page', () => {
  assert.equal(go('/', 'admin'), '/dashboard');
  assert.equal(go('/', 'Teacher'), '/dashboard');
  assert.equal(go('/', null, { hasToken: false }), null);
});

test('system roles reach the /dashboard home page (no redirect to the school app)', () => {
  for (const role of ['super-admin', 'admin', 'sub-admin']) {
    assert.equal(go('/dashboard', role), null);
    assert.equal(go('/dashboard/school', role), null);
    assert.equal(go('/dashboard/school/students', role), null);
    assert.equal(go('/dashboard/user-management/staff', role), null);
    assert.equal(go('/dashboard/business-settings/academic-year', role), null);
    assert.equal(go('/dashboard/billing', role), null);
    assert.equal(go('/dashboard/settings/password', role), null);
    // anything else under /dashboard is still off limits
    assert.equal(go('/dashboard/other', role), '/unauthorized');
  }
});

test('dynamic roles with actions reach the home page; without actions → /unauthorized', () => {
  assert.equal(go('/dashboard', 'teacher'), null);
  assert.equal(go('/dashboard/school/homework', 'teacher'), null);
  assert.equal(go('/dashboard', 'teacher', { hasActions: false }), '/unauthorized');
  assert.equal(go('/dashboard/school', 'teacher', { hasActions: false }), '/unauthorized');
  assert.equal(go('/dashboard', null, { hasActions: false }), '/unauthorized');
  // personal settings stay reachable for everyone signed in
  assert.equal(go('/dashboard/settings', 'teacher', { hasActions: false }), null);
  // …including the forced password change, even with no role cookie yet
  assert.equal(go('/dashboard/settings/password', null, { hasActions: false }), null);
  assert.equal(go('/dashboard/settings/password', 'teacher', { hasActions: false }), null);
});

test('parseRoleCookie: slim cookie, legacy actions array, garbage', () => {
  const enc = (o) => encodeURIComponent(JSON.stringify(o));
  assert.deepEqual(parseRoleCookie(enc({ name: 'admin', hasActions: false })), {
    roleName: 'admin',
    hasActions: false,
  });
  assert.deepEqual(parseRoleCookie(enc({ name: 'teacher', actions: ['view-student'] })), {
    roleName: 'teacher',
    hasActions: true,
  });
  assert.deepEqual(parseRoleCookie('%7Bnot-json'), { roleName: null, hasActions: false });
  assert.deepEqual(parseRoleCookie(null), { roleName: null, hasActions: false });
});
