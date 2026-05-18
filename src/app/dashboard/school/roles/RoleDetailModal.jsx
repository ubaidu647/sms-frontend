'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { AVAILABLE_MENUS, AVAILABLE_ACTIONS } from '@/constants/rolePermissions';

async function fetchRoleById(id) {
  const { data } = await apiClient.get(`/role/${id}`);
  return data?.data;
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="text-sm text-gray-800 dark:text-gray-200">{children}</div>
    </div>
  );
}

export default function RoleDetailModal({ isOpen, onClose, roleId }) {
  const {
    data: role,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['role-detail', roleId],
    queryFn: () => fetchRoleById(roleId),
    enabled: !!roleId && isOpen,
    staleTime: 30_000,
  });

  const menuLabelMap = Object.fromEntries(AVAILABLE_MENUS.map((m) => [m.key, m.label]));
  const actionLabelMap = Object.fromEntries(AVAILABLE_ACTIONS.map((a) => [a.key, a.label]));

  const actionsByMenu = role
    ? AVAILABLE_MENUS.filter((m) => role.menus?.includes(m.key)).map((m) => ({
        ...m,
        actions: (role.actions || []).filter((a) => {
          const def = AVAILABLE_ACTIONS.find((x) => x.key === a);
          return def?.menu === m.key;
        }),
      }))
    : [];

  const ungroupedActions = role
    ? (role.actions || []).filter((a) => {
        const def = AVAILABLE_ACTIONS.find((x) => x.key === a);
        return !def || !role.menus?.includes(def.menu);
      })
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role Details"
      subtitle="Full details of the selected role"
      closeOnBackdrop
    >
      {isLoading && (
        <div className="py-12 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
          Loading…
        </div>
      )}

      {isError && (
        <div className="py-6 text-center text-red-600 text-sm">
          Failed to load role details. Please try again.
        </div>
      )}

      {role && (
        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Role Name">{role.name}</DetailRow>
            <DetailRow label="Serial Number">{role.serialNumber || '—'}</DetailRow>
            <DetailRow label="Branch">{role.branch?.name || '—'}</DetailRow>
            <DetailRow label="Type">
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  role.isPredefined ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {role.isPredefined ? 'Predefined' : 'Custom'}
              </span>
            </DetailRow>
            <DetailRow label="Status">
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            </DetailRow>
            <DetailRow label="Created">
              {role.createdAt ? new Date(role.createdAt).toLocaleString() : '—'}
            </DetailRow>
          </div>

          {/* Menus */}
          <DetailRow label="Menus">
            {role.menus?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {role.menus.map((m) => (
                  <span
                    key={m}
                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                  >
                    {menuLabelMap[m] || m}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">None</span>
            )}
          </DetailRow>

          {/* Actions grouped by menu */}
          {(actionsByMenu.length > 0 || ungroupedActions.length > 0) && (
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Actions ({role.actions?.length ?? 0})
              </span>
              <div className="mt-2 space-y-3">
                {actionsByMenu.map((group) =>
                  group.actions.length > 0 ? (
                    <div key={group.key}>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.actions.map((a) => (
                          <span
                            key={a}
                            className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100"
                          >
                            {actionLabelMap[a] || a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
                {ungroupedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ungroupedActions.map((a) => (
                      <span
                        key={a}
                        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100"
                      >
                        {actionLabelMap[a] || a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
