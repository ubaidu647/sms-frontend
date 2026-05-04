'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  Archive,
  Paperclip,
  BarChart3,
  Pin,
} from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchData, deleteData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import ComposeAnnouncementModal from './ComposeAnnouncementModal';
import EditAnnouncementModal from './EditAnnouncementModal';
import AnnouncementDetailModal from './AnnouncementDetailModal';
import ReadStatsModal from './ReadStatsModal';
import ManageAttachmentsModal from './ManageAttachmentsModal';
import ConfirmModal from './ConfirmModal';
import {
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  PRIORITY_COLORS,
  STATUS_COLORS,
  TYPE_COLORS,
  TYPE_ICONS,
  formatDateTime,
  SCOPE_LABELS,
} from '@/constants/announcement';

export default function AnnouncementsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [composeOpen, setComposeOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [statsTarget, setStatsTarget] = useState(null);
  const [attachmentsTarget, setAttachmentsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [isPinned, setIsPinned] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin ||
    actions.includes('create-announcement') ||
    actions.includes('create-all-branch-announcement');
  const canUpdate =
    isAdmin ||
    actions.includes('update-announcement') ||
    actions.includes('update-all-branch-announcement');
  const canDelete =
    isAdmin ||
    actions.includes('delete-announcement') ||
    actions.includes('delete-all-branch-announcement');
  const canPublish = isAdmin || actions.includes('publish-announcement');
  const canViewStats =
    isAdmin ||
    actions.includes('view-announcement') ||
    actions.includes('view-all-branch-announcement');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-announcement');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const queryKey = [
    'announcements',
    page,
    limit,
    search,
    status,
    type,
    priority,
    isPinned,
    fromDate,
    toDate,
    branchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;
      if (priority) params.priority = priority;
      if (isPinned !== '') params.isPinned = isPinned;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (isOrgLevel && branchId) params.branchId = branchId;
      return fetchData({ url: '/announcement/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const resetPage = () => setPage(1);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/announcement/${id}`, token }),
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/announcement/${id}/publish`, token }),
    onSuccess: () => {
      toast.success('Announcement published');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setPublishTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to publish'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/announcement/${id}/archive`, token }),
    onSuccess: () => {
      toast.success('Announcement archived');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setArchiveTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to archive'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Title',
        accessor: 'title',
        render: (v, row) => (
          <div>
            <div className="flex items-center gap-2">
              {row.isPinned && <Pin className="w-3 h-3 text-amber-600" />}
              <div className="font-medium text-gray-900">{v}</div>
            </div>
            <div className="text-xs text-gray-400">
              {row.serialNumber}
              {row.attachments?.length > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                  <Paperclip className="w-3 h-3" /> {row.attachments.length}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        header: 'Type',
        accessor: 'type',
        render: (v) => (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              TYPE_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {TYPE_ICONS[v] || ''} <span className="capitalize">{v}</span>
          </span>
        ),
      },
      {
        header: 'Priority',
        accessor: 'priority',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              PRIORITY_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        header: 'Audience',
        accessor: 'audience',
        render: (v) => (
          <div className="text-xs text-gray-700">
            <div>{SCOPE_LABELS[v?.scope] || v?.scope || '—'}</div>
            <div className="text-gray-500">
              {(v?.targetUserTypes || []).join(', ') || '—'}
            </div>
          </div>
        ),
      },
      {
        header: 'Published',
        accessor: 'publishedAt',
        render: (v) => <span className="text-xs text-gray-600">{formatDateTime(v)}</span>,
      },
      {
        header: 'Expires',
        accessor: 'expiresAt',
        render: (v) => <span className="text-xs text-gray-600">{formatDateTime(v)}</span>,
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View', value: 'view', icon: Eye }];
    if (canViewStats) items.push({ label: 'Read Stats', value: 'stats', icon: BarChart3 });
    if (canUpdate) {
      items.push({ label: 'Edit', value: 'edit', icon: Edit });
      items.push({ label: 'Attachments', value: 'attachments', icon: Paperclip });
    }
    if (canPublish && row.status !== 'published') {
      items.push({ label: 'Publish', value: 'publish', icon: Send });
    }
    if (canPublish && row.status === 'published') {
      items.push({ label: 'Archive', value: 'archive', icon: Archive });
    }
    if (canDelete) items.push({ label: 'Delete', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'view') setDetailId(row._id);
    if (action === 'stats') setStatsTarget(row);
    if (action === 'edit') setEditTarget(row);
    if (action === 'attachments') setAttachmentsTarget(row);
    if (action === 'publish') setPublishTarget(row);
    if (action === 'archive') setArchiveTarget(row);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-1">
              Compose and manage notices, events, and urgent updates for your audience.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Compose
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search title / body..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-64 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Status</option>
            {ANNOUNCEMENT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Types</option>
            {ANNOUNCEMENT_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Priority</option>
            {ANNOUNCEMENT_PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p}
              </option>
            ))}
          </select>

          <select
            value={isPinned}
            onChange={(e) => {
              setIsPinned(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All</option>
            <option value="true">Pinned only</option>
            <option value="false">Not pinned</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none"
          />

          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => {
                setBranchId(e.target.value);
                resetPage();
              }}
              className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Table
          columns={columns}
          data={list}
          rowActions={rowActions}
          onRowAction={handleRowAction}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
        />

        <ComposeAnnouncementModal
          isOpen={composeOpen}
          onClose={() => setComposeOpen(false)}
        />
        <EditAnnouncementModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          announcement={editTarget}
        />
        <AnnouncementDetailModal
          isOpen={!!detailId}
          onClose={() => setDetailId(null)}
          announcementId={detailId}
        />
        <ReadStatsModal
          isOpen={!!statsTarget}
          onClose={() => setStatsTarget(null)}
          announcement={statsTarget}
        />
        <ManageAttachmentsModal
          isOpen={!!attachmentsTarget}
          onClose={() => setAttachmentsTarget(null)}
          announcement={attachmentsTarget}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Announcement"
          message={
            deleteTarget
              ? `Delete "${deleteTarget.title}"? This soft-deletes; the record stays in the database but disappears from all views.`
              : ''
          }
          confirmLabel="Delete"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
        <ConfirmModal
          isOpen={!!publishTarget}
          onClose={() => setPublishTarget(null)}
          title="Publish Announcement"
          message={
            publishTarget
              ? `Publish "${publishTarget.title}"? It will become visible to its audience immediately.`
              : ''
          }
          confirmLabel="Publish"
          confirmTone="primary"
          loading={publishMutation.isPending}
          onConfirm={() => publishMutation.mutate(publishTarget._id)}
        />
        <ConfirmModal
          isOpen={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          title="Archive Announcement"
          message={
            archiveTarget
              ? `Archive "${archiveTarget.title}"? It will be hidden from the user feed.`
              : ''
          }
          confirmLabel="Archive"
          confirmTone="warning"
          loading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate(archiveTarget._id)}
        />
      </div>
    </div>
  );
}
