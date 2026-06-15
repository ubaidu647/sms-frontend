'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { Plus, Users, AlertTriangle, MoreVertical, Edit2, Power } from 'lucide-react';
import AddSectionModal from './AddSectionModal';
import EditSectionModal from './EditSectionModal';
import toast from 'react-hot-toast';

function CapacityBar({ current, capacity }) {
  if (!capacity) return null;
  const pct = Math.min(Math.round((current / capacity) * 100), 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-teal-500';
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {current}/{capacity}
      </span>
      {pct >= 90 && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
    </div>
  );
}

function SectionMenu({ section, onEdit, onToggle, canUpdate, canToggle }) {
  const [open, setOpen] = useState(false);
  if (!canUpdate && !canToggle) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 w-40 text-sm">
            {canUpdate && (
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit(section);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                Edit Section
              </button>
            )}
            {canToggle && (
              <button
                onClick={() => {
                  setOpen(false);
                  onToggle(section);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${section.isActive ? 'text-red-600' : 'text-green-600'}`}
              >
                <Power className="w-3.5 h-3.5" />
                {section.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SectionsModal({ isOpen, onClose, cls }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSection, setEditSection] = useState(null);

  const isAdmin = !!user?.role?.isPredefined;
  const actions = user?.role?.actions || [];
  const canCreate =
    isAdmin || actions.includes('create-class') || actions.includes('create-all-branch-class');
  const canUpdate =
    isAdmin || actions.includes('update-class') || actions.includes('update-all-branch-class');
  const canToggle =
    isAdmin || actions.includes('delete-class') || actions.includes('delete-all-branch-class');

  const classId = cls?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId && isOpen,
    staleTime: 30000,
  });
  const sections = data?.data || [];

  const toggleMutation = useMutation({
    mutationFn: (sectionId) =>
      patchData({ url: `/class/${classId}/sections/${sectionId}/toggle-status`, token }),
    onSuccess: (res, sectionId) => {
      queryClient.setQueriesData({ queryKey: ['sections', classId] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((s) =>
            s._id === sectionId
              ? { ...s, isActive: res.data.isActive, status: res.data.status }
              : s,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['sections', classId] });
      toast.success(res?.data?.isActive ? 'Section activated' : 'Section deactivated');
    },
    onError: (err) => toast.error(err.message || 'Failed to toggle section'),
  });

  if (!cls) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Sections"
        subtitle={`${cls.name} · Grade ${cls.grade} · ${cls.academicYear}`}
        size="lg"
        footer={
          canCreate ? (
            <div className="w-full flex justify-end">
              <button
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          ) : null
        }
      >
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && !sections.length && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sections yet</p>
            {canCreate && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-3 text-teal-600 text-sm font-medium hover:underline"
              >
                + Add first section
              </button>
            )}
          </div>
        )}

        {!isLoading && sections.length > 0 && (
          <div className="space-y-3">
            {sections.map((sec) => (
              <div
                key={sec._id}
                className="flex items-start gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 hover:border-teal-200 transition-colors"
              >
                {/* Section letter avatar */}
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-teal-700 dark:text-teal-400 font-bold text-base">
                    {sec.name}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Section {sec.name}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sec.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {sec.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {sec.currentStrength / sec.capacity >= 0.9 && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:text-red-400">
                        Almost Full
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {sec.serialNumber} · {sec.academicYear}
                  </div>
                  <CapacityBar current={sec.currentStrength || 0} capacity={sec.capacity} />
                  {sec.classTeacherInfo && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Teacher:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {sec.classTeacherInfo.user?.name}
                      </span>
                      {sec.classTeacherInfo.designation && (
                        <span className="text-gray-400 dark:text-gray-500">
                          {' '}
                          · {sec.classTeacherInfo.designation}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions menu */}
                <SectionMenu
                  section={sec}
                  onEdit={setEditSection}
                  onToggle={(s) => toggleMutation.mutate(s._id)}
                  canUpdate={canUpdate}
                  canToggle={canToggle}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      <AddSectionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => setIsAddOpen(false)}
        classId={classId}
        academicYear={cls?.academicYear}
      />

      <EditSectionModal
        isOpen={!!editSection}
        onClose={() => setEditSection(null)}
        onSuccess={() => setEditSection(null)}
        classId={classId}
        section={editSection}
      />
    </>
  );
}
