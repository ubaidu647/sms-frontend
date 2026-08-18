'use client';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Building2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { canSee, canEditScope, isOrgLevel as isOrgLevelScope } from '@/utils/permissions';
import { ACTIONS } from '@/constants/rolePermissions';
import { useWhatsAppSettings } from './hooks';
import WhatsAppSettingsForm from './WhatsAppSettingsForm';

const branchOf = (doc) => (typeof doc?.branchId === 'object' ? doc.branchId : null);

// WhatsApp notifications as a section of the personal Settings page. Hidden
// entirely for users without view access (admins always have it). Branch-scoped
// config + the unofficial QR session live here; permissions still gate editing.
export default function WhatsAppSettingsSection() {
  const { user } = useUserStore();
  const { accessToken: token } = useTokenStore();
  const role = user?.role;

  const canView = canSee(role, ACTIONS.VIEW_WHATSAPP_SETTINGS);
  const canEdit = canEditScope(role, ACTIONS.UPDATE_WHATSAPP_SETTINGS);

  // Branch rule (per the API contract): org-level users must SEND a chosen
  // branchId; branch-scoped users must NOT (the backend uses their own branch).
  const isOrgLevel = isOrgLevelScope(role, ACTIONS.VIEW_WHATSAPP_SETTINGS);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { settings, branches, isLoading, save, saving } = useWhatsAppSettings({
    enabled: canView,
  });

  // Org admins pick which branch to configure/connect. Load the full branch list
  // (same source every org-level selector uses) so branches with no WhatsApp
  // config yet still appear and can be connected.
  const { data: branchData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canView && isOrgLevel,
    staleTime: Infinity,
  });
  const branchOptions = branchData?.data || [];

  const [selectedBranchId, setSelectedBranchId] = useState(null);
  // Default to the first branch until the admin picks one.
  const activeBranchId = isOrgLevel ? selectedBranchId || branchOptions[0]?._id || '' : undefined;

  // Match the chosen branch to its existing settings doc (from /settings/me,
  // which returns one doc per branch for org admins). No doc yet → blank form.
  const docByBranch = useMemo(() => {
    const map = {};
    (branches || []).forEach((d) => {
      const b = branchOf(d);
      if (b?._id) map[b._id] = d;
    });
    return map;
  }, [branches]);

  const activeDoc = isOrgLevel ? docByBranch[activeBranchId] || null : settings;

  // What we SEND to the API: the selected branch for org users, nothing for
  // branch users. What we FILTER socket events by: always a concrete branch id.
  const requestBranchId = isOrgLevel ? activeBranchId : undefined;
  const filterBranchId = isOrgLevel ? activeBranchId : userBranchId;

  // Don't render the section at all for users who can't view it.
  if (!canView) return null;

  const loading = isLoading || (isOrgLevel && branchesLoading);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-wrap">
        <span className="inline-flex w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/40 items-center justify-center text-teal-600 dark:text-teal-300">
          <MessageCircle className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            WhatsApp Notifications
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Send parent attendance alerts over WhatsApp.
          </p>
        </div>

        {isOrgLevel && branchOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={activeBranchId || ''}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {branchOptions.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name || 'Unnamed branch'}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="p-6">
        {!canEdit && (
          <div className="mb-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            You have read-only access — settings can be viewed but not changed.
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading settings…</div>
        ) : isOrgLevel && !activeBranchId ? (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            No branches found — create a branch first to configure WhatsApp.
          </div>
        ) : (
          <WhatsAppSettingsForm
            key={activeBranchId || 'single'}
            settings={activeDoc}
            branchId={requestBranchId}
            filterBranchId={filterBranchId}
            requiresBranch={isOrgLevel}
            canEdit={canEdit}
            onSave={save}
            saving={saving}
          />
        )}
      </div>
    </section>
  );
}
