'use client';
// Admit an enquiry: enrols the student (prefilled from the enquiry), optionally
// creates/links a parent portal account, then — as a SEPARATE call — optionally
// generates the first fee voucher through the existing fee endpoint.
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Info, XCircle, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import Switch from '@/component/Switch';
import { fetchData, postData, postDataWithStatus } from '@/utils/api';
import { localYM, localYMD } from '@/utils/localDate';
import { academicYearStartMonth, currentAcademicYear } from '@/utils/academicYear';
import { PARENT_PASSWORD_MIN } from '@/utils/parentAccounts';
import { invalidateFeeQueries } from '@/utils/feeQueries';
import { useTokenStore } from '@/store/tokenStore';
import {
  GUARDIAN_RELATIONS,
  admitPrefill,
  buildAdmitPayload,
  academicYearMonthBounds,
  classForGrade,
  defaultVoucherMonth,
  gradeLabel,
  isDifferentGrade,
  parentPrefillFromEnquiry,
  sectionFull,
  voucherOutcome,
} from '@/utils/admission';
import {
  Field,
  inputCls,
  invalidateAdmissionData,
  modalPrimary,
  modalSecondary,
  sectionHeadingCls,
  warningsOf,
} from './admissionShared';
import { yearOptions } from './OverviewPanel';

const ACADEMIC_YEAR_REGEX = /^\d{4}-\d{4}$/;
const optionalEmail = yup
  .string()
  .transform((v) => (v === '' ? undefined : v))
  .email('Invalid email')
  .optional();

// Student fields mirror AddStudentModal's validation (students/AddStudentModal.jsx).
const schema = yup.object().shape({
  name: yup.string().trim().required('Name is required'),
  email: yup.string().trim().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
  whatsappNumber: yup
    .string()
    .optional()
    .test(
      'wa-digits',
      'Enter a valid number (8–15 digits with country code, e.g. 923001234567)',
      (v) => {
        if (!v) return true;
        const d = v.replace(/\D/g, '');
        return d.length >= 8 && d.length <= 15;
      },
    ),
  classId: yup.string().required('Class is required'),
  sectionId: yup.string().required('Section is required'),
  academicYear: yup
    .string()
    .matches(ACADEMIC_YEAR_REGEX, 'Academic year must be in format YYYY-YYYY')
    .required('Academic year is required'),
  admissionDate: yup.string().required('Admission date is required'),
  admissionType: yup.string().oneOf(['new', 'transfer'], 'Select admission type').optional(),
  dob: yup.string().required('Date of birth is required'),
  gender: yup
    .string()
    .oneOf(['male', 'female', 'other'], 'Select a gender')
    .required('Gender is required'),
  bloodGroup: yup.string().optional(),
  nationality: yup.string().optional(),
  religion: yup.string().optional(),
  bForm: yup.string().optional(),
  placeOfBirth: yup.string().optional(),
  father: yup.object().shape({
    name: yup.string().required("Father's name is required"),
    cnic: yup.string().optional(),
    phone: yup.string().optional(),
    email: optionalEmail,
    occupation: yup.string().optional(),
  }),
  mother: yup.object().shape({
    name: yup.string().required("Mother's name is required"),
    cnic: yup.string().optional(),
    phone: yup.string().optional(),
    occupation: yup.string().optional(),
  }),
  guardian: yup.object().shape({
    name: yup.string().optional(),
    relation: yup.string().optional(),
    phone: yup.string().optional(),
    cnic: yup.string().optional(),
  }),
  emergencyContact: yup.object().shape({
    name: yup.string().required('Emergency contact name is required'),
    phone: yup.string().required('Emergency contact phone is required'),
    relation: yup.string().required('Emergency contact relation is required'),
  }),
  address: yup.object().shape({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    postalCode: yup.string().optional(),
    country: yup.string().optional(),
  }),
  previousSchool: yup.object().shape({
    name: yup.string().optional(),
    lastClass: yup.string().optional(),
    reasonForLeaving: yup.string().optional(),
  }),
  parent: yup.object().shape({
    enabled: yup.boolean(),
    relation: yup.string().when('enabled', {
      is: true,
      then: (s) => s.oneOf(GUARDIAN_RELATIONS, 'Select a relation').required('Select a relation'),
    }),
    name: yup.string().when('enabled', {
      is: true,
      then: (s) => s.trim().required('Name is required'),
    }),
    email: yup.string().when('enabled', {
      is: true,
      then: (s) => s.trim().email('Invalid email').required('Email is required'),
    }),
    phone: yup.string().optional(),
    password: yup.string().when('enabled', {
      is: true,
      then: (s) =>
        s
          .min(PARENT_PASSWORD_MIN, `Password must be at least ${PARENT_PASSWORD_MIN} characters`)
          .required(`Password must be at least ${PARENT_PASSWORD_MIN} characters`),
    }),
    confirmPassword: yup.string().when('enabled', {
      is: true,
      then: (s) =>
        s.oneOf([yup.ref('password')], 'Passwords do not match').required('Confirm the password'),
    }),
  }),
  voucher: yup.object().shape({
    enabled: yup.boolean(),
    month: yup.string().when('enabled', {
      is: true,
      then: (s) => s.matches(/^\d{4}-\d{2}$/, 'Pick a month').required('Pick a month'),
    }),
  }),
});

function Section({ title, children, cols = 'sm:grid-cols-2' }) {
  return (
    <div>
      <h3 className={sectionHeadingCls}>{title}</h3>
      <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
        {label}
      </div>
      <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
        {value || '—'}
      </div>
    </div>
  );
}

export default function AdmitModal({ enquiry, perms, onClose }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const branchId = String(enquiry.branchId?._id || enquiry.branchId || '');
  const [allowDifferentGrade, setAllowDifferentGrade] = useState(false);
  const [result, setResult] = useState(null); // admit response data
  const [voucher, setVoucher] = useState(null); // { state: 'pending'|'created'|'skipped'|'failed', message }

  const parentDefaults = parentPrefillFromEnquiry(enquiry);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...admitPrefill(enquiry, { today: localYMD(), academicYear: currentAcademicYear() }),
      parent: { enabled: false, ...parentDefaults, password: '', confirmPassword: '' },
      voucher: { enabled: false, month: localYM() },
    },
  });

  const academicYear = watch('academicYear');
  const classId = watch('classId');
  const admissionType = watch('admissionType');
  const parentEnabled = watch('parent.enabled');
  const voucherEnabled = watch('voucher.enabled');

  const { data: classData, isFetching: classesLoading } = useQuery({
    queryKey: ['classes-dropdown', branchId, academicYear],
    queryFn: () =>
      fetchData({ url: '/class/list', page: 1, limit: 200, token, branchId, academicYear }),
    enabled: !!token && !!branchId && /^\d{4}-\d{4}$/.test(academicYear || ''),
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  // The voucher month must fall in the admitted year: an admission in March for
  // the session starting in April bills April (the API refuses March).
  const voucherBounds = academicYearMonthBounds(academicYear, academicYearStartMonth());
  useEffect(() => {
    setValue(
      'voucher.month',
      defaultVoucherMonth(academicYear, academicYearStartMonth(), localYM()),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear]);

  // Auto-pick the class of the desired grade whenever the year's classes load;
  // drop a picked class that is not in the chosen year.
  useEffect(() => {
    if (!classData) return;
    const current = getValues('classId');
    if (current && classes.some((c) => c._id === current)) return;
    const match = classForGrade(classes, enquiry.desiredGrade);
    setValue('classId', match?._id || '');
    setValue('sectionId', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData]);

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 30000,
  });
  const sections = sectionData?.data || [];

  const differentGrade = isDifferentGrade(classes, classId, enquiry.desiredGrade);
  const noClassForGrade =
    !!classData && !classesLoading && !classForGrade(classes, enquiry.desiredGrade);

  const voucherMutation = useMutation({
    mutationFn: (payload) => postDataWithStatus({ url: '/fee/voucher/generate-student', payload }),
  });

  const admit = useMutation({
    mutationFn: (payload) =>
      postData({ url: `/admission/enquiries/${enquiry._id}/admit`, payload, token }),
    onError: (err) => toast.error(err.message || 'Admission failed — nothing was saved'),
  });

  const runVoucher = (studentId, month) => {
    setVoucher({ state: 'pending' });
    voucherMutation.mutate(
      { studentId, month },
      {
        onSuccess: ({ status, body }) => {
          const o = voucherOutcome(status, body);
          setVoucher({
            state: o.kind,
            message: o.voucherNumber ? `${o.message} (${o.voucherNumber})` : o.message,
          });
          invalidateFeeQueries(queryClient);
        },
        onError: (err) =>
          setVoucher({ state: 'failed', message: err.message || 'Voucher generation failed' }),
      },
    );
  };

  const onSubmit = (values) => {
    if (differentGrade && !allowDifferentGrade) {
      toast.error(`Confirm admitting into a class other than ${gradeLabel(enquiry.desiredGrade)}`);
      return;
    }
    const payload = buildAdmitPayload(values, {
      allowDifferentGrade: differentGrade && allowDifferentGrade,
      parent: values.parent?.enabled ? values.parent : null,
    });
    admit.mutate(payload, {
      onSuccess: (res) => {
        invalidateAdmissionData(queryClient, { students: true });
        toast.success(res?.message || 'Student admitted');
        const data = res?.data || {};
        setResult({ ...data, warnings: warningsOf(res) });
        const studentId = data.student?._id;
        if (values.voucher?.enabled && studentId) runVoucher(studentId, values.voucher.month);
      },
    });
  };

  const years = Array.from(new Set([...yearOptions(), enquiry.academicYear].filter(Boolean)));

  const footer = result ? (
    <div className="flex gap-3 w-full justify-end">
      <Button label="Done" handleClick={onClose} styleObject={modalPrimary} />
    </div>
  ) : (
    <div className="flex gap-3 w-full justify-end">
      <Button label="Cancel" handleClick={onClose} styleObject={modalSecondary} />
      <Button
        label="Admit student"
        loading={admit.isPending}
        handleClick={handleSubmit(onSubmit)}
        styleObject={modalPrimary}
      />
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={result ? 'Student admitted' : `Admit ${enquiry.child?.name || ''}`}
      subtitle={
        result
          ? undefined
          : `${enquiry.enquiryNumber || ''} · applying for ${gradeLabel(enquiry.desiredGrade)}`
      }
      size="xl"
      footer={footer}
    >
      {result ? (
        <AdmitResult result={result} voucher={voucher} />
      ) : (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <Section title="Enrollment">
            <Field label="Academic year" required error={errors.academicYear?.message}>
              <select {...register('academicYear')} className={inputCls}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Admission date" required error={errors.admissionDate?.message}>
              <input type="date" {...register('admissionDate')} className={inputCls} />
            </Field>
            <Field label="Class" required error={errors.classId?.message}>
              <select
                {...register('classId', {
                  onChange: () => {
                    setValue('sectionId', '');
                    setAllowDifferentGrade(false);
                  },
                })}
                className={inputCls}
              >
                <option value="">{classesLoading ? 'Loading…' : 'Select class...'}</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.grade ? `(${gradeLabel(c.grade)})` : ''}
                  </option>
                ))}
              </select>
              {noClassForGrade && (
                <p className="text-xs text-amber-600 mt-1">
                  No {gradeLabel(enquiry.desiredGrade)} class in {academicYear}.
                </p>
              )}
            </Field>
            <Field label="Section" required error={errors.sectionId?.message}>
              <select {...register('sectionId')} disabled={!classId} className={inputCls}>
                <option value="">{classId ? 'Select section...' : 'Select class first'}</option>
                {sections.map((s) => {
                  const full = sectionFull(s);
                  return (
                    <option key={s._id} value={s._id} disabled={full}>
                      {s.name} ({s.currentStrength ?? 0}/{s.capacity ?? '—'}){full ? ' — FULL' : ''}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Admission type" error={errors.admissionType?.message}>
              <select {...register('admissionType')} className={inputCls}>
                <option value="new">New</option>
                <option value="transfer">Transfer</option>
              </select>
            </Field>
            {differentGrade && (
              <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <label className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={allowDifferentGrade}
                    onChange={(e) => setAllowDifferentGrade(e.target.checked)}
                  />
                  <span>
                    This class is not {gradeLabel(enquiry.desiredGrade)}, the grade applied for.
                    Admit into it anyway.
                  </span>
                </label>
              </div>
            )}
          </Section>

          <Section title="Student account">
            <Field label="Full name" required error={errors.name?.message}>
              <input {...register('name')} className={inputCls} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                placeholder="student@example.com"
                className={inputCls}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="+923001234567" className={inputCls} />
            </Field>
          </Section>

          <Section title="Personal">
            <Field label="Date of birth" required error={errors.dob?.message}>
              <input type="date" {...register('dob')} className={inputCls} />
            </Field>
            <Field label="Gender" required error={errors.gender?.message}>
              <select {...register('gender')} className={inputCls}>
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood group">
              <select {...register('bloodGroup')} className={inputCls}>
                <option value="">Select...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nationality">
              <input {...register('nationality')} className={inputCls} />
            </Field>
            <Field label="Religion">
              <input {...register('religion')} className={inputCls} />
            </Field>
            <Field label="B-Form">
              <input {...register('bForm')} placeholder="12345-1234567-1" className={inputCls} />
            </Field>
            <Field label="Place of birth">
              <input {...register('placeOfBirth')} className={inputCls} />
            </Field>
          </Section>

          <Section title="Father">
            <Field label="Name" required error={errors.father?.name?.message}>
              <input {...register('father.name')} className={inputCls} />
            </Field>
            <Field label="CNIC">
              <input {...register('father.cnic')} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('father.phone')} className={inputCls} />
            </Field>
            <Field label="WhatsApp notification number" error={errors.whatsappNumber?.message}>
              <input
                {...register('whatsappNumber')}
                placeholder="923001234567"
                inputMode="numeric"
                className={inputCls}
              />
            </Field>
            <Field label="Email" error={errors.father?.email?.message}>
              <input type="email" {...register('father.email')} className={inputCls} />
            </Field>
            <Field label="Occupation">
              <input {...register('father.occupation')} className={inputCls} />
            </Field>
          </Section>

          <Section title="Mother">
            <Field label="Name" required error={errors.mother?.name?.message}>
              <input {...register('mother.name')} className={inputCls} />
            </Field>
            <Field label="CNIC">
              <input {...register('mother.cnic')} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('mother.phone')} className={inputCls} />
            </Field>
            <Field label="Occupation">
              <input {...register('mother.occupation')} className={inputCls} />
            </Field>
          </Section>

          <Section title="Guardian (optional)">
            <Field label="Name">
              <input {...register('guardian.name')} className={inputCls} />
            </Field>
            <Field label="Relation">
              <input {...register('guardian.relation')} placeholder="Uncle" className={inputCls} />
            </Field>
            <Field label="Phone">
              <input {...register('guardian.phone')} className={inputCls} />
            </Field>
            <Field label="CNIC">
              <input {...register('guardian.cnic')} className={inputCls} />
            </Field>
          </Section>

          <Section title="Emergency contact" cols="sm:grid-cols-3">
            <Field label="Name" required error={errors.emergencyContact?.name?.message}>
              <input {...register('emergencyContact.name')} className={inputCls} />
            </Field>
            <Field label="Phone" required error={errors.emergencyContact?.phone?.message}>
              <input {...register('emergencyContact.phone')} className={inputCls} />
            </Field>
            <Field label="Relation" required error={errors.emergencyContact?.relation?.message}>
              <input {...register('emergencyContact.relation')} className={inputCls} />
            </Field>
          </Section>

          <Section title="Address">
            <Field label="Street" className="sm:col-span-2">
              <input {...register('address.street')} className={inputCls} />
            </Field>
            <Field label="City">
              <input {...register('address.city')} className={inputCls} />
            </Field>
            <Field label="State / Province">
              <input {...register('address.state')} className={inputCls} />
            </Field>
            <Field label="Postal code">
              <input {...register('address.postalCode')} className={inputCls} />
            </Field>
            <Field label="Country">
              <input {...register('address.country')} className={inputCls} />
            </Field>
          </Section>

          {admissionType === 'transfer' && (
            <Section title="Previous school">
              <Field label="School name">
                <input {...register('previousSchool.name')} className={inputCls} />
              </Field>
              <Field label="Last class">
                <input {...register('previousSchool.lastClass')} className={inputCls} />
              </Field>
              <Field label="Reason for leaving" className="sm:col-span-2">
                <input {...register('previousSchool.reasonForLeaving')} className={inputCls} />
              </Field>
            </Section>
          )}

          {perms?.canCreateParent && (
            <div>
              <ToggleRow
                title="Create parent portal account"
                hint="Creates the parent login and links this child. An existing parent with the same email in your school is linked instead."
                checked={!!parentEnabled}
                onChange={(v) => setValue('parent.enabled', v)}
              />
              {parentEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Relation" required error={errors.parent?.relation?.message}>
                    <select {...register('parent.relation')} className={inputCls}>
                      {GUARDIAN_RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Name" required error={errors.parent?.name?.message}>
                    <input {...register('parent.name')} className={inputCls} />
                  </Field>
                  <Field label="Email" required error={errors.parent?.email?.message}>
                    <input type="email" {...register('parent.email')} className={inputCls} />
                  </Field>
                  <Field label="Phone">
                    <input {...register('parent.phone')} className={inputCls} />
                  </Field>
                  <Field label="Password" required error={errors.parent?.password?.message}>
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('parent.password')}
                      placeholder={`Min ${PARENT_PASSWORD_MIN} characters`}
                      className={inputCls}
                    />
                  </Field>
                  <Field
                    label="Confirm password"
                    required
                    error={errors.parent?.confirmPassword?.message}
                  >
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('parent.confirmPassword')}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {perms?.canGenerateVoucher && (
            <div>
              <ToggleRow
                title="Generate first fee voucher"
                hint="Runs after the admission succeeds, using the class's active fee structure. If it fails the admission still stands — generate it later from Fees."
                checked={!!voucherEnabled}
                onChange={(v) => setValue('voucher.enabled', v)}
              />
              {voucherEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Month" required error={errors.voucher?.month?.message}>
                    <input
                      type="month"
                      min={voucherBounds?.first}
                      max={voucherBounds?.last}
                      {...register('voucher.month')}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}

function ToggleRow({ title, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function AdmitResult({ result, voucher }) {
  const s = result.student || {};
  const p = result.parent;
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900">
        <h3 className="text-lg font-bold text-green-900 dark:text-green-200">Admission complete</h3>
        <p className="text-sm text-green-800 dark:text-green-300 mt-1">
          {s.name || 'The student'} has been enrolled and the enquiry is marked admitted.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatTile label="Admission number" value={s.admissionNumber} />
        <StatTile label="Roll number" value={s.rollNumber} />
        <StatTile label="Academic year" value={s.academicYear} />
      </div>

      {p && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/40 text-sm text-teal-800 dark:text-teal-300">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            {p.linkedExisting
              ? `Linked to the existing parent account ${p.email || ''} (its password was not changed).`
              : `Parent portal account created for ${p.email || ''}.`}
          </span>
        </div>
      )}

      {result.warnings?.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <ul className="space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {voucher && (
        <div>
          <h3 className={sectionHeadingCls}>First fee voucher</h3>
          {voucher.state === 'pending' && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating voucher…
            </div>
          )}
          {voucher.state === 'created' && (
            <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {voucher.message}
            </div>
          )}
          {voucher.state === 'skipped' && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {voucher.message}
            </div>
          )}
          {voucher.state === 'failed' && (
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Voucher not generated: {voucher.message}. The admission itself succeeded — you can
                generate the voucher later from Fees.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
