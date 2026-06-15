'use client';
import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  User,
  CalendarDays,
  School,
  Pencil,
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  disabled: 'bg-red-100 text-red-800',
};

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params?.branchId;
  const { accessToken: token } = useTokenStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => (await apiClient.get(`/branch/${branchId}`)).data,
    enabled: !!token && !!branchId,
    staleTime: 60000,
    retry: false,
  });

  const branch = data?.data;

  if (isLoading) {
    return (
      <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-5xl mx-auto w-full">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading branch…</p>
        </div>
      </div>
    );
  }

  if (isError || !branch) {
    const message = error?.response?.data?.message || error?.message || 'Branch not found';
    return (
      <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
        <div className="max-w-5xl mx-auto w-full">
          <button
            onClick={() => router.push('/dashboard/school/branches')}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to branches
          </button>
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        </div>
      </div>
    );
  }

  const statusClass = STATUS_STYLES[branch.status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-5xl mx-auto w-full pb-6">
        <button
          onClick={() => router.push('/dashboard/school/branches')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to branches
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-teal-600" />
                  {branch.name}
                </h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass}`}
                >
                  {branch.status}
                </span>
              </div>
              {branch.serialNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Code: {branch.serialNumber}
                </p>
              )}
            </div>
            <Link
              href={`/dashboard/school/branches/${branch._id}/profile`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
            >
              <Pencil className="w-4 h-4" /> Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <InfoRow icon={School} label="School" value={branch.schoolId?.name} />
            <InfoRow icon={Hash} label="Serial Number" value={branch.serialNumber} />
            <InfoRow icon={MapPin} label="Address" value={branch.address} />
            <InfoRow icon={Phone} label="Phone" value={branch.phone} />
            <InfoRow icon={Mail} label="Email" value={branch.email} />
            <InfoRow
              icon={User}
              label="Branch Manager"
              value={branch.branchManager?.name}
              sub={branch.branchManager?.email}
              fallback="Unassigned"
            />
            <InfoRow icon={CalendarDays} label="Start Date" value={fmtDate(branch.startDate)} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Audit</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={User}
              label="Created By"
              value={branch.createdBy?.name}
              sub={branch.createdBy?.email}
            />
            <InfoRow icon={CalendarDays} label="Created At" value={fmtDate(branch.createdAt)} />
            <InfoRow
              icon={User}
              label="Updated By"
              value={branch.updatedBy?.name}
              sub={branch.updatedBy?.email}
              fallback="—"
            />
            <InfoRow icon={CalendarDays} label="Updated At" value={fmtDate(branch.updatedAt)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, sub, fallback = '—' }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex items-start gap-3">
      <div className="mt-0.5 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-teal-600">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
          {label}
        </p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
          {value || fallback}
        </p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{sub}</p>}
      </div>
    </div>
  );
}
