// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatCertDate,
  formatCertMonth,
  toYMD,
  relationWord,
  pronouns,
  reasonLabel,
  conductLabel,
  certificateTitle,
  buildCertificateText,
  buildVerifyUrl,
  buildCertificateListParams,
  buildIssuePayload,
  slcResultingStatus,
  certificateRowActions,
  canSubmitIssue,
  enClass,
  urClass,
} from './certificateText.js';

const strip = (s) => s.replace(/[⁨⁩]/g, '');

const snapshot = (gender) => ({
  studentName: 'Ali Raza',
  fatherName: 'Raza Khan',
  gender,
  dob: '2012-04-05T00:00:00.000Z',
  admissionNumber: 'ADM-17',
  admissionDate: '2019-04-01',
  className: 'Class 7',
  sectionName: 'A',
  academicYear: '2026-2027',
});

test('formatCertDate: date-only, UTC-midnight ISO, empty', () => {
  assert.equal(formatCertDate('2026-03-09'), '09-03-2026');
  assert.equal(formatCertDate('2026-03-09T00:00:00.000Z'), '09-03-2026');
  assert.equal(formatCertDate(''), '');
  assert.equal(formatCertDate(null), '');
  assert.equal(formatCertDate('nonsense'), '');
});

test('formatCertDate local uses local calendar parts', () => {
  const d = new Date(2026, 9, 13, 23, 30);
  assert.equal(formatCertDate(d.toISOString(), { local: true }), '13-10-2026');
});

test('formatCertMonth in both languages', () => {
  assert.equal(formatCertMonth('2026-03'), 'March 2026');
  assert.equal(formatCertMonth('2026-03', 'ur'), 'مارچ 2026');
  assert.equal(formatCertMonth('2026-13'), '');
  assert.equal(formatCertMonth(undefined), '');
});

test('toYMD', () => {
  assert.equal(toYMD('2026-01-02T00:00:00Z'), '2026-01-02');
  assert.equal(toYMD(null), '');
});

test('relationWord by gender', () => {
  assert.equal(relationWord('male'), 's/o');
  assert.equal(relationWord('Female'), 'd/o');
  assert.equal(relationWord(''), 's/o / d/o');
  assert.equal(relationWord('male', 'ur'), 'ولد');
  assert.equal(relationWord('female', 'ur'), 'دختر');
  assert.equal(relationWord(undefined, 'ur'), 'ولد / دختر');
});

test('pronouns', () => {
  assert.equal(pronouns('male').obj, 'him');
  assert.equal(pronouns('female').Poss, 'Her');
  assert.equal(pronouns('').subj, 'he/she');
});

test('reason, conduct and title labels in both languages', () => {
  assert.equal(reasonLabel('transfer'), 'Transfer to another school');
  assert.equal(reasonLabel('completed', 'ur'), 'تعلیم کی تکمیل');
  assert.equal(reasonLabel('parent-request', 'ur'), 'والدین / سرپرست کی درخواست');
  assert.equal(reasonLabel('other', 'ur'), 'دیگر');
  assert.equal(conductLabel('very-good'), 'Very good');
  assert.equal(conductLabel('excellent', 'ur'), 'بہترین');
  assert.equal(certificateTitle('slc'), 'School Leaving Certificate');
  assert.equal(certificateTitle('fee-clearance', 'ur'), 'فیس کلیئرنس سرٹیفکیٹ');
});

test('SLC English text', () => {
  const t = buildCertificateText(
    {
      type: 'slc',
      snapshot: snapshot('male'),
      details: {
        leavingDate: '2026-10-10',
        reason: 'transfer',
        reasonNote: 'Family moved to Lahore',
        lastClass: 'Class 7 - A',
        conduct: 'very-good',
        outstandingAtIssue: 0,
        forced: false,
      },
    },
    'en',
  );
  assert.equal(t.dir, 'ltr');
  assert.equal(t.title, 'School Leaving Certificate');
  assert.equal(
    t.paragraphs[0],
    'Certified that Ali Raza s/o Raza Khan, Admission No. ADM-17, date of birth 05-04-2012, was admitted to this school on 01-04-2019 and left the school on 10-10-2026 while studying in Class 7 - A.',
  );
  assert.ok(
    t.paragraphs.includes(
      'Reason for leaving: Transfer to another school (Family moved to Lahore).',
    ),
  );
  assert.ok(t.paragraphs.includes('His conduct during his stay at the school was very good.'));
  assert.ok(t.paragraphs.includes('All dues of the school have been cleared.'));
});

test('SLC forced with dues omits the dues-cleared line', () => {
  const t = buildCertificateText(
    {
      type: 'slc',
      snapshot: snapshot('female'),
      details: {
        leavingDate: '2026-10-10',
        reason: 'other',
        outstandingAtIssue: 500,
        forced: true,
      },
    },
    'en',
  );
  assert.ok(t.paragraphs[0].includes('Ali Raza d/o Raza Khan'));
  assert.ok(!t.paragraphs.includes('All dues of the school have been cleared.'));
  assert.ok(t.paragraphs.at(-1).includes('her'));
});

test('SLC Urdu text is RTL with gender agreement', () => {
  const t = buildCertificateText(
    {
      type: 'slc',
      snapshot: snapshot('female'),
      details: {
        leavingDate: '2026-10-10',
        reason: 'completed',
        lastClass: 'Class 7',
        conduct: 'good',
        outstandingAtIssue: 0,
      },
    },
    'ur',
  );
  assert.equal(t.dir, 'rtl');
  assert.equal(t.title, 'سکول لیونگ سرٹیفکیٹ');
  const p0 = strip(t.paragraphs[0]);
  assert.ok(p0.startsWith('تصدیق کی جاتی ہے کہ Ali Raza دختر Raza Khan'));
  assert.ok(p0.includes('مورخہ 01-04-2019 سے مورخہ 10-10-2026 تک'));
  assert.ok(p0.includes('زیرِ تعلیم رہی'));
  assert.ok(p0.includes('جماعت 7 کی طالبہ تھی'));
  assert.ok(t.paragraphs.includes('سکول چھوڑنے کی وجہ: تعلیم کی تکمیل۔'));
  assert.ok(t.paragraphs.includes('دورانِ تعلیم اس کا چال چلن اچھا رہا۔'));
});

test('character certificate period variants', () => {
  const base = { type: 'character', snapshot: snapshot('male') };
  const both = buildCertificateText(
    { ...base, details: { conduct: 'excellent', fromDate: '2019-04-01', toDate: '2026-03-31' } },
    'en',
  );
  assert.ok(
    both.paragraphs[0].includes('was a student of this school from 01-04-2019 to 31-03-2026'),
  );
  assert.ok(
    both.paragraphs[1].startsWith(
      'To the best of my knowledge, he bears an excellent moral character.',
    ),
  );
  const since = buildCertificateText(
    { ...base, details: { conduct: 'good', fromDate: '2019-04-01' } },
    'en',
  );
  assert.ok(since.paragraphs[0].includes('has been a student of this school since 01-04-2019'));
  assert.ok(since.paragraphs[1].includes('bears a good moral character'));
  const ur = buildCertificateText(
    { ...base, details: { conduct: 'very-good', fromDate: '2019-04-01', toDate: '2026-03-31' } },
    'ur',
  );
  assert.ok(strip(ur.paragraphs[0]).includes('Ali Raza ولد Raza Khan'));
  assert.ok(strip(ur.paragraphs[0]).includes('زیرِ تعلیم رہا۔'));
  assert.ok(ur.paragraphs[1].startsWith('میری معلومات کے مطابق اس کا اخلاق بہت اچھا ہے۔'));
});

test('bonafide certificate', () => {
  const cert = {
    type: 'bonafide',
    snapshot: snapshot('female'),
    details: { purpose: 'opening a bank account', validTill: '2026-12-31' },
  };
  const en = buildCertificateText(cert, 'en');
  assert.ok(
    en.paragraphs[0].includes(
      'is a bonafide student of this school, currently studying in Class 7 - A in the academic session 2026-2027.',
    ),
  );
  assert.equal(
    en.paragraphs[1],
    'This certificate is issued on her request for the purpose of opening a bank account.',
  );
  assert.equal(en.paragraphs[2], 'This certificate is valid till 31-12-2026.');
  const ur = buildCertificateText(cert, 'ur');
  assert.ok(strip(ur.paragraphs[0]).includes('اس سکول کی باقاعدہ طالبہ ہے'));
  assert.ok(strip(ur.paragraphs[2]).includes('مورخہ 31-12-2026 تک کارآمد ہے'));
});

test('fee clearance certificate', () => {
  const cert = {
    type: 'fee-clearance',
    snapshot: snapshot('male'),
    details: { clearedUpTo: '2026-10', outstandingAtIssue: 0 },
    issuedAt: new Date(2026, 9, 13, 10).toISOString(),
  };
  const en = buildCertificateText(cert, 'en');
  assert.ok(
    en.paragraphs[0].includes(
      'has paid all dues of the school up to October 2026, and nothing is outstanding against him as on 13-10-2026.',
    ),
  );
  const ur = buildCertificateText(cert, 'ur');
  assert.ok(strip(ur.paragraphs[0]).includes('جماعت 7 - A کا طالب علم'));
  assert.ok(strip(ur.paragraphs[0]).includes('اکتوبر 2026 تک سکول کے تمام واجبات'));
});

test('enClass / urClass avoid a doubled prefix', () => {
  assert.equal(enClass('Class 7'), 'Class 7');
  assert.equal(enClass('Nursery'), 'Class Nursery');
  assert.equal(strip(urClass('Class 7')), 'جماعت 7');
  assert.equal(strip(urClass('5')), 'جماعت 5');
});

test('buildVerifyUrl', () => {
  assert.equal(
    buildVerifyUrl('http://localhost:3003/', { verifyPath: '/verify/ABC234' }),
    'http://localhost:3003/verify/ABC234',
  );
  assert.equal(
    buildVerifyUrl('https://p.example.com', { verificationCode: 'XYZ' }),
    'https://p.example.com/verify/XYZ',
  );
  assert.equal(buildVerifyUrl('x', {}), '');
});

test('buildCertificateListParams drops empty values', () => {
  assert.deepEqual(
    buildCertificateListParams({
      type: 'slc',
      status: '',
      branchId: 'b1',
      search: '  ali ',
      from: '2026-01-01',
      to: '',
    }),
    { type: 'slc', branchId: 'b1', from: '2026-01-01', search: 'ali' },
  );
});

test('buildIssuePayload keeps only the type fields and force for slc', () => {
  assert.deepEqual(
    buildIssuePayload({
      type: 'slc',
      studentId: 's1',
      values: {
        leavingDate: '2026-10-10',
        reason: 'transfer',
        reasonNote: ' ',
        purpose: 'x',
        conduct: 'good',
      },
      force: true,
    }),
    {
      type: 'slc',
      studentId: 's1',
      details: { leavingDate: '2026-10-10', reason: 'transfer', conduct: 'good' },
      force: true,
    },
  );
  assert.deepEqual(
    buildIssuePayload({
      type: 'bonafide',
      studentId: 's1',
      values: { purpose: ' bank ' },
      force: true,
    }),
    { type: 'bonafide', studentId: 's1', details: { purpose: 'bank' } },
  );
  assert.deepEqual(
    buildIssuePayload({ type: 'fee-clearance', studentId: 's1', values: { remarks: 'x' } }),
    {
      type: 'fee-clearance',
      studentId: 's1',
      details: {},
    },
  );
});

test('slcResultingStatus', () => {
  assert.equal(slcResultingStatus('transfer'), 'transferred');
  assert.equal(slcResultingStatus('completed'), 'graduated');
  assert.equal(slcResultingStatus('parent-request'), 'dropped');
  assert.equal(slcResultingStatus('other'), 'dropped');
});

test('certificateRowActions', () => {
  assert.deepEqual(certificateRowActions({ status: 'issued' }), ['view', 'print']);
  assert.deepEqual(certificateRowActions({ status: 'issued' }, { canIssue: true }), [
    'view',
    'print',
    'cancel',
  ]);
  assert.deepEqual(certificateRowActions({ status: 'cancelled' }, { canIssue: true }), [
    'view',
    'print',
  ]);
});

test('canSubmitIssue', () => {
  assert.equal(canSubmitIssue(null), false);
  assert.equal(canSubmitIssue({ type: 'bonafide', canIssue: true }), true);
  const dues = { type: 'slc', canIssue: false, needsForce: true };
  assert.equal(canSubmitIssue(dues), false);
  assert.equal(canSubmitIssue(dues, { force: true }), false);
  assert.equal(canSubmitIssue(dues, { force: true, canForce: true }), true);
  assert.equal(
    canSubmitIssue(
      { type: 'fee-clearance', canIssue: false, needsForce: true },
      { force: true, canForce: true },
    ),
    false,
  );
});
