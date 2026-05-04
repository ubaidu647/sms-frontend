'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { Paperclip, FileText } from 'lucide-react';
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  TYPE_COLORS,
  TYPE_ICONS,
  SCOPE_LABELS,
  formatDateTime,
  formatBytes,
} from '@/constants/announcement';

export default function AnnouncementDetailModal({ isOpen, onClose, announcementId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: async () => (await apiClient.get(`/announcement/${announcementId}`)).data,
    enabled: !!token && isOpen && !!announcementId,
  });

  const a = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={a?.title || 'Announcement'} size="lg">
      {isLoading || !a ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
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
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {a.status}
            </span>
            {a.isPinned && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                📌 Pinned
              </span>
            )}
            {a.requiresAck && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                Acknowledgement required
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Published At" value={formatDateTime(a.publishedAt)} />
            <Info label="Expires At" value={formatDateTime(a.expiresAt)} />
            <Info
              label="Created By"
              value={a.createdBy?.name || a.creator?.name || a.publishedBy?.name || '—'}
            />
            <Info label="Serial #" value={a.serialNumber || '—'} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Body</h4>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{a.body}</div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Audience
            </h4>
            <div className="rounded-lg border border-gray-200 p-3 text-sm">
              <div className="text-gray-800">
                <strong>Scope:</strong> {SCOPE_LABELS[a.audience?.scope] || a.audience?.scope}
              </div>
              <div className="text-gray-700 mt-1">
                <strong>Notify:</strong>{' '}
                {(a.audience?.targetUserTypes || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 capitalize ml-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {a.audience?.scope === 'class' && a.audience?.classIds?.length > 0 && (
                <ScopeList label="Classes" items={a.audience.classIds.map((c) => c?.name || c)} />
              )}
              {a.audience?.scope === 'section' && a.audience?.sectionIds?.length > 0 && (
                <ScopeList label="Sections" items={a.audience.sectionIds.map((c) => c?.name || c)} />
              )}
              {a.audience?.scope === 'branch' && a.audience?.branchIds?.length > 0 && (
                <ScopeList label="Branches" items={a.audience.branchIds.map((c) => c?.name || c)} />
              )}
              {a.audience?.scope === 'staff' && a.audience?.staffIds?.length > 0 && (
                <ScopeList
                  label="Staff"
                  items={a.audience.staffIds.map((c) => c?.user?.name || c?.name || c)}
                />
              )}
            </div>
          </div>

          {(a.attachments || []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Attachments
              </h4>
              <ul className="space-y-2">
                {a.attachments.map((att) => (
                  <li
                    key={att._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:underline font-medium"
                      >
                        {att.name}
                      </a>
                      <span className="text-xs text-gray-500">{formatBytes(att.size)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.stats && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total Reads" value={a.stats.totalReads ?? 0} />
              {a.requiresAck && <Stat label="Acknowledged" value={a.stats.totalAcks ?? 0} />}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-gray-900 font-medium">{value || '—'}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function ScopeList({ label, items }) {
  return (
    <div className="text-gray-700 mt-1">
      <strong>{label}:</strong>{' '}
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-800 ml-1"
        >
          {String(it)}
        </span>
      ))}
    </div>
  );
}
