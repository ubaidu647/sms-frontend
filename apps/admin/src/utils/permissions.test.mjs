import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveScope, canSee } from './permissions.js';

test('branch-profile org grant is view-all-branch-profile', () => {
  const role = { actions: ['view-all-branch-profile'] };
  assert.equal(resolveScope(role, 'view-branch-profile'), 'all');
  assert.equal(canSee(role, 'view-branch-profile'), true);
});

test('ordinary resources keep the -all-branch- infix', () => {
  assert.equal(resolveScope({ actions: ['view-all-branch-staff'] }, 'view-staff'), 'all');
  assert.equal(resolveScope({ actions: ['view-staff'] }, 'view-staff'), 'branch');
  assert.equal(resolveScope({ actions: ['update-own-staff'] }, 'update-staff'), 'own');
  assert.equal(resolveScope({ actions: [] }, 'view-staff'), 'none');
});
