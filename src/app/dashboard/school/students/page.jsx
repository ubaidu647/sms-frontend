'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Eye, Edit, Ban, CheckCircle, ArrowRightLeft, X } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import StudentDetailModal from './StudentDetailModal';
import TransferStudentModal from './TransferStudentModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

const ACADEMIC_STATUSES = [
  'enrolled',
  'promoted',
  'transferred',
  'graduated',
  'dropped',
  'suspended',
];

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function StudentsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('students');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [transferStudent, setTransferStudent] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft state holds the in-progress UI values; applied state drives the API.
  const defaultAcademicYear = currentAcademicYear();
  const [draftSearch, setDraftSearch] = useState('');
  const [draftAdmissionNumber, setDraftAdmissionNumber] = useState('');
  const [draftRollNumber, setDraftRollNumber] = useState('');
  const [draftGender, setDraftGender] = useState('');
  const [draftAcademicStatus, setDraftAcademicStatus] = useState('');
  const [draftAcademicYear, setDraftAcademicYear] = useState(defaultAcademicYear);
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSectionId, setDraftSectionId] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');

  const [search, setSearch] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [gender, setGender] = useState('');
  const [academicStatus, setAcademicStatus] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');

  const applyFilters = () => {
    setSearch(draftSearch);
    setAdmissionNumber(draftAdmissionNumber);
    setRollNumber(draftRollNumber);
    setGender(draftGender);
    setAcademicStatus(draftAcademicStatus);
    setAcademicYear(draftAcademicYear);
    setClassId(draftClassId);
    setSectionId(draftSectionId);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftAdmissionNumber('');
    setDraftRollNumber('');
    setDraftGender('');
    setDraftAcademicStatus('');
    setDraftAcademicYear(defaultAcademicYear);
    setDraftClassId('');
    setDraftSectionId('');
    setDraftBranchId('');
    setDraftIsActive('true');
    setSearch('');
    setAdmissionNumber('');
    setRollNumber('');
    setGender('');
    setAcademicStatus('');
    setAcademicYear(defaultAcademicYear);
    setClassId('');
    setSectionId('');
    setBranchId('');
    setIsActive('true');
    setPage(1);
  };

  // RBAC
  const scope = resolveScope(user?.role, 'view-student');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canCreate =
    !isOwnOnly && hasAnyAction(user?.role, ['create-student', 'create-all-branch-student']);
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-student', 'update-all-branch-student']);
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-student', 'delete-all-branch-student']);
  const canActOnAllBranches = hasAnyAction(user?.role, ['delete-all-branch-student']);
  const canTransfer = canUpdate;

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

  // Class dropdown for filter — academicYear uses applied (text input avoids keystroke storms);
  // branchId uses draft so changing the branch select instantly refreshes class options.
  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', academicYear, draftBranchId, userBranchId, isOrgLevel],
    queryFn: () => {
      const params = { academicYear };
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (draftBranchId) params.branchId = draftBranchId;
      return fetchData({ url: '/class/list', page: 1, limit: 200, token, ...params });
    },
    enabled: !!token && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  // Section dropdown — uses draftClassId so picking a class instantly refreshes section options.
  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', draftClassId],
    queryFn: () => fetchData({ url: `/class/${draftClassId}/sections`, token }),
    enabled: !!token && !!draftClassId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: 'user',
        render: (v, row) => {
          const name = v?.name || '';
          const initials =
            name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase())
              .join('') || '?';
          return (
            <div className="flex items-center gap-3">
              {row.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.photo}
                  alt={name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
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
        header: 'Admission No.',
        accessor: 'admissionNumber',
        render: (v) => (
          <div className="text-gray-700 dark:text-gray-300 text-sm font-medium">{v}</div>
        ),
      },
      {
        header: 'Roll',
        accessor: 'rollNumber',
        render: (v) => <div className="text-gray-700 dark:text-gray-300 text-sm">{v}</div>,
      },
      {
        header: 'Class',
        accessor: 'class',
        render: (_, row) => (
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            {row.class?.name || '—'}
            {row.section?.name ? (
              <span className="text-gray-400 dark:text-gray-500"> / {row.section.name}</span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v}</div>,
      },
      {
        header: 'Father',
        accessor: 'father',
        render: (v) => (
          <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name || '—'}</div>
        ),
      },
      {
        header: 'Branch',
        accessor: 'branch',
        render: (v) => (
          <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name ?? '—'}</div>
        ),
      },
      {
        header: 'Academic Status',
        accessor: 'academicStatus',
        render: (v) => {
          const colors = {
            enrolled: 'bg-green-100 text-green-800',
            promoted: 'bg-teal-100 text-teal-800',
            transferred: 'bg-blue-100 text-blue-800',
            graduated: 'bg-purple-100 text-purple-800',
            dropped: 'bg-red-100 text-red-800',
            suspended: 'bg-yellow-100 text-yellow-800',
          };
          return (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[v] || 'bg-gray-100 text-gray-700'}`}
            >
              {v}
            </span>
          );
        },
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {v ? 'Active' : 'Blocked'}
          </span>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View Details', value: 'view', icon: Eye }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canTransfer && !isOwnOnly) {
      items.push({ label: 'Transfer', value: 'transfer', icon: ArrowRightLeft });
    }
    if (canDelete && !isOwnOnly) {
      if (canActOnAllBranches || row.branch?._id === userBranchId) {
        items.push(
          row.isActive
            ? { label: 'Block', value: 'toggle', icon: Ban }
            : { label: 'Unblock', value: 'toggle', icon: CheckCircle },
        );
      }
    }
    return items;
  };

  const toggleMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/student/${id}/toggle-status`, token }),
    onSuccess: (res, id) => {
      queryClient.setQueriesData({ queryKey: ['students'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((s) =>
            s._id === id ? { ...s, isActive: res.data.isActive, status: res.data.status } : s,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(res.message || 'Status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  });

  const queryKey = [
    'students',
    page,
    limit,
    search,
    admissionNumber,
    rollNumber,
    gender,
    academicStatus,
    academicYear,
    classId,
    sectionId,
    branchId,
    isActive,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey: isOwnOnly ? ['student', 'self', user?.studentId] : queryKey,
    queryFn: async () => {
      // Own-scope: fetch only the user's own student record (or their child).
      if (isOwnOnly) {
        const res = await fetchData({ url: `/student/${user.studentId}`, token });
        const row = res?.data || res;
        return { data: row ? [row] : [], total: row ? 1 : 0 };
      }
      const params = {};
      if (!isOrgLevel) {
        params.branchId = userBranchId;
      } else if (branchId) {
        params.branchId = branchId;
      }
      if (search) params.search = search;
      if (admissionNumber) params.admissionNumber = admissionNumber;
      if (rollNumber) params.rollNumber = rollNumber;
      if (gender) params.gender = gender;
      if (academicStatus) params.academicStatus = academicStatus;
      if (academicYear) params.academicYear = academicYear;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/student/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user && (!isOwnOnly || !!user?.studentId),
  });

  const students = data?.data || [];

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isOwnOnly ? t('ownTitle') : t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {isOwnOnly ? t('ownSubtitle') : t('subtitle')}
            </p>
          </div>
          {canCreate && !isOwnOnly && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Enroll Student
            </button>
          )}
        </div>

        {/* Filters — hidden in own-scope */}
        <div
          className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3"
          style={{ display: isOwnOnly ? 'none' : undefined }}
        >
          {/* Active / Blocked toggle */}
          <select
            value={draftIsActive}
            onChange={(e) => setDraftIsActive(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Blocked</option>
            <option value="">All</option>
          </select>

          {/* Name search */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search name..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-full lg:w-36 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {/* Admission number */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Admission no..."
              value={draftAdmissionNumber}
              onChange={(e) => setDraftAdmissionNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-full lg:w-32 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {/* Roll number */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Roll no..."
              value={draftRollNumber}
              onChange={(e) => setDraftRollNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-full lg:w-24 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {/* Academic year */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="2025-2026"
              value={draftAcademicYear}
              onChange={(e) => setDraftAcademicYear(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-full lg:w-28 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {/* Class */}
          <select
            value={draftClassId}
            onChange={(e) => {
              setDraftClassId(e.target.value);
              setDraftSectionId('');
            }}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Section (only when class selected) */}
          {draftClassId && (
            <select
              value={draftSectionId}
              onChange={(e) => setDraftSectionId(e.target.value)}
              className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Gender */}
          <select
            value={draftGender}
            onChange={(e) => setDraftGender(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          {/* Academic status */}
          <select
            value={draftAcademicStatus}
            onChange={(e) => setDraftAcademicStatus(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Academic Status</option>
            {ACADEMIC_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          {/* Branch filter — org-level only */}
          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => {
                setDraftBranchId(e.target.value);
                setDraftClassId('');
                setDraftSectionId('');
              }}
              className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm w-full lg:w-auto"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm w-full lg:w-auto"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <Table
          columns={columns}
          data={students}
          rowActions={rowActions}
          onRowAction={(action, row) => {
            if (action === 'view') setDetailStudentId(row._id);
            if (action === 'edit') setEditStudent(row);
            if (action === 'transfer') setTransferStudent(row);
            if (action === 'toggle') toggleMutation.mutate(row._id);
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
        <AddStudentModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditStudentModal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => setEditStudent(null)}
          student={editStudent}
        />

        <StudentDetailModal
          isOpen={!!detailStudentId}
          onClose={() => setDetailStudentId(null)}
          studentId={detailStudentId}
          canManageDocuments={canUpdate}
        />

        <TransferStudentModal
          isOpen={!!transferStudent}
          onClose={() => setTransferStudent(null)}
          onSuccess={() => setTransferStudent(null)}
          student={transferStudent}
        />
      </div>
    </div>
  );
}
