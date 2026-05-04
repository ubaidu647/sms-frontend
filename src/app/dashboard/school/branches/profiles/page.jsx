'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Building2, Edit, Globe, Mail, Phone } from 'lucide-react';

export default function AllBranchProfilesPage() {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const canList =
    isAdmin ||
    user?.role?.actions?.includes('view-all-branch-fee') ||
    user?.role?.actions?.includes('view-branch') ||
    user?.role?.actions?.includes('update-branch');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-profiles-list'],
    queryFn: () => fetchData({ url: '/branch-profile/list', token }),
    enabled: !!token && canList,
  });

  const profiles = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
              Branch Profiles
            </h1>
          </div>
          <Link
            href="/dashboard/school/branches/profile"
            className="text-sm text-teal-700 hover:underline"
          >
            My branch profile →
          </Link>
        </div>

        {!canList ? (
          <div className="text-sm text-red-600">You don&apos;t have permission to view this list.</div>
        ) : isLoading ? (
          <div className="text-sm text-gray-500">Loading profiles...</div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">🏢</div>
            <div className="text-lg font-medium text-gray-700">No profiles yet</div>
            <p className="text-sm text-gray-500 mt-1">
              Open a branch and set up its profile so reports can use a branded header.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => {
              const branchId = p.branchId?._id || p.branchId;
              const accent = p.primaryColor || '#0d9488';
              return (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  <div className="aspect-[16/9] bg-gray-50 border-b border-gray-200 flex items-center justify-center">
                    {p.logo ? (
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
                      <div className="font-semibold text-gray-900 truncate" title={p.displayName}>
                        {p.displayName}
                      </div>
                      {p.tagline && (
                        <div className="text-xs text-gray-500 truncate" title={p.tagline}>
                          {p.tagline}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      Branch:{' '}
                      <span className="font-medium text-gray-800">
                        {p.branchId?.name || '—'}
                      </span>
                    </div>
                    {(p.printPhone || p.printEmail || p.website) && (
                      <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-100">
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
                        router.push(`/dashboard/school/branches/${branchId}/profile`)
                      }
                      className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
