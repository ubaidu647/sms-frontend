'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  ASSIGNMENT_DIRECTIONS,
  ASSIGNMENT_DIRECTION_LABELS,
  ASSIGNMENT_STATUSES,
} from '@/constants/transport';
import { currentAcademicYear } from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

const toYMD = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function AssignmentFormModal({ isOpen, onClose, assignment, lockedStudent }) {
  const isEdit = !!assignment;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canViewAllBranchStudents =
    isAdmin || !!user?.role?.actions?.includes('view-all-branch-student');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [stopName, setStopName] = useState('');
  const [direction, setDirection] = useState('both');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      const studentObj = typeof assignment.student === 'object' ? assignment.student : null;
      const routeObj = typeof assignment.route === 'object' ? assignment.route : null;
      const sId = studentObj?._id || assignment.studentId?._id || assignment.studentId || '';
      setStudentId(sId);
      setRouteId(routeObj?._id || assignment.routeId?._id || assignment.routeId || '');
      setStopName(assignment.stopName || '');
      setDirection(assignment.direction || 'both');
      setMonthlyFee(assignment.monthlyFee ?? '');
      setAcademicYear(assignment.academicYear || currentAcademicYear());
      setStartDate(toYMD(assignment.startDate));
      setEndDate(toYMD(assignment.endDate));
      setStatus(assignment.status || 'active');
      setNotes(assignment.notes || '');
      const sName = studentObj?.name || assignment.studentId?.user?.name || '';
      const sAdm = studentObj?.admissionNumber || assignment.studentId?.admissionNumber || '';
      setStudentSearch(sName ? `${sName}${sAdm ? ` · ${sAdm}` : ''}` : '');
    } else {
      setStudentId(lockedStudent?._id || '');
      setStudentSearch(
        lockedStudent
          ? `${lockedStudent.user?.name || ''}${lockedStudent.admissionNumber ? ` · ${lockedStudent.admissionNumber}` : ''}`
          : '',
      );
      setRouteId('');
      setStopName('');
      setDirection('both');
      setMonthlyFee('');
      setAcademicYear(currentAcademicYear());
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate('');
      setStatus('active');
      setNotes('');
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, assignment, lockedStudent]);

  const { data: studentSearchData } = useQuery({
    queryKey: ['student-search', studentSearch, canViewAllBranchStudents, userBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 20, token, isActive: 'true' };
      if (!canViewAllBranchStudents && userBranchId) params.branchId = userBranchId;
      if (studentSearch) params.search = studentSearch;
      return fetchData({ url: '/student/list', ...params });
    },
    enabled: !!token && isOpen && !isEdit && !lockedStudent && studentSearch.length >= 2,
    staleTime: 15000,
  });
  const students = studentSearchData?.data || [];

  const { data: routesData } = useQuery({
    queryKey: ['routes-assignment-dropdown', canViewAllBranchStudents, userBranchId],
    queryFn: () => {
      const params = {
        page: 1,
        limit: 200,
        token,
        status: 'active',
        isActive: 'true',
      };
      if (!canViewAllBranchStudents && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/transport/route', ...params });
    },
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const routes = routesData?.data || [];

  const selectedRoute = useMemo(() => routes.find((r) => r._id === routeId), [routes, routeId]);
  const stopOptions = selectedRoute?.stops || [];

  useEffect(() => {
    if (!stopName || !selectedRoute) return;
    const stop = stopOptions.find((s) => s.name === stopName);
    if (stop && monthlyFee === '') {
      setMonthlyFee(stop.fee ?? selectedRoute.baseFee ?? '');
    }
  }, [stopName, selectedRoute, stopOptions, monthlyFee]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/transport/assignment/${assignment._id}`, payload, token })
        : postData({ url: '/transport/assignment', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Assignment updated' : 'Student assigned'));
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-roster'] });
      queryClient.invalidateQueries({ queryKey: ['route-roster'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save assignment';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!isEdit && !studentId) return 'Student is required';
    if (!routeId) return 'Route is required';
    if (!stopName) return 'Stop is required';
    if (!ASSIGNMENT_DIRECTIONS.includes(direction)) return 'Direction is invalid';
    if (!academicYear?.match(/^\d{4}-\d{4}$/)) return 'Academic year must be YYYY-YYYY';
    if (!isEdit && !startDate) return 'Start date is required';
    if (monthlyFee !== '' && Number(monthlyFee) < 0) return 'Monthly fee must be ≥ 0';
    return null;
  };

  const handleSubmit = () => {
    setSubmitError('');
    const err = validate();
    if (err) {
      setSubmitError(err);
      toast.error(err);
      return;
    }

    const payload = {
      routeId,
      stopName,
      direction,
    };
    if (monthlyFee !== '' && !Number.isNaN(Number(monthlyFee)))
      payload.monthlyFee = Number(monthlyFee);
    if (notes?.trim()) payload.notes = notes.trim();

    if (!isEdit) {
      payload.studentId = studentId;
      payload.academicYear = academicYear;
      payload.startDate = startDate;
    } else {
      payload.status = status;
      if (endDate) payload.endDate = endDate;
    }

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transport Assignment' : 'Assign Student to Transport'}
      subtitle={
        isEdit
          ? 'Update route, stop, fee, or status'
          : 'Pick a student, choose a route and stop, and lock in the monthly fee'
      }
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isEdit ? 'Save Changes' : 'Assign'}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {!isEdit && !lockedStudent && (
          <div>
            <label className={labelCls}>
              Student<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setStudentId('');
              }}
              placeholder="Search by name, admission #, or roll..."
              className={inputCls}
            />
            {students.length > 0 && !studentId && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {students.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => {
                      setStudentId(s._id);
                      setStudentSearch(
                        `${s.user?.name || ''}${s.admissionNumber ? ` · ${s.admissionNumber}` : ''}`,
                      );
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {s.user?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {s.admissionNumber} · Roll {s.rollNumber} · {s.class?.name || ''}
                      {s.section?.name ? ` / ${s.section.name}` : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(lockedStudent || isEdit) && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 rounded-lg text-sm text-teal-800">
            <div className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-400">
              Student
            </div>
            <div className="font-medium">{studentSearch || studentId}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              Route<span className="text-red-500">*</span>
            </label>
            <select
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                setStopName('');
                setMonthlyFee('');
              }}
              className={inputCls}
            >
              <option value="">Select route...</option>
              {routes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} {r.code ? `(${r.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Stop<span className="text-red-500">*</span>
            </label>
            <select
              value={stopName}
              onChange={(e) => {
                setStopName(e.target.value);
                setMonthlyFee('');
              }}
              disabled={!routeId}
              className={inputCls}
            >
              <option value="">{routeId ? 'Select stop...' : 'Pick route first'}</option>
              {stopOptions.map((s) => (
                <option key={`${s.sequence}-${s.name}`} value={s.name}>
                  {s.sequence}. {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className={inputCls}
            >
              {ASSIGNMENT_DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {ASSIGNMENT_DIRECTION_LABELS[d] || d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Monthly Fee
              <span className="text-gray-400 dark:text-gray-500 ml-1 normal-case">
                (defaults to stop/route fee)
              </span>
            </label>
            <input
              type="number"
              min={0}
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className={inputCls}
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className={labelCls}>
                  Academic Year<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Start Date<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </>
          )}

          {isEdit && (
            <>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputCls}
                >
                  {ASSIGNMENT_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Setting an end date deactivates the assignment.
                </p>
              </div>
            </>
          )}
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
