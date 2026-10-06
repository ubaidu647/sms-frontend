// RBAC scope helpers for the three-tier model:
//   <verb>-<resource>             → branch-scoped
//   <verb>-all-branch-<resource>  → org-scoped
//   <verb>-own-<resource>         → self-scoped (only the user's own record)
//
// Use:
//   resolveScope(role, base) → 'all' | 'branch' | 'own' | 'none'
//   canSee(role, base)       → true if scope is anything other than 'none'
//   onlyOwn(role, base)      → true only when 'own' is the user's strongest grant
//   isOrgLevel(role, base)   → true when scope is 'all' (org-wide)

const splitVerb = (action) => {
  const m = action.match(/^([a-z]+)-(.+)$/);
  if (!m) return null;
  return { verb: m[1], resource: m[2] };
};

const variants = (base) => {
  const parts = splitVerb(base);
  if (!parts) return { base, allBranch: null, own: null };
  return {
    base,
    allBranch: `${parts.verb}-all-branch-${parts.resource}`,
    own: `${parts.verb}-own-${parts.resource}`,
  };
};

export const resolveScope = (role, base) => {
  if (role?.isPredefined) return 'all';
  const actions = role?.actions || [];
  const { allBranch, own } = variants(base);
  if (allBranch && actions.includes(allBranch)) return 'all';
  if (actions.includes(base)) return 'branch';
  if (own && actions.includes(own)) return 'own';
  return 'none';
};

export const canSee = (role, base) => resolveScope(role, base) !== 'none';

// Kept for callers that still use the old names.
export const can = canSee;

export const onlyOwn = (role, base) => resolveScope(role, base) === 'own';

export const isOrgLevel = (role, base) => resolveScope(role, base) === 'all';

// True when the user can act on more than just their own record (i.e. has
// branch-level or all-branch grants). Use this to gate Create/Edit/Delete buttons.
export const canEditScope = (role, base) => {
  const scope = resolveScope(role, base);
  return scope === 'all' || scope === 'branch';
};

// Convenience: did the user explicitly receive any of these literal action keys?
// Use this when you need a non-scoped binary check (e.g. mark-attendance).
export const hasAnyAction = (role, keys) => {
  if (role?.isPredefined) return true;
  const actions = role?.actions || [];
  return keys.some((k) => actions.includes(k));
};

// Normalises a branch reference (populated `{ _id, name }` or a raw id) to a string.
export const branchIdOf = (b) => String(b?._id || b || '');

// Branch reach for a single record: an org-scoped grant covers every branch, a
// branch-scoped grant only records in the user's own branch. Mirrors the API's
// `canXAll || record.branchId === user.branchId` checks.
export const canActInBranch = (role, base, userBranchId, targetBranch) => {
  const scope = resolveScope(role, base);
  if (scope === 'all') return true;
  if (scope !== 'branch') return false;
  const target = branchIdOf(targetBranch);
  return !!target && target === branchIdOf(userBranchId);
};
