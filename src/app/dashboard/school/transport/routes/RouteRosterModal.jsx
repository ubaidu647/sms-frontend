'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { currentAcademicYear, formatMoney } from '@/constants/fee';
import { ASSIGNMENT_DIRECTION_LABELS } from '@/constants/transport';

export default function RouteRosterModal({ isOpen, onClose, routeId, routeLabel }) {
  const { accessToken: token } = useTokenStore();
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const { data, isLoading } = useQuery({
    queryKey: ['route-roster', routeId, academicYear],
    queryFn: () =>
      fetchData({
        url: `/transport/route/${routeId}/roster`,
        token,
        academicYear,
      }),
    enabled: !!token && isOpen && !!routeId,
    staleTime: 30000,
  });

  const roster = data?.data || data;
  const stops = roster?.stops || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Route Roster${routeLabel ? ` — ${routeLabel}` : ''}`}
      subtitle="Students grouped by stop"
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 text-sm text-gray-900 dark:text-gray-100 w-32"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Print
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading roster...</p>
        ) : !roster ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No roster data.</p>
        ) : (
          <>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Total students:</strong> {roster.totalStudents ?? 0}
            </div>

            {stops.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No assigned students yet.</p>
            ) : (
              <div className="space-y-4">
                {stops.map((s) => (
                  <div key={s.stopName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{s.stopName}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{s.count} student(s)</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Student</th>
                          <th className="px-3 py-2 text-left font-medium">Admission #</th>
                          <th className="px-3 py-2 text-left font-medium">Roll</th>
                          <th className="px-3 py-2 text-left font-medium">Direction</th>
                          <th className="px-3 py-2 text-right font-medium">Monthly Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(s.students || []).map((p) => (
                          <tr key={p.assignmentId} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.name}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.admissionNumber}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{p.rollNumber}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                              {ASSIGNMENT_DIRECTION_LABELS[p.direction] || p.direction}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                              {formatMoney(p.monthlyFee)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
