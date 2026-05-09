'use client';
import React, { useState, useEffect } from 'react';
import { Upload, X, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatBytes, validateFile } from '@/constants/branchProfile';

export default function ImageUploadCard({
  label,
  field,
  current,
  pendingFile,
  onPick,
  canDelete,
  onDeleted,
  hint,
}) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const removeMutation = useMutation({
    mutationFn: () => deleteData({ url: `/branch-profile/image/${field}`, token }),
    onSuccess: () => {
      toast.success(`${label} removed`);
      queryClient.invalidateQueries({ queryKey: ['branch-profile'] });
      queryClient.invalidateQueries({ queryKey: ['branch-profiles-list'] });
      onDeleted?.();
    },
    onError: (err) => toast.error(err.message || 'Failed to remove'),
  });

  const src = previewUrl || current;
  const isPdf =
    pendingFile?.type === 'application/pdf' ||
    (typeof current === 'string' && current.toLowerCase().endsWith('.pdf'));

  const handlePick = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const err = validateFile(file);
      if (err) {
        toast.error(err);
        e.target.value = '';
        return;
      }
    }
    onPick(file);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</div>
        {pendingFile && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            New · {formatBytes(pendingFile.size)}
          </span>
        )}
      </div>

      <div className="aspect-[3/2] rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-3">
        {src ? (
          isPdf ? (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-teal-700 dark:text-teal-400"
            >
              <FileText className="w-8 h-8" />
              <span className="text-xs">View PDF</span>
            </a>
          ) : (
            <img
              src={src}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          )
        ) : (
          <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
            <Upload className="w-8 h-8 mb-1" />
            <span className="text-xs">No {label.toLowerCase()} uploaded</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">
          <Upload className="w-3.5 h-3.5" />
          {pendingFile ? 'Pick another' : src ? 'Replace' : 'Upload'}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handlePick}
          />
        </label>

        {pendingFile && (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}

        {canDelete && current && !pendingFile && (
          <button
            type="button"
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {removeMutation.isPending ? 'Removing...' : 'Remove from server'}
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}
