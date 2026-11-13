"use client";
import { Loader2, AlertCircle, Inbox, Info, PackageX } from "lucide-react";
import { seatRefusalMessage } from "@/utils/seatRefusal";
import {
  FEATURE_UNAVAILABLE_MESSAGE,
  isFeatureDisabledError,
} from "@/utils/planFeatures";

// Shared loading / error / empty blocks so every dashboard page behaves the
// same. Empty states are normal 200s (data: [] or zeroed summaries) — they are
// not errors.

export function Loading({ label = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#00918e]" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  if (isFeatureDisabledError(error)) return <FeatureUnavailableState />;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-100">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-[#00918e] px-4 py-2 text-sm font-medium text-white hover:bg-[#00736f] transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// The server's answer rather than a failure: calm, and nothing to retry.
export function NoticeState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Info className="w-8 h-8 text-[#00918e]" />
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-sm">
        {message}
      </p>
    </div>
  );
}

// For the routes refused to a child without a seat (see utils/seatRefusal).
export function SeatErrorState({ error, onRetry }) {
  if (isFeatureDisabledError(error)) return <FeatureUnavailableState />;
  const notice = seatRefusalMessage(error);
  if (notice) return <NoticeState message={notice} />;
  return <ErrorState error={error} onRetry={onRetry} />;
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}

// A page whose add-on module the school's plan does not include (reached by a
// direct link, or refused by the API with PLAN_FEATURE_DISABLED).
export function FeatureUnavailableState() {
  return (
    <EmptyState
      icon={PackageX}
      title={FEATURE_UNAVAILABLE_MESSAGE}
      description="Please contact the school if you think this is a mistake."
    />
  );
}
