'use client';
import React from 'react';
import { School, Phone, Mail, MapPin, Globe, Pin } from 'lucide-react';
import { formatDate, formatMonth, formatMoney } from '@/constants/fee';

const ATT_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-800',
  leave: 'bg-blue-100 text-blue-700',
  'half-day': 'bg-purple-100 text-purple-700',
  holiday: 'bg-gray-100 text-gray-600',
};

const HW_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  late: 'bg-amber-100 text-amber-800',
  graded: 'bg-green-100 text-green-700',
};

const FEE_COLORS = {
  unpaid: 'bg-gray-100 text-gray-700',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const TRANSPORT_COLORS = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600',
};

const DAYS = [
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sunday'],
];

// Address may arrive as a plain string or as an object ({ line1, city, country, ... }).
function formatAddress(addr) {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    return Object.values(addr)
      .filter((v) => typeof v === 'string' && v.trim())
      .join(', ');
  }
  return '';
}

// ── Shared little building blocks ───────────────────────────────────────────
function Pill({ children, className = 'bg-gray-100 text-gray-700' }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}
    >
      {children}
    </span>
  );
}

function Info({ label, value }) {
  const safe = value && typeof value === 'object' ? formatAddress(value) || '—' : value || '—';
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium break-words">{safe}</div>
    </div>
  );
}

function Stat({ label, value, tone = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-3 py-2 text-center">
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-1.5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">
          {title}
        </h3>
        {hint != null && <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function TableShell({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const Th = ({ children, right }) => (
  <th className={`px-3 py-2 ${right ? 'text-right' : 'text-left'} font-semibold`}>{children}</th>
);
const Td = ({ children, right, className = '' }) => (
  <td
    className={`px-3 py-2 ${right ? 'text-right' : 'text-left'} text-gray-700 dark:text-gray-300 ${className}`}
  >
    {children}
  </td>
);
const Row = ({ children }) => (
  <tr className="border-t border-gray-100 dark:border-gray-800">{children}</tr>
);

// ── Header ──────────────────────────────────────────────────────────────────
function Letterhead({ profile, branchName }) {
  const displayName = profile?.displayName || branchName || 'School';
  const { tagline, printAddress, printPhone, printEmail, website, registrationNumber, logo } =
    profile || {};
  return (
    <div className="flex items-start gap-4 pb-5 mb-5 border-b-2 border-gray-900">
      <div className="shrink-0">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={displayName}
            className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <School className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight truncate">
          {displayName}
        </h2>
        {tagline && (
          <div className="text-xs text-gray-600 dark:text-gray-400 italic mt-0.5">{tagline}</div>
        )}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
          {printAddress && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-words">{printAddress}</span>
            </div>
          )}
          {printPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span>{printPhone}</span>
            </div>
          )}
          {printEmail && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-all">{printEmail}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="break-all">{website}</span>
            </div>
          )}
        </div>
        {registrationNumber && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Reg #: {registrationNumber}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Progress Report
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Student</div>
      </div>
    </div>
  );
}

function StudentHeader({ student, dateRange }) {
  const s = student || {};
  const classLine = [s.className, s.sectionName].filter(Boolean).join(' · ');
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-5 mb-2">
      <div className="flex items-start gap-4">
        {s.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt={s.name}
            className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-xl font-bold text-teal-700 dark:text-teal-300">
            {(s.name || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.name || '—'}</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {classLine || '—'}
            {s.academicYear ? ` · ${s.academicYear}` : ''}
          </div>
          {dateRange && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reporting period: {formatDate(dateRange.from)} – {formatDate(dateRange.to)}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
        <Info label="Admission #" value={s.admissionNumber} />
        <Info label="Roll #" value={s.rollNumber} />
        <Info label="Status" value={s.academicStatus} />
        <Info label="Gender" value={s.gender} />
        <Info label="Date of Birth" value={s.dob ? formatDate(s.dob) : '—'} />
        <Info label="Blood Group" value={s.bloodGroup} />
        <Info label="Phone" value={s.phone} />
        <Info label="Email" value={s.email} />
        <Info label="Father" value={s.father?.name} />
        <Info label="Father Phone" value={s.father?.phone} />
        <Info
          label="Guardian"
          value={s.guardian?.name ? `${s.guardian.name} (${s.guardian.relation || '—'})` : '—'}
        />
        <Info
          label="Emergency Contact"
          value={
            s.emergencyContact?.name
              ? `${s.emergencyContact.name} · ${s.emergencyContact.phone || '—'}`
              : '—'
          }
        />
        <Info label="Address" value={formatAddress(s.address)} />
      </div>
    </div>
  );
}

// ── Module sections ─────────────────────────────────────────────────────────
function AttendanceSection({ data }) {
  const sm = data.summary || {};
  const records = data.records || [];
  return (
    <Section title="Attendance" hint={`${sm.presentPercentage ?? 0}% present`}>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        <Stat label="School Days" value={sm.schoolDays ?? 0} />
        <Stat label="Present" value={sm.present ?? 0} tone="text-green-600" />
        <Stat label="Absent" value={sm.absent ?? 0} tone="text-red-600" />
        <Stat label="Late" value={sm.late ?? 0} tone="text-amber-600" />
        <Stat label="Leave" value={sm.leave ?? 0} tone="text-blue-600" />
        <Stat label="Half-Day" value={sm.halfDay ?? 0} tone="text-purple-600" />
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No attendance records in range.</p>
      ) : (
        <TableShell
          head={
            <>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Arrival</Th>
              <Th>Reason / Notes</Th>
            </>
          }
        >
          {records.map((r) => (
            <Row key={r._id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>
                <Pill className={ATT_COLORS[r.status] || 'bg-gray-100 text-gray-700'}>
                  {r.status}
                </Pill>
              </Td>
              <Td>{r.arrivalTime || '—'}</Td>
              <Td>{r.reason || r.notes || '—'}</Td>
            </Row>
          ))}
        </TableShell>
      )}
    </Section>
  );
}

function ExamsSection({ data }) {
  const exams = data.exams || [];
  return (
    <Section title="Exams" hint={`${data.count ?? exams.length} exam(s)`}>
      {exams.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No exams in range.</p>
      ) : (
        <div className="space-y-4">
          {exams.map((ex) => {
            const exam = ex.exam || {};
            return (
              <div
                key={ex.examId}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {exam.name || 'Exam'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {exam.type || '—'}
                      {exam.startDate ? ` · ${formatDate(exam.startDate)}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {ex.overallPercentage ?? 0}%
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {ex.passedCount ?? 0}/{ex.subjectCount ?? 0} passed
                    </div>
                  </div>
                </div>
                <TableShell
                  head={
                    <>
                      <Th>Subject</Th>
                      <Th right>Theory</Th>
                      <Th right>Practical</Th>
                      <Th right>Total</Th>
                      <Th right>%</Th>
                      <Th>Grade</Th>
                      <Th>Remarks</Th>
                    </>
                  }
                >
                  {(ex.subjects || []).map((su, i) => (
                    <Row key={i}>
                      <Td className="font-medium text-gray-900 dark:text-gray-100">{su.subject}</Td>
                      <Td right>{su.isAbsent ? '—' : su.theoryObtained}</Td>
                      <Td right>{su.isAbsent ? '—' : su.practicalObtained}</Td>
                      <Td right>{su.isAbsent ? '—' : su.totalObtained}</Td>
                      <Td right>{su.isAbsent ? '—' : `${su.percentage}%`}</Td>
                      <Td>
                        {su.isAbsent ? (
                          <Pill className="bg-gray-100 text-gray-600">Absent</Pill>
                        ) : (
                          <Pill
                            className={
                              su.isPassed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {su.grade}
                          </Pill>
                        )}
                      </Td>
                      <Td>{su.remarks || '—'}</Td>
                    </Row>
                  ))}
                </TableShell>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function HomeworkSection({ data }) {
  const sm = data.summary || {};
  const records = data.records || [];
  return (
    <Section title="Homework" hint={`${sm.total ?? records.length} assigned`}>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
        <Stat label="Total" value={sm.total ?? 0} />
        <Stat label="Submitted" value={sm.submitted ?? 0} tone="text-blue-600" />
        <Stat label="Late" value={sm.late ?? 0} tone="text-amber-600" />
        <Stat label="Graded" value={sm.graded ?? 0} tone="text-green-600" />
        <Stat label="Pending" value={sm.pending ?? 0} tone="text-red-600" />
      </div>
      {records.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No homework in range.</p>
      ) : (
        <TableShell
          head={
            <>
              <Th>Title</Th>
              <Th>Subject</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th right>Marks</Th>
              <Th>Feedback</Th>
            </>
          }
        >
          {records.map((r) => (
            <Row key={r._id}>
              <Td className="font-medium text-gray-900 dark:text-gray-100">{r.title}</Td>
              <Td>{r.subject || '—'}</Td>
              <Td>{formatDate(r.dueDate)}</Td>
              <Td>
                <Pill className={HW_COLORS[r.submissionStatus] || 'bg-gray-100 text-gray-700'}>
                  {r.submissionStatus}
                </Pill>
              </Td>
              <Td right>
                {r.marksObtained != null ? `${r.marksObtained}/${r.maxMarks ?? '—'}` : '—'}
              </Td>
              <Td>{r.feedback || '—'}</Td>
            </Row>
          ))}
        </TableShell>
      )}
    </Section>
  );
}

function FeesSection({ data }) {
  const sm = data.summary || {};
  const vouchers = data.vouchers || [];
  return (
    <Section title="Fees">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Billed" value={formatMoney(sm.totalBilled)} />
        <Stat label="Paid" value={formatMoney(sm.totalPaid)} tone="text-green-600" />
        <Stat label="Outstanding" value={formatMoney(sm.outstanding)} tone="text-red-600" />
      </div>
      {vouchers.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No fee vouchers in range.</p>
      ) : (
        <TableShell
          head={
            <>
              <Th>Voucher #</Th>
              <Th>Month</Th>
              <Th>Due</Th>
              <Th right>Total</Th>
              <Th right>Paid</Th>
              <Th right>Balance</Th>
              <Th>Status</Th>
            </>
          }
        >
          {vouchers.map((v) => (
            <Row key={v._id}>
              <Td className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {v.voucherNumber}
              </Td>
              <Td>{formatMonth(v.month)}</Td>
              <Td>{formatDate(v.dueDate)}</Td>
              <Td right>{formatMoney(v.totalAmount)}</Td>
              <Td right className="text-green-700 dark:text-green-400">
                {formatMoney(v.paidAmount)}
              </Td>
              <Td right className="text-red-700 dark:text-red-400">
                {formatMoney(v.balanceAmount)}
              </Td>
              <Td>
                <Pill className={FEE_COLORS[v.status] || 'bg-gray-100 text-gray-700'}>
                  {v.status}
                </Pill>
              </Td>
            </Row>
          ))}
        </TableShell>
      )}
    </Section>
  );
}

function TransportSection({ data }) {
  const assignments = data.assignments || [];
  return (
    <Section title="Transport">
      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No transport assignments.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assignments.map((a) => (
            <div
              key={a._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{a.stopName}</div>
                <Pill className={TRANSPORT_COLORS[a.status] || 'bg-gray-100 text-gray-700'}>
                  {a.status}
                </Pill>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Route" value={a.routeId?.name} />
                <Info
                  label="Vehicle"
                  value={
                    a.vehicleId
                      ? `${a.vehicleId.registrationNumber || ''}${
                          a.vehicleId.model ? ` (${a.vehicleId.model})` : ''
                        }`
                      : '—'
                  }
                />
                <Info label="Direction" value={a.direction} />
                <Info label="Monthly Fee" value={formatMoney(a.monthlyFee)} />
                <Info label="Start" value={a.startDate ? formatDate(a.startDate) : '—'} />
                <Info label="End" value={a.endDate ? formatDate(a.endDate) : 'Active'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function TimetableSection({ data }) {
  const byDay = data.byDay || {};
  if (data.note || Object.keys(byDay).length === 0) {
    return (
      <Section title="Timetable">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.note || 'No timetable available.'}
        </p>
      </Section>
    );
  }
  return (
    <Section title="Timetable">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DAYS.map(([key, label]) => {
          const slots = byDay[key] || [];
          return (
            <div
              key={key}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                {label}
              </div>
              {slots.length === 0 ? (
                <div className="text-xs text-gray-400">—</div>
              ) : (
                <ul className="space-y-1.5">
                  {slots.map((sl) => (
                    <li key={sl._id} className="text-sm">
                      <span className="text-gray-400 mr-1">{sl.periodNumber}.</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {sl.subjectId?.name || sl.customLabel || sl.slotType}
                      </span>
                      {sl.room && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {' '}
                          · {sl.room}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function AnnouncementsSection({ data }) {
  const announcements = data.announcements || [];
  return (
    <Section title="Announcements" hint={`${data.count ?? announcements.length} item(s)`}>
      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No announcements in range.</p>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li
              key={a._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  {a.isPinned && <Pin className="w-3.5 h-3.5 text-teal-600" />}
                  {a.title}
                </div>
                <div className="flex items-center gap-1.5">
                  <Pill className="bg-gray-100 text-gray-600">{a.type}</Pill>
                  <Pill className={PRIORITY_COLORS[a.priority] || 'bg-gray-100 text-gray-600'}>
                    {a.priority}
                  </Pill>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{a.body}</p>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {a.publishedAt ? formatDate(a.publishedAt) : '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const SECTION_RENDERERS = {
  attendance: AttendanceSection,
  exams: ExamsSection,
  homework: HomeworkSection,
  fees: FeesSection,
  transport: TransportSection,
  timetable: TimetableSection,
  announcements: AnnouncementsSection,
};

const SECTION_ORDER = [
  'attendance',
  'exams',
  'homework',
  'fees',
  'transport',
  'timetable',
  'announcements',
];

// ── Document ────────────────────────────────────────────────────────────────
export default function ReportDocument({ data, profile, branchName, generatedAt }) {
  if (!data) return null;
  const report = data.report || {};
  const schoolName = profile?.displayName || branchName || 'School';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 print:shadow-none print:border-0 print:rounded-none">
      <Letterhead profile={profile} branchName={branchName} />
      <StudentHeader student={data.student} dateRange={data.dateRange} />

      {SECTION_ORDER.map((key) => {
        const moduleData = report[key];
        if (!moduleData) return null;
        const Renderer = SECTION_RENDERERS[key];
        return <Renderer key={key} data={moduleData} />;
      })}

      {/* On-screen + print footer. The PDF export stamps its own per-page footer. */}
      <div className="mt-8 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 print:fixed print:bottom-0 print:left-0 print:right-0 print:px-8 print:py-2 print:bg-white">
        <span>Generated {generatedAt}</span>
        <span>
          {schoolName} — Powered by{' '}
          <span className="font-semibold text-teal-700 dark:text-teal-400">nodeCampus.online</span>
        </span>
      </div>
    </div>
  );
}
