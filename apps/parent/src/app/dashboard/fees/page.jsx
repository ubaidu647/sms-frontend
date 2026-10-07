"use client";
import { useState } from "react";
import { Wallet, ChevronDown, Receipt } from "lucide-react";
import { useFees } from "@/hooks/useDashboard";
import { PageHeader, Panel } from "@/component/dashboard/Panel";
import { Loading, ErrorState, EmptyState } from "@/component/dashboard/States";
import { formatDate, formatMoney } from "@/utils/format";

const STATUS_STYLES = {
  paid: "bg-[#00918e]/10 text-[#00918e]",
  unpaid: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  partial: "bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]",
  overdue: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

export default function FeesPage() {
  const { data, isLoading, isError, error, refetch } = useFees();
  const outstanding = data?.summary?.outstandingBalance ?? 0;
  const vouchers = data?.vouchers ?? [];
  // The student endpoint's shape has no separate payments list; if the server
  // adds one, show it. Otherwise each voucher's paid amount is the record.
  const payments = Array.isArray(data?.payments) ? data.payments : [];

  return (
    <div className="max-w-4xl">
      <PageHeader
        icon={Wallet}
        title="Fees"
        subtitle="Your child’s vouchers, payments and outstanding balance"
      />

      {isLoading ? (
        <Loading label="Loading fees…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="rounded-2xl bg-[#00918e] text-white p-6 mb-4">
            <p className="text-sm opacity-90">Amount due</p>
            <p className="mt-1 text-3xl font-bold">
              {formatMoney(outstanding)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {outstanding > 0
                ? "Includes unpaid, partial and overdue vouchers"
                : "No outstanding balance"}
            </p>
          </div>

          {vouchers.length === 0 ? (
            <EmptyState
              title="No vouchers"
              description="Fee vouchers will appear here once issued."
              icon={Wallet}
            />
          ) : (
            <div className="space-y-3">
              {vouchers.map((v, i) => (
                <VoucherCard key={v._id || v.voucherNumber || i} voucher={v} />
              ))}
            </div>
          )}

          {payments.length > 0 && (
            <div className="mt-4">
              <Panel title="Payments" padded={false}>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payments.map((p, i) => (
                    <li
                      key={p._id || i}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <Receipt className="w-4 h-4 text-[#00918e] flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {p.receiptNumber
                            ? `Receipt #${p.receiptNumber}`
                            : p.voucherNumber
                              ? `Voucher #${p.voucherNumber}`
                              : "Payment"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {formatDate(p.paidAt || p.paymentDate || p.createdAt)}
                          {p.method || p.paymentMethod
                            ? ` · ${p.method || p.paymentMethod}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#00918e]">
                        {formatMoney(p.amount ?? p.paidAmount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            This is a read-only view. Please contact the school office for
            payments.
          </p>
        </>
      )}
    </div>
  );
}

function VoucherCard({ voucher: v }) {
  const [open, setOpen] = useState(false);
  const lineItems = v.lineItems || [];
  const status = v.status || "unpaid";

  return (
    <Panel padded={false}>
      <button
        onClick={() => lineItems.length && setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {v.month || v.voucherNumber || "Voucher"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                STATUS_STYLES[status] || STATUS_STYLES.unpaid
              }`}
            >
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {v.voucherNumber ? `#${v.voucherNumber}` : ""}
            {v.dueDate ? ` · Due ${formatDate(v.dueDate)}` : ""}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-gray-900 dark:text-gray-100">
            {formatMoney(v.balanceAmount ?? v.totalAmount)}
          </div>
          <div className="text-xs text-gray-400">
            of {formatMoney(v.totalAmount)}
          </div>
        </div>
        {lineItems.length > 0 && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && lineItems.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3">
          <ul className="space-y-2">
            {lineItems.map((li, i) => (
              <li key={li._id || i} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {li.name || li.label || "Item"}
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatMoney(li.finalAmount ?? li.amount)}
                </span>
              </li>
            ))}
            {v.lateFee > 0 && (
              <li className="flex justify-between text-sm text-red-500">
                <span>Late fee</span>
                <span>{formatMoney(v.lateFee)}</span>
              </li>
            )}
            <li className="flex justify-between text-sm font-semibold border-t border-gray-100 dark:border-gray-800 pt-2">
              <span className="text-gray-700 dark:text-gray-200">Paid</span>
              <span className="text-[#00918e]">
                {formatMoney(v.paidAmount)}
              </span>
            </li>
          </ul>
        </div>
      )}
    </Panel>
  );
}
