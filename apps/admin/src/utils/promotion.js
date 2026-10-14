// Pure helpers for the Year-end Promotion screens (academic-year rollover).
// No React / alias imports — covered by promotion.test.mjs.

export const DECISIONS = ['promote', 'detain', 'left', 'passout'];

/** Decisions that move the student into a new-year section (need a target). */
export const targetKind = (decision) =>
  decision === 'promote' || decision === 'detain' ? decision : null;

/** Already processed in this run (a record exists and was not undone). */
export const isProcessed = (student) => !!student?.record && !student.record.undone;

/**
 * Decisions offered for a student. Promote is hidden for the last grade (there
 * is no next grade); Pass out only shows for the last grade unless the backend
 * itself suggested it for this student.
 */
export function allowedDecisions(isLastGrade, student) {
  if (isLastGrade) return ['passout', 'detain', 'left'];
  const list = ['promote', 'detain', 'left'];
  if (student?.suggested === 'passout') list.push('passout');
  return list;
}

/** Default decision: last grade → passout, else the backend's suggestion (promote). */
export function defaultDecision(student, isLastGrade) {
  if (isLastGrade) return 'passout';
  return student?.suggested === 'passout' ? 'passout' : 'promote';
}

/** Seats left in a target section after `planned` more students. */
export function remainingRoom(target, planned = 0) {
  const cap = Number(target?.capacity);
  if (!Number.isFinite(cap) || cap <= 0) return Infinity;
  return cap - (Number(target?.currentStrength) || 0) - planned;
}

const norm = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase();

/**
 * Default target section: the one with the same name as the old section if it
 * has room, else the first one with room. When everything is full it still
 * returns the same-name (or first) section so the backend can report it.
 * `load` maps targetId → students already planned into it.
 */
export function pickDefaultTarget(targets, fromSectionName, load = {}) {
  if (!Array.isArray(targets) || targets.length === 0) return '';
  const roomOf = (t) => remainingRoom(t, load[t._id] || 0);
  const same = targets.find((t) => norm(t.name) === norm(fromSectionName));
  if (same && roomOf(same) > 0) return same._id;
  const withRoom = targets.find((t) => roomOf(t) > 0);
  if (withRoom) return withRoom._id;
  return (same || targets[0])._id;
}

const targetsFor = (targets, decision) => {
  const kind = targetKind(decision);
  return kind ? targets?.[kind] || [] : [];
};

/** targetId → number of planned students (optionally ignoring some students). */
export function plannedLoad(plan, excludeIds = []) {
  const skip = new Set(excludeIds);
  const load = {};
  for (const [id, entry] of Object.entries(plan || {})) {
    if (skip.has(id) || !targetKind(entry?.decision) || !entry.toSectionId) continue;
    load[entry.toSectionId] = (load[entry.toSectionId] || 0) + 1;
  }
  return load;
}

/**
 * Sets `decision` for the given students and picks a default target for each,
 * filling sections in order while respecting the room left by the rest of the
 * plan. Returns a new plan; the input is not modified.
 */
export function setDecisions(plan, studentIds, decision, { targets, fromSectionName } = {}) {
  const next = { ...(plan || {}) };
  const load = plannedLoad(next, studentIds);
  const list = targetsFor(targets, decision);
  for (const id of studentIds) {
    let toSectionId = '';
    if (targetKind(decision)) {
      toSectionId = pickDefaultTarget(list, fromSectionName, load);
      if (toSectionId) load[toSectionId] = (load[toSectionId] || 0) + 1;
    }
    next[id] = { decision, toSectionId };
  }
  return next;
}

/**
 * Default plan for every not-yet-processed student of a section:
 * { [studentId]: { decision, toSectionId } }.
 */
export function buildDefaultPlan({ students, targets, fromSectionName, isLastGrade }) {
  let plan = {};
  const pending = (students || []).filter((s) => !isProcessed(s));
  // Group by decision so each group fills sections in roll order.
  const groups = {};
  for (const s of pending) {
    const d = defaultDecision(s, isLastGrade);
    (groups[d] ||= []).push(s._id);
  }
  for (const [decision, ids] of Object.entries(groups)) {
    plan = setDecisions(plan, ids, decision, { targets, fromSectionName });
  }
  return plan;
}

/** Students in `ids` whose decision needs a target section but has none. */
export function missingTargets(plan, ids) {
  return ids.filter((id) => {
    const e = plan?.[id];
    return !e || !e.decision || (targetKind(e.decision) && !e.toSectionId);
  });
}

/** Body entries for POST …/apply. */
export function toApplyPayload(plan, ids) {
  return ids
    .filter((id) => plan?.[id]?.decision)
    .map((id) => {
      const { decision, toSectionId } = plan[id];
      return targetKind(decision)
        ? { studentId: id, decision, toSectionId }
        : { studentId: id, decision };
    });
}

/** Count of each decision among the given plan entries (or all of them). */
export function countDecisions(plan, ids) {
  const counts = { promote: 0, detain: 0, left: 0, passout: 0 };
  const keys = ids || Object.keys(plan || {});
  for (const id of keys) {
    const d = plan?.[id]?.decision;
    if (d in counts) counts[d] += 1;
  }
  return counts;
}

/** Totals over a run's sections: students / processed / remaining / sections done. */
export function summarizeSections(sections) {
  const out = { students: 0, processed: 0, remaining: 0, sectionsDone: 0, sectionsTotal: 0 };
  for (const s of sections || []) {
    const students = Number(s?.students) || 0;
    const processed = Math.min(Number(s?.processed) || 0, students);
    out.students += students;
    out.processed += processed;
    out.sectionsTotal += 1;
    if (processed >= students) out.sectionsDone += 1;
  }
  out.remaining = out.students - out.processed;
  return out;
}

/** 0–100, rounded; 100 when there is nothing to process. */
export function progressPercent(processed, students) {
  const total = Number(students) || 0;
  if (total <= 0) return 100;
  return Math.round((Math.min(Number(processed) || 0, total) / total) * 100);
}

/**
 * Normalises the per-section unprocessed counts a refused "complete" returns
 * (error `data`) into [{ label, count }]. Accepts an array of rows, an object
 * holding such an array, or a plain { name: count } map.
 */
export function unprocessedRows(data) {
  if (!data) return [];
  let rows = Array.isArray(data)
    ? data
    : data.sections || data.unprocessed || data.counts || data.pending || null;
  if (!rows && typeof data === 'object') {
    rows = Object.entries(data)
      .filter(([, v]) => typeof v === 'number')
      .map(([label, count]) => ({ label, count }));
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const className = r.className || r.fromClass?.name || r.class?.name || r.classId?.name || '';
      const sectionName =
        r.sectionName ||
        r.section?.name ||
        r.fromSection?.name ||
        r.sectionId?.name ||
        r.name ||
        '';
      const label = r.label || [className, sectionName].filter(Boolean).join(' – ') || '—';
      const count = Number(r.count ?? r.students ?? r.remaining ?? r.enrolled ?? r.n ?? 0) || 0;
      return { label, count };
    })
    .filter((r) => r.count > 0);
}
