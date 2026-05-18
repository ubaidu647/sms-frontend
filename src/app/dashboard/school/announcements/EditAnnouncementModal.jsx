'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import AudiencePicker from './AudiencePicker';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_PRIORITIES } from '@/constants/announcement';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

const blankAudience = {
  scope: 'school',
  branchIds: [],
  classIds: [],
  sectionIds: [],
  staffIds: [],
  targetUserTypes: ['staff', 'student', 'parent'],
};

const idsOf = (arr) =>
  (arr || []).map((x) => (typeof x === 'string' ? x : x?._id || '')).filter(Boolean);

const toLocalDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
};

export default function EditAnnouncementModal({ isOpen, onClose, announcement }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || !!user?.role?.actions?.includes('update-all-branch-announcement');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [audience, setAudience] = useState(blankAudience);
  const [publishedAt, setPublishedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen || !announcement) return;
    setTitle(announcement.title || '');
    setBody(announcement.body || '');
    setType(announcement.type || 'general');
    setPriority(announcement.priority || 'normal');
    const a = announcement.audience || {};
    setAudience({
      scope: a.scope || 'school',
      branchIds: idsOf(a.branchIds),
      classIds: idsOf(a.classIds),
      sectionIds: idsOf(a.sectionIds),
      staffIds: idsOf(a.staffIds),
      targetUserTypes: a.targetUserTypes?.length
        ? a.targetUserTypes
        : ['staff', 'student', 'parent'],
    });
    setPublishedAt(toLocalDateTime(announcement.publishedAt));
    setExpiresAt(toLocalDateTime(announcement.expiresAt));
    setIsPinned(!!announcement.isPinned);
    setRequiresAck(!!announcement.requiresAck);
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, announcement]);

  const mutation = useMutation({
    mutationFn: (payload) => putData({ url: `/announcement/${announcement._id}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Announcement updated');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', announcement._id] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError('');
    if (!title.trim()) return setSubmitError('Title is required');
    if (!body.trim()) return setSubmitError('Body is required');
    if (!audience.targetUserTypes?.length) return setSubmitError('Pick at least one user type');
    if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt))
      return setSubmitError('Expires must be after publish date');

    const payload = {
      title: title.trim(),
      body,
      type,
      priority,
      audience,
      isPinned,
      requiresAck,
    };
    if (publishedAt) payload.publishedAt = publishedAt;
    if (expiresAt) payload.expiresAt = expiresAt;
    mutation.mutate(payload);
  };

  if (!announcement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Announcement"
      subtitle={announcement.serialNumber || announcement.title}
      size="xl"
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
            label="Save Changes"
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
      <div className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelCls}>
              Title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Body<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {ANNOUNCEMENT_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputCls}
              >
                {ANNOUNCEMENT_PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Publish At</label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Expires At</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
              />
              Require acknowledgement
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Audience
          </h3>
          <AudiencePicker value={audience} onChange={setAudience} isOrgLevel={isOrgLevel} />
        </div>
      </div>
    </Modal>
  );
}
