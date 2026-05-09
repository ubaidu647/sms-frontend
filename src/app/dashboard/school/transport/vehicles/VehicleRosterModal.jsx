'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { currentAcademicYear, formatMoney } from '@/constants/fee';
import { ASSIGNMENT_DIRECTION_LABELS } from '@/constants/transport';

export default function VehicleRosterModal({ isOpen, onClose, vehicleId, vehicleLabel }) {
  const { accessToken: token } = useTokenStore();
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-roster', vehicleId, academicYear],
    queryFn: () =>
      fetchData({
        url: `/transport/vehicle/${vehicleId}/roster`,
        token,
        academicYear,
      }),
    enabled: !!token && isOpen && !!vehicleId,
    staleTime: 30000,
  });

  const roster = data?.data || data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vehicle Roster${vehicleLabel ? ` — ${vehicleLabel}` : ''}`}
      subtitle="Current passengers and capacity"
      size="lg"
    >
      <div className="space-y-4">
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

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading roster...</p>
        ) : !roster ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No roster data.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Capacity" value={roster.capacity} tone="bg-gray-100 text-gray-800" />
              <Stat label="Occupied" value={roster.occupied} tone="bg-teal-100 text-teal-800" />
              <Stat
                label="Available"
                value={roster.available}
                tone={
                  roster.available === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Student</th>
                    <th className="px-3 py-2 text-left">Admission #</th>
                    <th className="px-3 py-2 text-left">Stop</th>
                    <th className="px-3 py-2 text-left">Direction</th>
                    <th className="px-3 py-2 text-right">Monthly Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {(roster.passengers || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                        No passengers yet.
                      </td>
                    </tr>
                  ) : (
                    roster.passengers.map((p) => (
                      <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {p.studentId?.user?.name || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {p.studentId?.admissionNumber || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{p.stopName}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                          {ASSIGNMENT_DIRECTION_LABELS[p.direction] || p.direction}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                          {formatMoney(p.monthlyFee)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`rounded-lg ${tone} p-4 text-center`}>
      <div className="text-2xl font-bold">{value ?? 0}</div>
      <div className="text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}
