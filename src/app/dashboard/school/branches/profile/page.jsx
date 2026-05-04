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
  const isOrgLevel = isAdmin || user?.role?.actions?.includes('view-all-branch-fee'); // generic org-level check

  const { data, isLoading } = useQuery({
    queryKey: ['branch-profile', 'me'],
    queryFn: async () => (await apiClient.get('/branch-profile/me')).data,
    enabled: !!token,
  });

  const profile = data?.data || null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/school/branches"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Branches
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-teal-600" />
              My Branch Profile
            </h1>
          </div>
          {isAdmin && (
            <Link
              href="/dashboard/school/branches/profiles"
              className="text-sm text-teal-700 hover:underline"
            >
              View all branch profiles →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Loading profile...</div>
        ) : (
          <>
            {!profile && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                No profile yet — fill the form below to create one. This is what shows on
                printed reports, vouchers, and certificates.
              </div>
            )}
            <BranchProfileForm initialProfile={profile} />
          </>
        )}
      </div>
    </div>
  );
}
