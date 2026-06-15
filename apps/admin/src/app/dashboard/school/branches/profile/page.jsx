'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Building2 } from 'lucide-react';
import BranchProfileForm from './BranchProfileForm';

export default function MyBranchProfilePage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const acts = user?.role?.actions || [];
  const isOrgLevel = isAdmin || acts.includes('view-all-branch-profile');
  const canViewBranches = isAdmin || acts.includes('view-branch');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-profile', 'me'],
    queryFn: async () => (await apiClient.get('/branch-profile/me')).data,
    enabled: !!token,
  });

  const profile = (Array.isArray(data?.data) ? data.data[0] : data?.data) || null;
  const branchName =
    (typeof profile?.branchId === 'object' && profile?.branchId?.name) ||
    user?.branch?.name ||
    user?.branchName ||
    '';

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-6">
      <div className="max-w-5xl mx-auto pb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {canViewBranches && (
              <>
                <Link
                  href="/dashboard/school/branches"
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Branches
                </Link>
                <span className="text-gray-300">/</span>
              </>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-teal-600" />
                My Branch Profile
              </h1>
              {branchName && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
                  Branch:{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {branchName}
                  </span>
                </div>
              )}
            </div>
          </div>
          {isOrgLevel && (
            <Link
              href="/dashboard/school/branches/profiles"
              className="text-sm text-teal-700 dark:text-teal-400 hover:underline"
            >
              View all branch profiles →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</div>
        ) : (
          <>
            {!profile && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                No profile yet — fill the form below to create one. This is what shows on printed
                reports, vouchers, and certificates.
              </div>
            )}
            <BranchProfileForm
              initialProfile={profile}
              branchLabel={!profile && branchName ? branchName : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
