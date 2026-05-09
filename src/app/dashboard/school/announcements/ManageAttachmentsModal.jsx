'use client';
import React, { useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { Paperclip, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { postData, deleteData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatBytes, validateFile } from '@/constants/announcement';

export default function ManageAttachmentsModal({ isOpen, onClose, announcement }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const id = announcement?._id;
  const [file, setFile] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: async () => (await apiClient.get(`/announcement/${id}`)).data,
    enabled: !!token && isOpen && !!id,
  });

  const a = data?.data;
  const attachments = a?.attachments || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  };

  const addMutation = useMutation({
    mutationFn: (fd) =>
      postData({ url: `/announcement/${id}/attachments`, payload: fd, token }),
    onSuccess: () => {
      toast.success('Attachment added');
      setFile(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to upload'),
  });

  const removeMutation = useMutation({
    mutationFn: (attachmentId) =>
      deleteData({ url: `/announcement/${id}/attachments/${attachmentId}`, token }),
    onSuccess: () => {
      toast.success('Attachment removed');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to remove'),
  });

  const handleUpload = () => {
    if (!file) return toast.error('Pick a file first');
    const err = validateFile(file);
    if (err) return toast.error(err);
    const fd = new FormData();
    fd.append('attachment', file);
    addMutation.mutate(fd);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Attachments"
      subtitle={announcement?.title}
      size="md"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button
            label="Done"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
            Add New
          </h4>
          {file ? (
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
              <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                <Paperclip className="w-4 h-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({formatBytes(file.size)})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
                <Button
                  label="Upload"
                  loading={addMutation.isPending}
                  handleClick={handleUpload}
                  type="button"
                  styleObject={{
                    baseColor: 'bg-teal-600',
                    hoverColor: 'hover:bg-teal-700',
                    rounded: 'rounded-full',
                    size: 'px-4 py-1.5 text-xs',
                    textColor: 'text-white',
                  }}
                />
              </div>
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

        <div>
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
            Existing ({attachments.length})
          </h4>
          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No attachments yet.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((att) => (
                <li
                  key={att._id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
                    >
                      {att.name}
                    </a>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(att.size)}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(att._id)}
                    disabled={removeMutation.isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
