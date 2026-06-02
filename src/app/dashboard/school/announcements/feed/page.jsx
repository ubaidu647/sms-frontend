'use client';
import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import toast from 'react-hot-toast';
import { Pin, FileText, Check } from 'lucide-react';
import {
  PRIORITY_BORDERS,
  PRIORITY_COLORS,
  TYPE_COLORS,
  TYPE_ICONS,
  formatDateTime,
  formatBytes,
} from '@/constants/announcement';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 20;

export default function AnnouncementFeedPage() {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const t = useTranslations('announcementsFeed');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['announcement-feed'],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetchData({ url: '/announcement/feed', page: pageParam, limit: PAGE_SIZE, token }),
    getNextPageParam: (last, allPages) => {
      const total = last?.total ?? 0;
      const loaded = allPages.reduce((s, p) => s + (p?.data?.length || 0), 0);
      return loaded < total ? allPages.length + 1 : undefined;
    },
    enabled: !!token,
    staleTime: 30_000,
  });

  const items = (data?.pages || []).flatMap((p) => p?.data || []);

  const markRead = useMutation({
    mutationFn: (id) => postData({ url: `/announcement/${id}/mark-read`, token }),
    onSuccess: (_res, id) => {
      queryClient.setQueryData(['announcement-feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            data: (p.data || []).map((a) => (a._id === id ? { ...a, isRead: true } : a)),
          })),
        };
      });
    },
    onError: (err) => toast.error(err.message || 'Failed to mark read'),
  });

  const acknowledge = useMutation({
    mutationFn: (id) => postData({ url: `/announcement/${id}/acknowledge`, token }),
    onSuccess: (_res, id) => {
      toast.success('Acknowledged');
      queryClient.setQueryData(['announcement-feed'], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            data: (p.data || []).map((a) =>
              a._id === id ? { ...a, isRead: true, acknowledged: true } : a,
            ),
          })),
        };
      });
    },
    onError: (err) => toast.error(err.message || 'Failed to acknowledge'),
  });

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading feed...</div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No announcements yet
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              When something is posted for your audience, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((a) => (
              <FeedCard
                key={a._id}
                a={a}
                onMarkRead={() => markRead.mutate(a._id)}
                onAcknowledge={() => acknowledge.mutate(a._id)}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedCard({ a, onMarkRead, onAcknowledge }) {
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (a.isRead || triggered.current || a.requiresAck) return;
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !triggered.current) {
          triggered.current = true;
          onMarkRead();
          obs.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [a.isRead, a.requiresAck, onMarkRead]);

  const borderTone = PRIORITY_BORDERS[a.priority] || 'border-l-gray-300';
  const cardTone = a.isRead ? 'bg-white' : 'bg-teal-50/40';

  return (
    <div
      ref={ref}
      className={`rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${borderTone} ${cardTone} p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {a.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                TYPE_COLORS[a.type] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {TYPE_ICONS[a.type] || ''} <span className="capitalize">{a.type}</span>
            </span>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                PRIORITY_COLORS[a.priority] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {a.priority}
            </span>
            {a.requiresAck && !a.acknowledged && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:text-indigo-400">
                Acknowledgement required
              </span>
            )}
            {!a.isRead && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-600 text-white">
                New
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDateTime(a.publishedAt)}
            {a.expiresAt && ` · expires ${formatDateTime(a.expiresAt)}`}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {a.body}
      </div>

      {a.attachments?.length > 0 && (
        <div className="mt-4 space-y-2">
          {a.attachments.map((att) => (
            <a
              key={att._id || att.url}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
            >
              <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-teal-700 dark:text-teal-400 font-medium">{att.name}</span>
              {att.size != null && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {formatBytes(att.size)}
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {a.requiresAck && !a.acknowledged ? (
          <button
            onClick={onAcknowledge}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Check className="w-4 h-4" /> I have read this
          </button>
        ) : !a.isRead ? (
          <button
            onClick={onMarkRead}
            className="px-3 py-1.5 text-xs text-teal-700 dark:text-teal-400 border border-teal-300 rounded-full hover:bg-teal-50 dark:hover:bg-teal-950/40"
          >
            Mark as read
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Check className="w-3 h-3 text-green-600" />
            {a.acknowledged ? 'Acknowledged' : 'Read'}
          </span>
        )}
      </div>
    </div>
  );
}
