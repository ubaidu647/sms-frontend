'use client';
// Staff balance lookup: pick a staff member → GET /leave/balance.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import { currentAcademicYear, previousAcademicYear } from '@/utils/academicYear';
import { cardCls, inputCls, labelCls } from './leaveShared';
import { BranchSelect, StaffSelect } from './LeavePickers';
import BalanceTable from './BalanceTable';

export default function BalancePanel({ orgTier }) {
  const { accessToken: token } = useTokenStore();
  const thisYear = currentAcademicYear();
  const years = [thisYear, previousAcademicYear(thisYear)];
  const [branchId, setBranchId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [year, setYear] = useState(thisYear);

  const { data, isFetching, error } = useQuery({
    queryKey: ['leave-balance', staffId, year],
    queryFn: () => fetchData({ url: '/leave/balance', token, staffId, leaveYear: year }),
    enabled: !!token && !!staffId,
    retry: retryUnless4xx,
  });

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {orgTier && (
            <div>
              <label className={labelCls}>Branch</label>
              <BranchSelect
                value={branchId}
                onChange={(v) => {
                  setBranchId(v);
                  setStaffId('');
                }}
                allLabel="All branches"
              />
            </div>
          )}
          <div>
            <label className={labelCls}>Staff member</label>
            <StaffSelect value={staffId} onChange={setStaffId} branchId={orgTier ? branchId : ''} />
          </div>
          <div>
            <label className={labelCls}>Leave year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!staffId ? (
        <div className={`${cardCls} p-12 text-center text-sm text-gray-500 dark:text-gray-400`}>
          Pick a staff member to see their leave balance.
        </div>
      ) : error ? (
        <QueryErrorState error={error} fallback="Could not load the balance" />
      ) : isFetching && !data ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <BalanceTable balance={data?.data} />
      )}
    </div>
  );
}
