// Pure helpers for the Admissions & Enquiry screens.
// Imported by node tests, so keep imports relative with .js extensions.
import { hasAnyAction, canActInBranch } from './permissions.js';

// Mirrors the backend CLASS_GRADE enum (class.model.ts) — same order.
export const CLASS_GRADES = [
  'nursery',
  'kg-1',
  'kg-2',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

const GRADE_NAMES = { nursery: 'Nursery', 'kg-1': 'KG-1', 'kg-2': 'KG-2' };

/** Readable label for a CLASS_GRADE value ('5' → 'Grade 5', 'kg-1' → 'KG-1'). */
export function gradeLabel(value) {
  if (value === undefined || value === null || value === '') return '—';
  const v = String(value);
  if (GRADE_NAMES[v]) return GRADE_NAMES[v];
  return /^\d+$/.test(v) ? `Grade ${v}` : v;
}

export const GRADE_OPTIONS = CLASS_GRADES.map((value) => ({ value, label: gradeLabel(value) }));

export const ENQUIRY_STATUSES = [
  'new',
  'follow-up',
  'test-scheduled',
  'test-done',
  'admitted',
  'closed',
];

export const STATUS_LABELS = {
  new: 'New',
  'follow-up': 'Follow-up',
  'test-scheduled': 'Test scheduled',
  'test-done': 'Test done',
  admitted: 'Admitted',
  closed: 'Closed',
};

export const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'follow-up': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'test-scheduled': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'test-done': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  admitted: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  closed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export const SOURCES = ['walk-in', 'phone', 'online', 'referral', 'other'];
/** Staff cannot create "online" enquiries — those come from the public form. */
export const STAFF_SOURCES = SOURCES.filter((s) => s !== 'online');
export const SOURCE_LABELS = {
  'walk-in': 'Walk-in',
  phone: 'Phone',
  online: 'Online form',
  referral: 'Referral',
  other: 'Other',
};

export const GUARDIAN_RELATIONS = ['father', 'mother', 'guardian', 'other'];

export const CLOSE_REASONS = [
  'not-interested',
  'no-seat',
  'failed-test',
  'joined-elsewhere',
  'duplicate',
  'other',
];
export const CLOSE_REASON_LABELS = {
  'not-interested': 'Not interested',
  'no-seat': 'No seat available',
  'failed-test': 'Failed test',
  'joined-elsewhere': 'Joined elsewhere',
  duplicate: 'Duplicate',
  other: 'Other',
};

export const TEST_RESULTS = ['pass', 'fail', 'absent'];

export const statusLabel = (s) => STATUS_LABELS[s] || s || '—';
export const sourceLabel = (s) => SOURCE_LABELS[s] || s || '—';
export const closeReasonLabel = (r) => CLOSE_REASON_LABELS[r] || r || '—';

/** Open = still being worked (not admitted, not closed). */
export const isOpenStatus = (status) => !!status && status !== 'admitted' && status !== 'closed';

/** Query params for GET /admission/enquiries — empty values dropped. */
export function buildEnquiryListParams(filters = {}) {
  const keys = [
    'branchId',
    'status',
    'source',
    'desiredGrade',
    'academicYear',
    'assignedTo',
    'followUpDue',
    'search',
    'from',
    'to',
  ];
  const out = {};
  for (const k of keys) {
    const v = typeof filters[k] === 'string' ? filters[k].trim() : filters[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

/** Date-only server value (ISO at UTC midnight or 'YYYY-MM-DD') → 'YYYY-MM-DD'. */
export function toYMD(value) {
  if (!value) return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** 'overdue' | 'today' | 'upcoming' | '' for an enquiry's next follow-up. */
export function followUpState(enquiry, todayYMD) {
  if (!isOpenStatus(enquiry?.status)) return '';
  const due = toYMD(enquiry?.nextFollowUpDate);
  if (!due || !todayYMD) return '';
  if (due < todayYMD) return 'overdue';
  if (due === todayYMD) return 'today';
  return 'upcoming';
}

/** ISO timestamp → value for an <input type="datetime-local"> in local time. */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) → ISO timestamp, '' if invalid. */
export function localInputToIso(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Which actions the detail view offers for an enquiry. Mirrors the backend's
 * status rules; the server stays the authority.
 */
export function enquiryActions(enquiry, { canManage = false, canAdmit = false } = {}) {
  const status = enquiry?.status;
  if (!canManage || !status) return [];
  if (status === 'admitted') return [];
  if (status === 'closed') return ['reopen'];
  const actions = ['follow-up', 'schedule-test'];
  if (enquiry?.test?.scheduledAt) actions.push('record-result');
  actions.push('edit', 'close');
  if (canAdmit) actions.push('admit');
  return actions;
}

/** Staff-side permission flags for the admissions page. */
export function admissionPermissions(role) {
  return {
    canView: hasAnyAction(role, [
      'view-enquiry',
      'view-all-branch-enquiry',
      'manage-enquiry',
      'manage-all-branch-enquiry',
    ]),
    canManageAny: hasAnyAction(role, ['manage-enquiry', 'manage-all-branch-enquiry']),
    canForms: hasAnyAction(role, ['manage-admission-form', 'manage-all-branch-admission-form']),
    canCreateStudent: hasAnyAction(role, ['create-student', 'create-all-branch-student']),
    canCreateParent: hasAnyAction(role, ['update-student', 'update-all-branch-student']),
    canGenerateVoucher: hasAnyAction(role, ['generate-voucher', 'generate-all-branch-voucher']),
  };
}

/** Manage rights on one enquiry (branch-scoped grants reach only the own branch). */
export function canManageEnquiry(role, userBranchId, enquiry) {
  return canActInBranch(role, 'manage-enquiry', userBranchId, enquiry?.branchId);
}

/** Chronological timeline entries for the detail view. */
export function enquiryTimeline(enquiry) {
  if (!enquiry) return [];
  const items = [];
  if (enquiry.createdAt) {
    items.push({
      kind: 'created',
      at: enquiry.createdAt,
      title: `Enquiry received (${sourceLabel(enquiry.source)})`,
      by: enquiry.createdByName || (enquiry.source === 'online' ? 'Online form' : ''),
    });
  }
  for (const f of enquiry.followUps || []) {
    items.push({
      kind: 'follow-up',
      at: f.at,
      title: 'Follow-up',
      text: f.note,
      next: toYMD(f.nextFollowUpDate),
      by: f.byName || '',
    });
  }
  const test = enquiry.test;
  if (test?.scheduledAt) {
    items.push({
      kind: 'test-scheduled',
      at: test.scheduledAt,
      title: `Test / interview scheduled${test.venue ? ` — ${test.venue}` : ''}`,
    });
  }
  if (test?.result) {
    const marks = test.marks !== undefined && test.marks !== null ? ` · ${test.marks} marks` : '';
    items.push({
      kind: 'test-result',
      at: test.recordedAt || test.scheduledAt,
      title: `Test result: ${test.result}${marks}`,
      text: test.remarks,
      by: test.recordedByName || '',
    });
  }
  if (enquiry.status === 'closed') {
    items.push({
      kind: 'closed',
      at: enquiry.closedAt || enquiry.updatedAt,
      title: `Closed — ${closeReasonLabel(enquiry.closedReason)}`,
      text: enquiry.closedNote,
    });
  }
  if (enquiry.admittedAt) {
    items.push({
      kind: 'admitted',
      at: enquiry.admittedAt,
      title: 'Admitted',
      by: enquiry.admittedByName || '',
    });
  }
  const t = (x) => {
    const n = new Date(x.at).getTime();
    return Number.isNaN(n) ? 0 : n;
  };
  return items.sort((a, b) => t(a) - t(b));
}

const clean = (v) => (typeof v === 'string' ? v.trim() : (v ?? ''));

/** Enquiry form values (create/edit) from an enquiry, or blank defaults. */
export function enquiryFormValues(enquiry, defaults = {}) {
  const e = enquiry || {};
  return {
    branchId: String(e.branchId?._id || e.branchId || defaults.branchId || ''),
    source: e.source || 'walk-in',
    academicYear: e.academicYear || defaults.academicYear || '',
    desiredGrade: e.desiredGrade || '',
    child: {
      name: clean(e.child?.name),
      gender: e.child?.gender || '',
      dob: toYMD(e.child?.dob),
      previousSchool: clean(e.child?.previousSchool),
      previousClass: clean(e.child?.previousClass),
    },
    guardian: {
      name: clean(e.guardian?.name),
      relation: e.guardian?.relation || 'father',
      phone: clean(e.guardian?.phone),
      email: clean(e.guardian?.email),
      cnic: clean(e.guardian?.cnic),
      occupation: clean(e.guardian?.occupation),
    },
    address: clean(e.address),
    notes: clean(e.notes),
    nextFollowUpDate: toYMD(e.nextFollowUpDate),
    assignedTo: String(e.assignedTo?._id || e.assignedTo || ''),
  };
}

const omitEmpty = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const c = typeof v === 'string' ? v.trim() : v;
    if (c !== '' && c !== undefined && c !== null) out[k] = c;
  }
  return out;
};

/**
 * Body for POST/PUT /admission/enquiries. On edit, an online enquiry keeps its
 * source (staff cannot set 'online'), and blank optional fields are sent as ''
 * so they can be cleared.
 */
export function buildEnquiryPayload(values, { isEdit = false, includeBranch = false } = {}) {
  const v = values || {};
  const body = {
    academicYear: clean(v.academicYear),
    desiredGrade: v.desiredGrade,
    child: omitEmpty(v.child),
    guardian: omitEmpty(v.guardian),
  };
  if (!(isEdit && v.source === 'online')) body.source = v.source;
  if (includeBranch && v.branchId) body.branchId = v.branchId;
  for (const k of ['address', 'notes', 'nextFollowUpDate', 'assignedTo']) {
    const c = clean(v[k]);
    if (c !== '') body[k] = c;
    else if (isEdit) body[k] = '';
  }
  return body;
}

/** First class of the year whose grade matches the enquiry's desired grade. */
export function classForGrade(classes, grade) {
  if (!grade) return null;
  return (classes || []).find((c) => String(c?.grade) === String(grade)) || null;
}

/** True when the picked class is not of the enquiry's desired grade. */
export function isDifferentGrade(classes, classId, grade) {
  if (!classId || !grade) return false;
  const c = (classes || []).find((x) => String(x?._id) === String(classId));
  return !!c && String(c.grade) !== String(grade);
}

/** Section fill status for the section picker. */
export function sectionFull(section) {
  const cap = Number(section?.capacity);
  const cur = Number(section?.currentStrength) || 0;
  return Number.isFinite(cap) && cap > 0 && cur >= cap;
}

/**
 * Admit form defaults from an enquiry: child → student; guardian → father /
 * mother / guardian by relation; guardian also seeds the emergency contact.
 */
export function admitPrefill(enquiry, { today = '', academicYear = '' } = {}) {
  const e = enquiry || {};
  const g = e.guardian || {};
  const relation = g.relation || 'other';
  const person = { name: clean(g.name), phone: clean(g.phone), cnic: clean(g.cnic) };
  const father = { name: '', cnic: '', phone: '', email: '', occupation: '' };
  const mother = { name: '', cnic: '', phone: '', occupation: '' };
  const guardian = { name: '', relation: '', phone: '', cnic: '' };
  if (relation === 'father') {
    Object.assign(father, person, { email: clean(g.email), occupation: clean(g.occupation) });
  } else if (relation === 'mother') {
    Object.assign(mother, person, { occupation: clean(g.occupation) });
  } else {
    Object.assign(guardian, person, { relation: relation === 'guardian' ? 'Guardian' : 'Other' });
  }
  const prevSchool = clean(e.child?.previousSchool);
  const prevClass = clean(e.child?.previousClass);
  return {
    name: clean(e.child?.name),
    email: '',
    gender: e.child?.gender || '',
    dob: toYMD(e.child?.dob),
    academicYear: e.academicYear || academicYear,
    classId: '',
    sectionId: '',
    admissionDate: today,
    admissionType: prevSchool ? 'transfer' : 'new',
    phone: '',
    whatsappNumber: '',
    bloodGroup: '',
    nationality: 'Pakistani',
    religion: '',
    bForm: '',
    placeOfBirth: '',
    father,
    mother,
    guardian,
    emergencyContact: {
      name: person.name,
      phone: person.phone,
      relation: relation === 'other' ? '' : relation.charAt(0).toUpperCase() + relation.slice(1),
    },
    address: { street: clean(e.address), city: '', state: '', postalCode: '', country: '' },
    previousSchool: { name: prevSchool, lastClass: prevClass, reasonForLeaving: '' },
  };
}

/** Parent-account defaults from the enquiry guardian. */
export function parentPrefillFromEnquiry(enquiry) {
  const g = enquiry?.guardian || {};
  return {
    relation: GUARDIAN_RELATIONS.includes(g.relation) ? g.relation : 'father',
    name: clean(g.name),
    email: clean(g.email),
    phone: clean(g.phone),
  };
}

/** Body for POST /admission/enquiries/:id/admit. */
export function buildAdmitPayload(values, { allowDifferentGrade = false, parent = null } = {}) {
  const v = values || {};
  const student = omitEmpty({
    name: v.name,
    email: v.email,
    gender: v.gender,
    dob: v.dob,
    phone: v.phone,
    admissionType: v.admissionType,
    bloodGroup: v.bloodGroup,
    nationality: v.nationality,
    religion: v.religion,
    bForm: v.bForm,
    placeOfBirth: v.placeOfBirth,
  });
  // As in the student create form, the WhatsApp number travels under father.
  student.father = omitEmpty({ ...v.father, whatsappNumber: v.whatsappNumber });
  student.mother = omitEmpty(v.mother);
  const guardian = omitEmpty(v.guardian);
  if (guardian.name) student.guardian = guardian;
  student.emergencyContact = omitEmpty(v.emergencyContact);
  student.address = omitEmpty(v.address);
  if (v.admissionType === 'transfer') {
    const prev = omitEmpty(v.previousSchool);
    if (Object.keys(prev).length) student.previousSchool = prev;
  }
  const body = {
    classId: v.classId,
    sectionId: v.sectionId,
    academicYear: clean(v.academicYear),
    student,
  };
  if (clean(v.admissionDate)) body.admissionDate = clean(v.admissionDate);
  if (allowDifferentGrade) body.allowDifferentGrade = true;
  if (parent) {
    body.createParent = omitEmpty({
      relation: parent.relation,
      name: parent.name,
      email: parent.email,
      password: parent.password,
      phone: parent.phone,
    });
    // Keep the password exactly as typed (no trim).
    if (parent.password) body.createParent.password = parent.password;
  }
  return body;
}

/**
 * Outcome of the follow-up POST /fee/voucher/generate-student call:
 * 201 → created, 200 with `skipped` → skipped (e.g. already exists).
 */
export function voucherOutcome(status, body) {
  const data = body?.data;
  if (status === 201) {
    return {
      kind: 'created',
      message: body?.message || 'Voucher generated',
      voucherNumber: data?.voucherNumber || '',
    };
  }
  if (data?.skipped) {
    return { kind: 'skipped', message: body?.message || 'Voucher not generated' };
  }
  return { kind: 'created', message: body?.message || 'Voucher generated', voucherNumber: '' };
}

/** GET /admission/forms answers one form or a list — normalise to a list. */
export function normalizeForms(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.forms)) return data.forms;
  if (typeof data === 'object' && (data.branchId || data.publicKey)) return [data];
  return [];
}

/** The form for one branch out of a forms list. */
export function formForBranch(forms, branchId) {
  const id = String(branchId || '');
  return (forms || []).find((f) => String(f?.branchId?._id || f?.branchId || '') === id) || null;
}

/** Public apply link on the parent portal. */
export function publicApplyUrl(baseUrl, form) {
  if (!form) return '';
  const path = form.publicUrlPath || (form.publicKey ? `/apply/${form.publicKey}` : '');
  if (!path) return '';
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Sum of a { key: count } map. */
export const sumCounts = (map) =>
  Object.values(map || {}).reduce((a, n) => a + (Number(n) || 0), 0);

export const enquiryChildName = (e) => e?.child?.name || '—';
export const staffName = (s) => s?.user?.name || s?.userId?.name || s?.name || 'Staff';
