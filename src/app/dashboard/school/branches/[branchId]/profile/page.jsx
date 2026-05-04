'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { ArrowLeft, Building2 } from 'lucide-react';
import BranchProfileForm from '../../profile/BranchProfileForm';

export default function BranchProfileEditPage() {
  const params = useParams();
  const branchId = params?.branchId;
  const { accessToken: token } = useTokenStore();

  const { data: branchData } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => (await apiClient.get(`/branch/${branchId}`)).data,
    enabled: !!token && !!branchId,
    staleTime: 60000,
  });
  const branch = branchData?.data;

  const { data, isLoading } = useQuery({
    queryKey: ['branch-profile', 'branch', branchId],
    queryFn: async () =>
      (await apiClient.get(`/branch-profile/branch/${branchId}`)).data,
    enabled: !!token && !!branchId,
  });
  const profile = data?.data || null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/school/branches/profiles"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              All Profiles
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-teal-600" />
              Branch Profile
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Loading profile...</div>
        ) : (
          <>
            {!profile && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                No profile yet for this branch — fill the form to create one.
              </div>
            )}
            <BranchProfileForm
              initialProfile={profile}
              branchId={branchId}
              branchLabel={branch?.name}
            />
          </>
        )}
      </div>
    </div>
  );
}
