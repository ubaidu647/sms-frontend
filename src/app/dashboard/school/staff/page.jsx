'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Eye, Edit, Trash2, Ban, CheckCircle } from 'lucide-react';
import AddStaffModal from './AddStaffModal';
import EditStaffModal from './EditStaffModal';
import StaffDetailModal from './StaffDetailModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import { resolveScope, hasAnyAction } from '@/utils/permissions';

function twoMonthsBeforeISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
}

export default function StaffPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [detailStaffId, setDetailStaffId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [staffType, setStaffType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [gender, setGender] = useState('');
  const [branchId, setBranchId] = useState('');
  const [fromDate, setFromDate] = useState(twoMonthsBeforeISO());
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [isActive, setIsActive] = useState('true');

  // RBAC
  const scope = resolveScope(user?.role, 'view-staff');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const updateScope = resolveScope(user?.role, 'update-staff');
  const canCreate =
    !isOwnOnly && hasAnyAction(user?.role, ['create-staff', 'create-all-branch-staff']);
  const canUpdate = updateScope !== 'none';
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-staff', 'delete-all-branch-staff']);
  const canActOnAllBranches = hasAnyAction(user?.role, ['delete-all-branch-staff']);

  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Branch dropdown for org-level users
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const columns = useMemo(() => [
    {
      header: 'Name',
      accessor: 'user',
      render: (v, row) => {
        const name = v?.name || '';
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0]?.toUpperCase())
          .join('') || '?';
        return (
          <div className="flex items-center gap-3">
            {row.photo ? (
              <img
                src={row.photo}
                alt={name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-semibold text-sm items-center justify-center flex-shrink-0"
              style={{ display: row.photo ? 'none' : 'flex' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{v?.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Serial No.',
      accessor: 'serialNumber',
      render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v}</div>,
    },
    {
      header: 'Designation',
      accessor: 'designation',
      render: (v) => <div className="text-gray-700 dark:text-gray-300 text-sm">{v}</div>,
    },
    {
      header: 'Type',
      accessor: 'staffType',
      render: (v) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          v === 'teaching' ? 'bg-teal-100 text-teal-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {v === 'teaching' ? 'Teaching' : 'Non-Teaching'}
        </span>
      ),
    },
    {
      header: 'Employment',
      accessor: 'employmentType',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:text-blue-300 capitalize">
          {v}
        </span>
      ),
    },
    {
      header: 'Branch',
      accessor: 'branch',
      render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name ?? '—'}</div>,
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name ?? '—'}</div>,
    },
    {
      header: 'Joining Date',
      accessor: 'joiningDate',
      render: (v) => <div className="text-gray-500 dark:text-gray-400 text-sm">{v ? new Date(v).toLocaleDateString() : '—'}</div>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (v) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
          v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {v ? 'Active' : 'Blocked'}
        </span>
      ),
    },
  ], []);

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View Details', value: 'view', icon: Eye }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && !isOwnOnly) {
      if (canActOnAllBranches || row.branch?._id === userBranchId) {
        items.push(
          row.isActive
            ? { label: 'Block', value: 'toggle', icon: Ban }
            : { label: 'Unblock', value: 'toggle', icon: CheckCircle },
        );
        items.push({ label: 'Delete', value: 'delete', icon: Trash2, danger: true });
      }
    }
    return items;
  };

  const toggleMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/staff/${id}/toggle-status`, token }),
    onSuccess: (res, id) => {
      queryClient.setQueriesData({ queryKey: ['staff'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((s) =>
            s._id === id ? { ...s, isActive: res.data.isActive } : s,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(res.message || 'Status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/staff/${id}`, token }),
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ['staff'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((s) => s._id !== id),
          total: Math.max((old.total || 1) - 1, 0),
        };
      });
      toast.success('Staff deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete staff'),
  });

  const queryKey = [
    'staff', page, limit, name, serialNumber, designation, staffType,
    employmentType, gender, branchId, fromDate, toDate, isActive, isOrgLevel, userBranchId,
  ];

  const { data } = useQuery({
    queryKey: isOwnOnly ? ['staff', 'self', user?.staffId] : queryKey,
    queryFn: async () => {
      // Own-scope: pull just the user's own staff doc and wrap as a list.
      if (isOwnOnly) {
        const res = await fetchData({ url: `/staff/${user.staffId}`, token });
        const row = res?.data || res;
        return { data: row ? [row] : [], total: row ? 1 : 0 };
      }
      const params = {};
      if (!isOrgLevel) {
        params.branchId = userBranchId;
      } else if (branchId) {
        params.branchId = branchId;
      }
      if (name) params.name = name;
      if (serialNumber) params.serialNumber = serialNumber;
      if (designation) params.designation = designation;
      if (staffType) params.staffType = staffType;
      if (employmentType) params.employmentType = employmentType;
      if (gender) params.gender = gender;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/staff/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user && (!isOwnOnly || !!user?.staffId),
  });

  const staff = data?.data || [];

  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isOwnOnly ? 'My Profile' : 'Staff'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isOwnOnly
                ? 'Your own staff profile.'
                : 'Manage staff members and their accounts'}
            </p>
          </div>
          {canCreate && !isOwnOnly && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
          )}
        </div>

        {/* Filters — hidden in own-scope, the user only sees their own row */}
        <div
          className="mb-4 flex flex-wrap items-center gap-3"
          style={{ display: isOwnOnly ? 'none' : undefined }}
        >
          {/* Date range */}
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); resetPage(); }} className="text-sm outline-none text-gray-900 dark:text-gray-100" />
            <label className="text-sm text-gray-500 dark:text-gray-400">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); resetPage(); }} className="text-sm outline-none text-gray-900 dark:text-gray-100" />
          </div>

          {/* Active / Blocked toggle */}
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); resetPage(); }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Blocked</option>
            <option value="">All</option>
          </select>

          {/* Name search */}
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Name..."
              value={name}
              onChange={(e) => { setName(e.target.value); resetPage(); }}
              className="outline-none text-sm w-32 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Designation search */}
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Designation..."
              value={designation}
              onChange={(e) => { setDesignation(e.target.value); resetPage(); }}
              className="outline-none text-sm w-32 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Serial number */}
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Serial no..."
              value={serialNumber}
              onChange={(e) => { setSerialNumber(e.target.value); resetPage(); }}
              className="outline-none text-sm w-28 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Staff type */}
          <select
            value={staffType}
            onChange={(e) => { setStaffType(e.target.value); resetPage(); }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Types</option>
            <option value="teaching">Teaching</option>
            <option value="non-teaching">Non-Teaching</option>
          </select>

          {/* Employment type */}
          <select
            value={employmentType}
            onChange={(e) => { setEmploymentType(e.target.value); resetPage(); }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Employment</option>
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="part-time">Part-Time</option>
            <option value="visiting">Visiting</option>
          </select>

          {/* Gender */}
          <select
            value={gender}
            onChange={(e) => { setGender(e.target.value); resetPage(); }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {/* Branch filter — org-level only */}
          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => { setBranchId(e.target.value); resetPage(); }}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <Table
          columns={columns}
          data={staff}
          rowActions={rowActions}
          onRowAction={(action, row) => {
            if (action === 'view') setDetailStaffId(row._id);
            if (action === 'edit') setEditStaff(row);
            if (action === 'toggle') toggleMutation.mutate(row._id);
            if (action === 'delete') setDeleteTarget(row);
          }}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
        />

        {/* Modals */}
        <AddStaffModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditStaffModal
          isOpen={!!editStaff}
          onClose={() => setEditStaff(null)}
          onSuccess={() => setEditStaff(null)}
          staff={editStaff}
          isSelf={isOwnOnly}
        />

        <StaffDetailModal
          isOpen={!!detailStaffId}
          onClose={() => setDetailStaffId(null)}
          staffId={detailStaffId}
        />

        {/* Delete confirmation */}
        {deleteTarget && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Staff</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteTarget.user?.name}</span>?
                  This will also remove their login account and cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget._id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
