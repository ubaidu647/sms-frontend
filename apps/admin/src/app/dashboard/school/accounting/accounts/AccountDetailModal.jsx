'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { ACCOUNT_TYPE_COLORS, formatDate } from '@/constants/accounting';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-gray-100 text-right">{children ?? '—'}</span>
  </div>
);

export default function AccountDetailModal({ isOpen, onClose, accountId }) {
  const { accessToken: token } = useTokenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['account-detail', accountId],
    queryFn: () => fetchData({ url: `/account/${accountId}`, token }),
    enabled: !!token && isOpen && !!accountId,
  });
  const acc = data?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={acc ? `${acc.code} · ${acc.name}` : 'Account'}
      subtitle={acc?.serialNumber}
      size="md"
    >
      {isLoading || !acc ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                ACCOUNT_TYPE_COLORS[acc.type] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {acc.type}
            </span>
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                acc.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {acc.status || 'active'}
            </span>
            {acc.isControlAccount && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                Control{acc.subLedgerType ? ` · ${acc.subLedgerType}` : ''}
              </span>
            )}
            {acc.isGroup && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Group
              </span>
            )}
            {acc.isSystem && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                System
              </span>
            )}
          </div>

          <Row label="Code">{acc.code}</Row>
          <Row label="Name">{acc.name}</Row>
          <Row label="Type">{acc.type}</Row>
          <Row label="Level">{acc.level}</Row>
          <Row label="Parent">
            {acc.parentId?.name ? `${acc.parentId.code} · ${acc.parentId.name}` : '— (top level)'}
          </Row>
          <Row label="Applies to all branches">{acc.appliesToAllBranches ? 'Yes' : 'No'}</Row>
          {!acc.appliesToAllBranches && (
            <Row label="Branches">{(acc.branchIds || []).length || '—'}</Row>
          )}
          {acc.description && <Row label="Description">{acc.description}</Row>}
          <Row label="Created by">{acc.createdBy?.name || acc.createdBy?.email || '—'}</Row>
          <Row label="Created">{formatDate(acc.createdAt)}</Row>
        </div>
      )}
    </Modal>
  );
}
