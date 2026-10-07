// Pure helpers for managing parent portal accounts from a student's record.
// Imported by node tests, so keep imports relative with .js extensions.
import { hasAnyAction, canActInBranch } from './permissions.js';

export const PARENT_RELATIONS = ['father', 'mother', 'guardian', 'other'];

export const PARENT_PASSWORD_MIN = 8;

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Name / phone / email to prefill the "Add parent" form from the student's
 * embedded father / mother / guardian data. Missing fields come back as ''.
 */
export function parentPrefill(student, relation) {
  const src =
    PARENT_RELATIONS.includes(relation) && relation !== 'other' ? student?.[relation] : null;
  return {
    name: clean(src?.name),
    phone: clean(src?.phone),
    email: clean(src?.email),
  };
}

/** True when the student record holds any data to prefill for that relation. */
export function hasPrefill(student, relation) {
  const p = parentPrefill(student, relation);
  return !!(p.name || p.phone || p.email);
}

/** First relation the student has embedded data for, else 'father'. */
export function defaultRelation(student) {
  return PARENT_RELATIONS.find((r) => hasPrefill(student, r)) || 'father';
}

/** The parent's linked children other than the one being viewed. */
export function otherChildren(parent, studentId) {
  const id = String(studentId || '');
  return (parent?.children || []).filter((c) => String(c?._id || '') !== id);
}

/** POST /parent answers 201 when it created the account, 200 when it linked an existing one. */
export const parentCreateOutcome = (status) => (status === 201 ? 'created' : 'linked');

/**
 * What the current staff user may do with a student's parents. Branch-scoped
 * grants only reach students of the user's own branch; the server enforces the
 * finer rules (e.g. org tier for parents with children in other branches).
 */
export function parentPermissions(role, userBranchId, studentBranch) {
  const canView = hasAnyAction(role, ['view-student', 'view-all-branch-student']);
  const canManage =
    hasAnyAction(role, ['update-student', 'update-all-branch-student']) &&
    (studentBranch == null || canActInBranch(role, 'update-student', userBranchId, studentBranch));
  const canToggle =
    hasAnyAction(role, ['delete-student', 'delete-all-branch-student']) &&
    (studentBranch == null || canActInBranch(role, 'delete-student', userBranchId, studentBranch));
  return { canView, canManage, canToggle };
}
