// Pure helpers for the Certificates module: labels, date formatting, list /
// issue payload builders, and the formal English + Urdu certificate wording.
// No React and no '@/…' imports, so node tests can load it directly.

export const CERTIFICATE_TYPES = ['slc', 'character', 'bonafide', 'fee-clearance'];
export const CERTIFICATE_STATUSES = ['issued', 'cancelled'];
export const SLC_REASONS = ['transfer', 'completed', 'parent-request', 'other'];
export const CONDUCTS = ['excellent', 'very-good', 'good', 'satisfactory'];

export const CERTIFICATE_STATUS_COLORS = {
  issued: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const TYPE_TITLES = {
  en: {
    slc: 'School Leaving Certificate',
    character: 'Character Certificate',
    bonafide: 'Bonafide Certificate',
    'fee-clearance': 'Fee Clearance Certificate',
  },
  ur: {
    slc: 'سکول لیونگ سرٹیفکیٹ',
    character: 'کریکٹر سرٹیفکیٹ',
    bonafide: 'بونافائیڈ سرٹیفکیٹ',
    'fee-clearance': 'فیس کلیئرنس سرٹیفکیٹ',
  },
};

const REASON_LABELS = {
  en: {
    transfer: 'Transfer to another school',
    completed: 'Completion of studies',
    'parent-request': 'Request of the parent / guardian',
    other: 'Other',
  },
  ur: {
    transfer: 'دوسرے سکول میں منتقلی',
    completed: 'تعلیم کی تکمیل',
    'parent-request': 'والدین / سرپرست کی درخواست',
    other: 'دیگر',
  },
};

// Urdu adjectives agree with masculine nouns (چال چلن / اخلاق).
const CONDUCT_LABELS = {
  en: {
    excellent: 'Excellent',
    'very-good': 'Very good',
    good: 'Good',
    satisfactory: 'Satisfactory',
  },
  ur: {
    excellent: 'بہترین',
    'very-good': 'بہت اچھا',
    good: 'اچھا',
    satisfactory: 'تسلی بخش',
  },
};

const UR_MONTHS = [
  'جنوری',
  'فروری',
  'مارچ',
  'اپریل',
  'مئی',
  'جون',
  'جولائی',
  'اگست',
  'ستمبر',
  'اکتوبر',
  'نومبر',
  'دسمبر',
];
const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Print-page labels in both languages. */
export const PRINT_LABELS = {
  en: {
    serial: 'Serial No.',
    issueDate: 'Date of issue',
    principal: 'Principal',
    verificationCode: 'Verification code',
    verifyAt: 'Verify this certificate at',
    cancelled: 'CANCELLED',
    stamp: 'School stamp',
    branch: 'Branch',
  },
  ur: {
    serial: 'سیریل نمبر',
    issueDate: 'تاریخِ اجراء',
    principal: 'پرنسپل',
    verificationCode: 'تصدیقی کوڈ',
    verifyAt: 'اس سرٹیفکیٹ کی تصدیق کے لیے',
    cancelled: 'منسوخ شدہ',
    stamp: 'سکول کی مہر',
    branch: 'برانچ',
  },
};

const langOf = (lang) => (lang === 'ur' ? 'ur' : 'en');

export const certificateTitle = (type, lang = 'en') =>
  TYPE_TITLES[langOf(lang)][type] || TYPE_TITLES.en[type] || type || '';

export const certificateTypeLabel = (type) => TYPE_TITLES.en[type] || type || '—';

export const reasonLabel = (reason, lang = 'en') =>
  REASON_LABELS[langOf(lang)][reason] || reason || '';

export const conductLabel = (conduct, lang = 'en') =>
  CONDUCT_LABELS[langOf(lang)][conduct] || conduct || '';

const pad = (n) => String(n).padStart(2, '0');

/**
 * dd-MM-yyyy. A date-only value ('YYYY-MM-DD' or a stored UTC-midnight ISO)
 * keeps its calendar date; pass `{ local: true }` for a real timestamp
 * (e.g. issuedAt) to show the viewer's local calendar date.
 */
export function formatCertDate(value, { local = false } = {}) {
  if (!value) return '';
  if (local) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

/** 'YYYY-MM' → 'March 2026' / 'مارچ 2026'. */
export function formatCertMonth(ym, lang = 'en') {
  const m = /^(\d{4})-(\d{2})/.exec(String(ym ?? ''));
  if (!m) return '';
  const idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return '';
  return `${(langOf(lang) === 'ur' ? UR_MONTHS : EN_MONTHS)[idx]} ${m[1]}`;
}

/** Date-only YYYY-MM-DD from a server date (for form defaults). */
export const toYMD = (v) => {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v ?? ''));
  return m ? m[1] : '';
};

const genderOf = (g) => {
  const s = String(g || '').toLowerCase();
  if (s === 'male' || s === 'm') return 'male';
  if (s === 'female' || s === 'f') return 'female';
  return '';
};

/** Relation to the father: s/o, d/o — Urdu ولد / دختر. */
export function relationWord(gender, lang = 'en') {
  const g = genderOf(gender);
  if (langOf(lang) === 'ur') return g === 'male' ? 'ولد' : g === 'female' ? 'دختر' : 'ولد / دختر';
  return g === 'male' ? 's/o' : g === 'female' ? 'd/o' : 's/o / d/o';
}

/** English pronouns for the student. */
export function pronouns(gender) {
  const g = genderOf(gender);
  if (g === 'male') return { subj: 'he', obj: 'him', poss: 'his', Subj: 'He', Poss: 'His' };
  if (g === 'female') return { subj: 'she', obj: 'her', poss: 'her', Subj: 'She', Poss: 'Her' };
  return {
    subj: 'he/she',
    obj: 'him/her',
    poss: 'his/her',
    Subj: 'He/She',
    Poss: 'His/Her',
  };
}

// Urdu verb / noun forms that agree with the student's gender.
const urForms = (gender) => {
  const g = genderOf(gender);
  if (g === 'male') return { raha: 'رہا', ka: 'کا', student: 'طالب علم', tha: 'تھا' };
  if (g === 'female') return { raha: 'رہی', ka: 'کی', student: 'طالبہ', tha: 'تھی' };
  return { raha: 'رہا / رہی', ka: 'کا / کی', student: 'طالب علم / طالبہ', tha: 'تھا / تھی' };
};

// Bidi isolate for a left-to-right value (name, number, date) inside Urdu text.
const iso = (v) => `⁨${v}⁩`;

const classLine = (className, sectionName) => [className, sectionName].filter(Boolean).join(' - ');

// "Class 7" stays as is; a bare "7" / "Nursery" becomes "Class 7" / "Class Nursery".
export const enClass = (c) => (/^(class|grade)\b/i.test(c) ? c : `Class ${c}`);
// Urdu: "جماعت 7" — an English "Class " prefix is dropped to avoid "جماعت Class 7".
export const urClass = (c) => `جماعت ${iso(String(c).replace(/^class\s+/i, ''))}`;

const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

const clean = (v) => (v === undefined || v === null ? '' : String(v).trim());

/**
 * The certificate body as paragraphs for `lang` ('en' | 'ur').
 * `cert` = { type, snapshot, details, issuedAt }.
 */
export function buildCertificateText(cert, lang = 'en') {
  const L = langOf(lang);
  const s = cert?.snapshot || {};
  const d = cert?.details || {};
  const type = cert?.type;
  const name = clean(s.studentName) || '—';
  const father = clean(s.fatherName) || '—';
  const adm = clean(s.admissionNumber);
  const dob = formatCertDate(s.dob);
  const cls = classLine(clean(s.className), clean(s.sectionName));
  const year = clean(s.academicYear);
  const issueDate = formatCertDate(cert?.issuedAt, { local: true });
  const remarks = clean(d.remarks);
  const paragraphs = [];

  if (L === 'en') {
    const p = pronouns(s.gender);
    const who = `${name} ${relationWord(s.gender, 'en')} ${father}${adm ? `, Admission No. ${adm}` : ''}`;
    const born = dob ? `, date of birth ${dob}` : '';

    if (type === 'slc') {
      const admitted = formatCertDate(s.admissionDate);
      const left = formatCertDate(d.leavingDate);
      const lastClass = clean(d.lastClass) || cls;
      paragraphs.push(
        `Certified that ${who}${born}, ${admitted ? `was admitted to this school on ${admitted} and ` : ''}left the school on ${left || '—'}${lastClass ? ` while studying in ${enClass(lastClass)}` : ''}.`,
      );
      const note = clean(d.reasonNote);
      paragraphs.push(
        `Reason for leaving: ${reasonLabel(d.reason, 'en')}${note ? ` (${note})` : ''}.`,
      );
      if (d.conduct) {
        paragraphs.push(
          `${p.Poss} conduct during ${p.poss} stay at the school was ${conductLabel(d.conduct, 'en').toLowerCase()}.`,
        );
      }
      if (!d.forced && Number(d.outstandingAtIssue || 0) === 0) {
        paragraphs.push('All dues of the school have been cleared.');
      }
      if (remarks) paragraphs.push(`Remarks: ${remarks}`);
      paragraphs.push(`We wish ${p.obj} every success in the future.`);
    } else if (type === 'character') {
      const from = formatCertDate(d.fromDate);
      const to = formatCertDate(d.toDate);
      let period = 'has been a student of this school';
      if (from && to) period = `was a student of this school from ${from} to ${to}`;
      else if (from) period = `has been a student of this school since ${from}`;
      else if (to) period = `was a student of this school until ${to}`;
      paragraphs.push(`This is to certify that ${who}${born}, ${period}.`);
      const c = conductLabel(d.conduct || 'good', 'en').toLowerCase();
      paragraphs.push(
        `To the best of my knowledge, ${p.subj} bears ${article(c)} ${c} moral character. ${p.Subj} has not taken part in any activity against the discipline of the school.`,
      );
      if (remarks) paragraphs.push(`Remarks: ${remarks}`);
      paragraphs.push(`I wish ${p.obj} every success in life.`);
    } else if (type === 'bonafide') {
      paragraphs.push(
        `This is to certify that ${who}${born}, is a bonafide student of this school${cls ? `, currently studying in ${enClass(cls)}` : ''}${year ? ` in the academic session ${year}` : ''}.`,
      );
      const purpose = clean(d.purpose);
      paragraphs.push(
        `This certificate is issued on ${p.poss} request${purpose ? ` for the purpose of ${purpose}` : ''}.`,
      );
      const valid = formatCertDate(d.validTill);
      if (valid) paragraphs.push(`This certificate is valid till ${valid}.`);
    } else if (type === 'fee-clearance') {
      const upTo = formatCertMonth(d.clearedUpTo, 'en');
      paragraphs.push(
        `This is to certify that ${who}${cls ? `, student of ${enClass(cls)}` : ''}, has paid all dues of the school${upTo ? ` up to ${upTo}` : ''}, and nothing is outstanding against ${p.obj}${issueDate ? ` as on ${issueDate}` : ''}.`,
      );
      paragraphs.push(`This certificate is issued on ${p.poss} request.`);
    }
    return { lang: 'en', dir: 'ltr', title: certificateTitle(type, 'en'), paragraphs };
  }

  // ── Urdu ───────────────────────────────────────────
  const f = urForms(s.gender);
  const who = `${iso(name)} ${relationWord(s.gender, 'ur')} ${iso(father)}${adm ? `، داخلہ نمبر ${iso(adm)}` : ''}`;
  const born = dob ? `، تاریخِ پیدائش ${iso(dob)}` : '';

  if (type === 'slc') {
    const admitted = formatCertDate(s.admissionDate);
    const left = formatCertDate(d.leavingDate) || '—';
    const lastClass = clean(d.lastClass) || cls;
    const period = admitted
      ? `مورخہ ${iso(admitted)} سے مورخہ ${iso(left)} تک`
      : `مورخہ ${iso(left)} تک`;
    paragraphs.push(
      `تصدیق کی جاتی ہے کہ ${who}${born}، ${period} اس سکول میں زیرِ تعلیم ${f.raha}۔${lastClass ? ` سکول چھوڑتے وقت وہ ${urClass(lastClass)} ${f.ka} ${f.student} ${f.tha}۔` : ''}`,
    );
    const note = clean(d.reasonNote);
    paragraphs.push(
      `سکول چھوڑنے کی وجہ: ${reasonLabel(d.reason, 'ur')}${note ? ` (${iso(note)})` : ''}۔`,
    );
    if (d.conduct) {
      paragraphs.push(`دورانِ تعلیم اس کا چال چلن ${conductLabel(d.conduct, 'ur')} رہا۔`);
    }
    if (!d.forced && Number(d.outstandingAtIssue || 0) === 0) {
      paragraphs.push('سکول کے تمام واجبات ادا کر دیے گئے ہیں۔');
    }
    if (remarks) paragraphs.push(`ریمارکس: ${iso(remarks)}`);
    paragraphs.push('ہم اس کے روشن مستقبل کے لیے دعاگو ہیں۔');
  } else if (type === 'character') {
    const from = formatCertDate(d.fromDate);
    const to = formatCertDate(d.toDate);
    let period = `اس سکول میں زیرِ تعلیم ${f.raha}`;
    if (from && to)
      period = `مورخہ ${iso(from)} سے مورخہ ${iso(to)} تک اس سکول میں زیرِ تعلیم ${f.raha}`;
    else if (from) period = `مورخہ ${iso(from)} سے اس سکول میں زیرِ تعلیم ہے`;
    else if (to) period = `مورخہ ${iso(to)} تک اس سکول میں زیرِ تعلیم ${f.raha}`;
    paragraphs.push(`تصدیق کی جاتی ہے کہ ${who}${born}، ${period}۔`);
    paragraphs.push(
      `میری معلومات کے مطابق اس کا اخلاق ${conductLabel(d.conduct || 'good', 'ur')} ہے۔ اس نے سکول کے نظم و ضبط کے خلاف کسی سرگرمی میں حصہ نہیں لیا۔`,
    );
    if (remarks) paragraphs.push(`ریمارکس: ${iso(remarks)}`);
    paragraphs.push('ہم زندگی میں اس کی کامیابی کے لیے دعاگو ہیں۔');
  } else if (type === 'bonafide') {
    paragraphs.push(
      `تصدیق کی جاتی ہے کہ ${who}${born}، اس سکول ${f.ka} باقاعدہ ${f.student} ہے${cls ? ` اور${year ? ` تعلیمی سال ${iso(year)} میں` : ''} ${urClass(cls)} میں زیرِ تعلیم ہے` : ''}۔`,
    );
    const purpose = clean(d.purpose);
    paragraphs.push(
      `یہ سرٹیفکیٹ ${purpose ? `${iso(purpose)} کی غرض سے ` : ''}اس کی درخواست پر جاری کیا جاتا ہے۔`,
    );
    const valid = formatCertDate(d.validTill);
    if (valid) paragraphs.push(`یہ سرٹیفکیٹ مورخہ ${iso(valid)} تک کارآمد ہے۔`);
  } else if (type === 'fee-clearance') {
    const upTo = formatCertMonth(d.clearedUpTo, 'ur');
    paragraphs.push(
      `تصدیق کی جاتی ہے کہ ${who}${cls ? `، ${urClass(cls)} ${f.ka} ${f.student}` : ''}، نے ${upTo ? `${upTo} تک ` : ''}سکول کے تمام واجبات ادا کر دیے ہیں اور${issueDate ? ` مورخہ ${iso(issueDate)} تک` : ''} اس کے ذمے کوئی رقم واجب الادا نہیں ہے۔`,
    );
    paragraphs.push('یہ سرٹیفکیٹ اس کی درخواست پر جاری کیا جاتا ہے۔');
  }
  return { lang: 'ur', dir: 'rtl', title: certificateTitle(type, 'ur'), paragraphs };
}

/** Public verify URL: `${base}/verify/<code>` (base without a trailing slash). */
export function buildVerifyUrl(base, cert) {
  const root = String(base || '').replace(/\/+$/, '');
  const path =
    cert?.verifyPath ||
    (cert?.verificationCode ? `/verify/${encodeURIComponent(cert.verificationCode)}` : '');
  if (!path) return '';
  return `${root}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** GET /certificates query params from the filter state (empty values dropped). */
export function buildCertificateListParams(filters = {}) {
  const params = {};
  ['type', 'status', 'branchId', 'studentId', 'from', 'to'].forEach((k) => {
    const v = clean(filters[k]);
    if (v) params[k] = v;
  });
  const search = clean(filters.search);
  if (search) params.search = search;
  return params;
}

const DETAIL_FIELDS = {
  slc: ['leavingDate', 'reason', 'reasonNote', 'lastClass', 'conduct', 'remarks'],
  character: ['conduct', 'fromDate', 'toDate', 'remarks'],
  bonafide: ['purpose', 'validTill'],
  'fee-clearance': [],
};

/** POST /certificates body: only this type's fields, trimmed, empties dropped. */
export function buildIssuePayload({ type, studentId, values = {}, force = false }) {
  const details = {};
  (DETAIL_FIELDS[type] || []).forEach((k) => {
    const v = clean(values[k]);
    if (v) details[k] = v;
  });
  const payload = { type, studentId, details };
  if (type === 'slc' && force === true) payload.force = true;
  return payload;
}

/** academicStatus the student gets when an SLC is issued for `reason`. */
export function slcResultingStatus(reason) {
  if (reason === 'transfer') return 'transferred';
  if (reason === 'completed') return 'graduated';
  return 'dropped';
}

/** Row actions for a certificate list row. */
export function certificateRowActions(row, { canIssue = false } = {}) {
  const actions = ['view', 'print'];
  if (canIssue && row?.status === 'issued') actions.push('cancel');
  return actions;
}

/**
 * Whether the issue button may be pressed for an eligibility result.
 * `force` is the "Issue anyway" checkbox; only an SLC with dues can be forced,
 * and only by a user holding issue-certificate-with-dues.
 */
export function canSubmitIssue(eligibility, { force = false, canForce = false } = {}) {
  if (!eligibility) return false;
  if (eligibility.canIssue) return true;
  return (
    eligibility.type === 'slc' && !!eligibility.needsForce && canForce === true && force === true
  );
}
