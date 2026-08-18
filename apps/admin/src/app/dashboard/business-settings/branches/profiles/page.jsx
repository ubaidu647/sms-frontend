'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Building2, Edit, Globe, Mail, Phone, Plus } from 'lucide-react';

export default function AllBranchProfilesPage() {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const acts = user?.role?.actions || [];
  const canList = isAdmin || acts.includes('view-all-branch-profile');
  const canCreate = isAdmin || acts.includes('create-all-branch-profile');
  const canViewBranches = isAdmin || acts.includes('view-branch');

  const { data: profilesData, isLoading: loadingProfiles } = useQuery({
    queryKey: ['branch-profiles-list'],
    queryFn: () => fetchData({ url: '/branch-profile/list', token }),
    enabled: !!token && canList,
  });

  const { data: branchesData, isLoading: loadingBranches } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 200, token }),
    enabled: !!token && canList,
    staleTime: 60000,
    // If the role lacks view-branch the API will 403 — silently fall back
    // to whatever the /branch-profile/list response gives us. The page is
    // still usable for editing existing profiles in that case.
    retry: false,
  });

  const profiles = useMemo(() => profilesData?.data || [], [profilesData]);
  const branches = useMemo(() => branchesData?.data || [], [branchesData]);
  const isLoading = loadingProfiles || loadingBranches;
  const branchListUnavailable = !branchesData && !loadingBranches;

  // Merge: every known branch gets a card; profiles for branches we didn't see
  // in /branch/list (e.g. forbidden) still render via the populated branchId.
  const cards = useMemo(() => {
    const map = new Map();
    for (const b of branches) {
      map.set(String(b._id), { branch: b, profile: null });
    }
    for (const p of profiles) {
      const bid = p.branchId?._id || p.branchId;
      if (!bid) continue;
      const key = String(bid);
      const existing = map.get(key);
      if (existing) {
        existing.profile = p;
      } else {
        const populated = typeof p.branchId === 'object' ? p.branchId : null;
        map.set(key, {
          branch: populated || { _id: bid, name: '—' },
          profile: p,
        });
      }
    }
    return Array.from(map.values());
  }, [profiles, branches]);

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 md:overflow-y-auto pb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {canViewBranches && (
              <>
                <Link
                  href="/dashboard/business-settings/branches"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Branches
                </Link>
                <span className="text-gray-300">/</span>
              </>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-teal-600" />
              Branch Profiles
            </h1>
          </div>
          <Link
            href="/dashboard/business-settings/branches/profile"
            className="text-sm text-teal-700 dark:text-teal-400 hover:underline"
          >
            My branch profile →
          </Link>
        </div>

        {!canList ? (
          <div className="text-sm text-red-600">
            You don&apos;t have permission to view this list.
          </div>
        ) : isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading profiles...</div>
        ) : cards.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="text-5xl mb-3">🏢</div>
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No branches yet
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {branchListUnavailable
                ? 'No profiles found. To see branches that still need a profile, ask an admin to grant view-branch.'
                : 'Create a branch first, then come back to set up its profile.'}
            </p>
          </div>
        ) : (
          <>
            {branchListUnavailable && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Showing only branches that already have a profile. To see branches that still need
                one, ask an admin to grant <code className="font-mono">view-branch</code>.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(({ branch, profile: p }) => {
                const accent = p?.primaryColor || '#cbd5e1';
                const hasProfile = !!p;
                return (
                  <div
                    key={branch._id}
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                    style={{ borderTop: `3px solid ${accent}` }}
                  >
                    <div className="aspect-[16/9] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      {p?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo}
                          alt={p.displayName}
                          className="max-h-full max-w-full object-contain p-4"
                        />
                      ) : (
                        <div className="text-gray-300 text-5xl">🏫</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <div
                          className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                          title={p?.displayName || branch.name}
                        >
                          {p?.displayName || branch.name}
                        </div>
                        {p?.tagline && (
                          <div
                            className="text-xs text-gray-500 dark:text-gray-400 truncate"
                            title={p.tagline}
                          >
                            {p.tagline}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-600 dark:text-gray-400">
                          Branch:{' '}
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {branch.name}
                          </span>
                        </div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-medium ${
                            hasProfile
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {hasProfile ? 'Has profile' : 'No profile'}
                        </span>
                      </div>
                      {hasProfile && (p.printPhone || p.printEmail || p.website) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                          {p.printPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {p.printPhone}
                            </div>
                          )}
                          {p.printEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {p.printEmail}
                            </div>
                          )}
                          {p.website && (
                            <div className="flex items-center gap-1 truncate">
                              <Globe className="w-3 h-3" /> {p.website}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/dashboard/business-settings/branches/${branch._id}/profile`)
                        }
                        disabled={!hasProfile && !canCreate}
                        title={!hasProfile && !canCreate ? 'You need create permission' : undefined}
                        className={`w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          hasProfile
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : canCreate
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {hasProfile ? (
                          <>
                            <Edit className="w-3.5 h-3.5" /> Edit Profile
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Create Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
