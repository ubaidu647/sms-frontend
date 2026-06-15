'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import AudiencePicker from './AudiencePicker';
import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  formatBytes,
  validateFile,
} from '@/constants/announcement';

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

export default function ComposeAnnouncementModal({ isOpen, onClose }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || !!user?.role?.actions?.includes('create-all-branch-announcement');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [audience, setAudience] = useState(blankAudience);
  const [publishedAt, setPublishedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [statusChoice, setStatusChoice] = useState('published');
  const [file, setFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setBody('');
      setType('general');
      setPriority('normal');
      setAudience(blankAudience);
      setPublishedAt('');
      setExpiresAt('');
      setIsPinned(false);
      setRequiresAck(false);
      setStatusChoice('published');
      setFile(null);
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (formData) => postData({ url: '/announcement/create', payload: formData, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Announcement created');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create announcement';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!body.trim()) return 'Body is required';
    if (!audience.targetUserTypes?.length) return 'Pick at least one user type';
    if (audience.scope === 'branch' && !audience.branchIds?.length)
      return 'Pick at least one branch';
    if (audience.scope === 'class' && !audience.classIds?.length) return 'Pick at least one class';
    if (audience.scope === 'section' && !audience.sectionIds?.length)
      return 'Pick at least one section';
    if (audience.scope === 'staff' && !audience.staffIds?.length)
      return 'Pick at least one staff member';
    if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt))
      return 'Expires must be after publish date';
    if (file) {
      const err = validateFile(file);
      if (err) return err;
    }
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

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('body', body);
    fd.append('type', type);
    fd.append('priority', priority);
    fd.append('status', statusChoice);
    fd.append('audience', JSON.stringify(audience));
    if (publishedAt) fd.append('publishedAt', publishedAt);
    if (expiresAt) fd.append('expiresAt', expiresAt);
    if (isPinned) fd.append('isPinned', 'true');
    if (requiresAck) fd.append('requiresAck', 'true');
    if (file) fd.append('attachment', file);

    mutation.mutate(fd);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Announcement"
      subtitle="Reach the right audience — school-wide, a class, sections, or specific staff"
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
            label={statusChoice === 'draft' ? 'Save Draft' : 'Publish'}
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
              placeholder="e.g. School closed on Friday"
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
              placeholder="Write the announcement…"
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Defaults to now if you publish.
              </p>
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
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="status"
                checked={statusChoice === 'draft'}
                onChange={() => setStatusChoice('draft')}
              />
              Save as draft
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="status"
                checked={statusChoice === 'published'}
                onChange={() => setStatusChoice('published')}
              />
              Publish now
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Audience
          </h3>
          <AudiencePicker value={audience} onChange={setAudience} isOrgLevel={isOrgLevel} />
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Attachment (optional)
          </h3>
          {file ? (
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
              <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                <Paperclip className="w-4 h-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({formatBytes(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
              <Paperclip className="w-4 h-4" />
              <span>Attach file (jpg / png / webp / pdf, max 5MB)</span>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f) {
                    const err = validateFile(f);
                    if (err) {
                      toast.error(err);
                      return;
                    }
                  }
                  setFile(f);
                }}
              />
            </label>
          )}
        </div>
      </div>
    </Modal>
  );
}
