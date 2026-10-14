'use client';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MessageSquarePlus,
  CalendarClock,
  ClipboardCheck,
  Pencil,
  XCircle,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { localYMD } from '@/utils/localDate';
import { useTokenStore } from '@/store/tokenStore';
import {
  admissionPermissions,
  canManageEnquiry,
  closeReasonLabel,
  enquiryActions,
  enquiryTimeline,
  followUpState,
  gradeLabel,
  sourceLabel,
} from '@/utils/admission';
import {
  StatusBadge,
  Spinner,
  fmtDate,
  fmtDateTime,
  invalidateAdmissionData,
  primaryBtn,
  secondaryBtn,
} from './admissionShared';
import ConfirmModal from './ConfirmModal';
import EnquiryActionModal from './EnquiryActionModal';
import EnquiryFormModal from './EnquiryFormModal';
import AdmitModal from './AdmitModal';

const Row = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
    <div className="sm:w-40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex-shrink-0">
      {label}
    </div>
    <div className="text-sm text-gray-900 dark:text-gray-100 break-words">{children || '—'}</div>
  </div>
);

const ACTION_META = {
  'follow-up': { label: 'Add follow-up', icon: MessageSquarePlus },
  'schedule-test': { label: 'Schedule test', icon: CalendarClock },
  'record-result': { label: 'Record result', icon: ClipboardCheck },
  edit: { label: 'Edit', icon: Pencil },
  close: { label: 'Close', icon: XCircle },
  reopen: { label: 'Reopen', icon: RotateCcw },
  admit: { label: 'Admit', icon: UserPlus, primary: true },
};

const DOT = {
  created: 'bg-blue-500',
  'follow-up': 'bg-amber-500',
  'test-scheduled': 'bg-purple-500',
  'test-result': 'bg-indigo-500',
  closed: 'bg-gray-500',
  admitted: 'bg-green-500',
};

export default function EnquiryDetailModal({ enquiryId, role, userBranchId, onClose, onWarnings }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admission-enquiry', enquiryId],
    queryFn: () => fetchData({ url: `/admission/enquiries/${enquiryId}`, token }),
    enabled: !!token && !!enquiryId,
    retry: retryUnless4xx,
  });
  const e = data?.data;

  const perms = admissionPermissions(role);
  const canManage = !!e && canManageEnquiry(role, userBranchId, e);
  const actions = enquiryActions(e, { canManage, canAdmit: perms.canCreateStudent });

  const reopen = useMutation({
    mutationFn: () => patchData({ url: `/admission/enquiries/${enquiryId}/reopen`, token }),
    onSuccess: (res) => {
      invalidateAdmissionData(queryClient);
      toast.success(res?.message || 'Enquiry reopened');
      setAction(null);
    },
    onError: (err) => toast.error(err.message || 'Could not reopen'),
  });

  const timeline = enquiryTimeline(e);
  const due = followUpState(e, localYMD());

  const handleClose = () => {
    setAction(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={!!enquiryId}
        onClose={handleClose}
        title={e ? `${e.enquiryNumber || 'Enquiry'} — ${e.child?.name || ''}` : 'Enquiry'}
        size="lg"
      >
        {isLoading && <Spinner />}
        {error && <QueryErrorState error={error} fallback="Could not load this enquiry" />}
        {e && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={e.status} />
              {due === 'overdue' && (
                <span className="text-xs font-semibold text-red-600">Follow-up overdue</span>
              )}
              {due === 'today' && (
                <span className="text-xs font-semibold text-amber-600">Follow-up due today</span>
              )}
            </div>

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => {
                  const meta = ACTION_META[a];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAction(a)}
                      className={meta.primary ? primaryBtn : secondaryBtn}
                    >
                      <Icon className="w-4 h-4" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            )}

            {e.status === 'admitted' && (
              <div className="p-3 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 text-sm text-green-800 dark:text-green-300">
                Admitted on {fmtDate(e.admittedAt)}
                {e.admittedStudentName || e.admittedStudent?.name
                  ? ` as ${e.admittedStudentName || e.admittedStudent?.name}`
                  : ''}
                {e.admittedStudent?.admissionNumber
                  ? ` (${e.admittedStudent.admissionNumber})`
                  : ''}
                .
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Child
                </h3>
                <Row label="Name">{e.child?.name}</Row>
                <Row label="Gender">
                  <span className="capitalize">{e.child?.gender}</span>
                </Row>
                <Row label="Date of birth">{e.child?.dob ? fmtDate(e.child.dob) : ''}</Row>
                <Row label="Previous school">
                  {[e.child?.previousSchool, e.child?.previousClass].filter(Boolean).join(' · ')}
                </Row>
                <Row label="Desired grade">{gradeLabel(e.desiredGrade)}</Row>
                <Row label="Academic year">{e.academicYear}</Row>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Guardian
                </h3>
                <Row label="Name">
                  {e.guardian?.name}
                  {e.guardian?.relation && (
                    <span className="text-gray-500 capitalize"> ({e.guardian.relation})</span>
                  )}
                </Row>
                <Row label="Phone">{e.guardian?.phone}</Row>
                <Row label="Email">{e.guardian?.email}</Row>
                <Row label="CNIC">{e.guardian?.cnic}</Row>
                <Row label="Occupation">{e.guardian?.occupation}</Row>
                <Row label="Address">{e.address}</Row>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Enquiry
              </h3>
              <Row label="Source">{sourceLabel(e.source)}</Row>
              {(e.branchName || e.branchId?.name) && (
                <Row label="Branch">{e.branchName || e.branchId?.name}</Row>
              )}
              <Row label="Assigned to">{e.assignedToName || e.assignedTo?.name}</Row>
              <Row label="Next follow-up">
                {e.nextFollowUpDate ? fmtDate(e.nextFollowUpDate) : ''}
              </Row>
              {e.test?.scheduledAt && (
                <Row label="Test / interview">
                  {fmtDateTime(e.test.scheduledAt)}
                  {e.test.venue ? ` — ${e.test.venue}` : ''}
                  {e.test.result && (
                    <span className="block capitalize">
                      Result: {e.test.result}
                      {e.test.marks !== undefined && e.test.marks !== null
                        ? ` · ${e.test.marks} marks`
                        : ''}
                      {e.test.remarks ? ` — ${e.test.remarks}` : ''}
                    </span>
                  )}
                </Row>
              )}
              {e.status === 'closed' && (
                <Row label="Closed">
                  {closeReasonLabel(e.closedReason)}
                  {e.closedNote ? ` — ${e.closedNote}` : ''}
                </Row>
              )}
              <Row label="Notes">
                <span className="whitespace-pre-wrap">{e.notes}</span>
              </Row>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Timeline
              </h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet.</p>
              ) : (
                <ol className="relative border-s border-gray-200 dark:border-gray-700 ms-2 space-y-4">
                  {timeline.map((item, i) => (
                    <li key={i} className="ms-4">
                      <span
                        className={`absolute -start-1.5 mt-1.5 w-3 h-3 rounded-full ${DOT[item.kind] || 'bg-gray-400'}`}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {fmtDateTime(item.at)}
                        {item.by ? ` · ${item.by}` : ''}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.title}
                      </div>
                      {item.text && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {item.text}
                        </p>
                      )}
                      {item.next && (
                        <p className="text-xs text-gray-500">
                          Next follow-up: {fmtDate(item.next)}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>

      {e && ['follow-up', 'schedule-test', 'record-result', 'close'].includes(action) && (
        <EnquiryActionModal mode={action} enquiry={e} onClose={() => setAction(null)} />
      )}
      {e && action === 'edit' && (
        <EnquiryFormModal
          enquiry={e}
          userBranchId={userBranchId}
          onClose={() => setAction(null)}
          onSaved={(_, w) => w.length && onWarnings?.(w)}
        />
      )}
      {e && action === 'admit' && (
        <AdmitModal enquiry={e} perms={perms} onClose={() => setAction(null)} />
      )}
      <ConfirmModal
        isOpen={action === 'reopen'}
        onClose={() => setAction(null)}
        title="Reopen enquiry?"
        message="The enquiry goes back to follow-up so the team can work it again."
        confirmLabel="Reopen"
        loading={reopen.isPending}
        onConfirm={() => reopen.mutate()}
      />
    </>
  );
}
