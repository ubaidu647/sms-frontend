'use client';
import { useState } from 'react';
import { Megaphone, Pin, Paperclip, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAnnouncements } from '@/hooks/useDashboard';
import { PageHeader, Panel } from '@/component/dashboard/Panel';
import { Loading, SeatErrorState, EmptyState } from '@/component/dashboard/States';
import { formatDate } from '@/utils/format';
import { attachmentLinks } from '@/utils/attachmentLinks';

// Each attachment as a link (http/https only), opening in a new tab.
function AttachmentList({ attachments }) {
  const links = attachmentLinks(attachments);
  if (!links.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {links.map((att) => (
        <li key={att.key}>
          <a
            href={att.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#00918e] hover:underline"
          >
            <Paperclip className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{att.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const LIMIT = 20;

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  medium: 'bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]',
  low: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch, isFetching } = useAnnouncements({
    page,
    limit: LIMIT,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        subtitle={total ? `${total} announcement${total === 1 ? '' : 's'}` : 'School notices'}
      />

      {isLoading ? (
        <Loading label="Loading announcements…" />
      ) : isError ? (
        <SeatErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="School notices will show up here."
          icon={Megaphone}
        />
      ) : (
        <>
          <div className={`space-y-3 ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
            {items.map((a, i) => (
              <Panel key={a._id || i}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      a.isPinned ? 'bg-[#f5b21c]/15' : 'bg-[#00918e]/10'
                    }`}
                  >
                    {a.isPinned ? (
                      <Pin className="w-4 h-4 text-[#f5b21c]" />
                    ) : (
                      <Megaphone className="w-4 h-4 text-[#00918e]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                      {a.priority && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.low
                          }`}
                        >
                          {a.priority}
                        </span>
                      )}
                      {a.type && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 capitalize">
                          {a.type}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {a.body}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(a.publishedAt || a.createdAt)}</span>
                    </div>
                    <AttachmentList attachments={a.attachments} />
                  </div>
                </div>
              </Panel>
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
