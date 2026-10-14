"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarOff,
  Plus,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useLeaveRequests,
  useApplyLeave,
  useCancelLeave,
  leaveErrorMessage,
} from "@/hooks/useLeave";
import { useSelectedChild, useSelectedChildId } from "@/hooks/useChildren";
import { PageHeader, Panel } from "@/component/dashboard/Panel";
import { Loading, ErrorState, EmptyState } from "@/component/dashboard/States";
import { formatDate } from "@/utils/format";
import {
  STUDENT_LEAVE_TYPES,
  MAX_LEAVE_SPAN_DAYS,
  REASON_MAX,
  localYMD,
  addDaysYMD,
  isValidYMD,
  validateLeaveForm,
  canParentCancel,
} from "@/utils/leave";

const LIMIT = 20;

const STATUS_STYLES = {
  pending: "bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]",
  approved:
    "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const TYPE_LABELS = { sick: "Sick", casual: "Casual", other: "Other" };

const REQUESTED_BY_LABELS = { parent: "Parent", staff: "School staff" };

// Leave dates are date-only values stored as UTC midnight: format in UTC so
// they name the same calendar day everywhere.
const fmtDay = (v) =>
  formatDate(v, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const inputCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00918e]/40";

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] || STATUS_STYLES.cancelled
      }`}
    >
      {status || "—"}
    </span>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const emptyForm = () => ({
  leaveType: "sick",
  fromDate: localYMD(),
  toDate: localYMD(),
  reason: "",
});

function ApplyLeaveForm({ childName, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const apply = useApplyLeave();

  const errors = validateLeaveForm(form);
  const shown = submitted ? errors : {};

  const set = (field) => (e) => {
    const value = e.target.value;
    setServerError("");
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Moving the start past the end drags the end along.
      if (
        field === "fromDate" &&
        isValidYMD(value) &&
        isValidYMD(f.toDate) &&
        f.toDate < value
      ) {
        next.toDate = value;
      }
      return next;
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (Object.keys(errors).length > 0) return;
    apply.mutate(
      {
        leaveType: form.leaveType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Leave request sent to the school");
          onClose();
        },
        onError: (err) =>
          setServerError(
            leaveErrorMessage(err, "Could not submit the leave request."),
          ),
      },
    );
  };

  const maxTo = isValidYMD(form.fromDate)
    ? addDaysYMD(form.fromDate, MAX_LEAVE_SPAN_DAYS - 1)
    : undefined;

  return (
    <Panel
      title={`Apply for leave${childName ? ` · ${childName}` : ""}`}
      action={
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Leave type
            </label>
            <select
              value={form.leaveType}
              onChange={set("leaveType")}
              className={inputCls}
            >
              {STUDENT_LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <FieldError message={shown.leaveType} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={form.fromDate}
              onChange={set("fromDate")}
              className={inputCls}
            />
            <FieldError message={shown.fromDate} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={form.toDate}
              min={isValidYMD(form.fromDate) ? form.fromDate : undefined}
              max={maxTo}
              onChange={set("toDate")}
              className={inputCls}
            />
            <FieldError message={shown.toDate} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Reason
          </label>
          <textarea
            rows={3}
            maxLength={REASON_MAX}
            value={form.reason}
            onChange={set("reason")}
            placeholder="e.g. Fever, doctor advised rest"
            className={`${inputCls} resize-y`}
          />
          <div className="flex items-start justify-between gap-2">
            <FieldError message={shown.reason} />
            <span className="ml-auto mt-1 text-xs text-gray-400">
              {form.reason.trim().length}/{REASON_MAX}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Only school working days are counted. The school will approve or
          reject the request.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={apply.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#00918e] px-4 py-2 text-sm font-medium text-white hover:bg-[#00736f] disabled:opacity-60 transition-colors"
          >
            {apply.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit request
          </button>
        </div>
      </form>
    </Panel>
  );
}

function LeaveRow({ r, onCancel, cancelling }) {
  const sameDay =
    r.fromDate && r.toDate && fmtDay(r.fromDate) === fmtDay(r.toDate);
  const role = r.requestedBy?.role;
  return (
    <Panel>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {TYPE_LABELS[r.leaveType] || r.leaveType} leave
            </h3>
            <StatusBadge status={r.status} />
            {r.days != null && (
              <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {r.days} day{r.days === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {sameDay
              ? fmtDay(r.fromDate)
              : `${fmtDay(r.fromDate)} – ${fmtDay(r.toDate)}`}
          </p>
          {r.reason && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {r.reason}
            </p>
          )}
          {r.decisionNote && (
            <p className="mt-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-gray-600 dark:text-gray-300">
              <span className="font-medium">School note: </span>
              {r.decisionNote}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-gray-400">
            <span>
              Requested by {REQUESTED_BY_LABELS[role] || role || "—"}
              {r.createdAt ? ` · ${formatDate(r.createdAt)}` : ""}
            </span>
            {r.decidedAt && (
              <span>
                {r.status === "rejected" ? "Rejected" : "Decided"}{" "}
                {formatDate(r.decidedAt)}
              </span>
            )}
            {r.cancelledAt && (
              <span>Cancelled {formatDate(r.cancelledAt)}</span>
            )}
          </div>
        </div>
        {canParentCancel(r) && (
          <button
            onClick={() => onCancel(r)}
            disabled={cancelling}
            className="self-start flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
          >
            {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Cancel request
          </button>
        )}
      </div>
    </Panel>
  );
}

// Keyed by the child id: switching child resets the page and closes the form.
function ChildLeave({ childName }) {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useLeaveRequests({ page, limit: LIMIT });
  const cancel = useCancelLeave();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const onCancel = (r) => {
    if (
      !window.confirm(
        `Cancel this ${TYPE_LABELS[r.leaveType]?.toLowerCase() || ""} leave request (${fmtDay(r.fromDate)}${
          r.toDate && fmtDay(r.toDate) !== fmtDay(r.fromDate)
            ? ` – ${fmtDay(r.toDate)}`
            : ""
        })?`,
      )
    ) {
      return;
    }
    cancel.mutate(r._id, {
      onSuccess: () => toast.success("Leave request cancelled"),
      onError: (err) =>
        toast.error(
          leaveErrorMessage(err, "Could not cancel the leave request."),
        ),
    });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={CalendarOff}
        title="Leave"
        subtitle={
          childName ? `Leave requests for ${childName}` : "Leave requests"
        }
        action={
          !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#00918e] px-4 py-2 text-sm font-medium text-white hover:bg-[#00736f] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Apply for leave
            </button>
          )
        }
      />

      {showForm && (
        <div className="mb-4">
          <ApplyLeaveForm
            childName={childName}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading ? (
        <Loading label="Loading leave requests…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No leave requests"
          description="Leave you apply for, or that the school records, will show up here."
          icon={CalendarOff}
        />
      ) : (
        <>
          <div
            className={`space-y-3 ${isFetching ? "opacity-60 transition-opacity" : ""}`}
          >
            {items.map((r, i) => (
              <LeaveRow
                key={r._id || i}
                r={r}
                onCancel={onCancel}
                cancelling={cancel.isPending && cancel.variables === r._id}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <button
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LeavePage() {
  const studentId = useSelectedChildId();
  const child = useSelectedChild();
  return <ChildLeave key={studentId || "none"} childName={child?.name} />;
}
