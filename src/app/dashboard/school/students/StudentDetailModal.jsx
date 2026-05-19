'use client';
import React, { useRef, useState } from 'react';
import { Modal } from '@/component/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, deleteData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import toast from 'react-hot-toast';
import { Upload, Trash2, FileText, ExternalLink } from 'lucide-react';

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_DOC_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES = [
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'b_form', label: 'B-Form' },
  { value: 'previous_marks', label: 'Previous Marks' },
  { value: 'transfer_certificate', label: 'Transfer Certificate' },
  { value: 'photo_id', label: 'Photo ID' },
  { value: 'other', label: 'Other' },
];

function Row({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xs text-gray-800 dark:text-gray-200 font-medium break-words leading-tight">
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function Section({ title, children, cols = 4 }) {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols];
  return (
    <div>
      <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
        {title}
      </h3>
      <div className={`grid ${gridCols} gap-x-4 gap-y-2`}>{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    teal: 'bg-teal-100 text-teal-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${colors[color] || colors.gray}`}
    >
      {label}
    </span>
  );
}

function fmt(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusColor(status) {
  return (
    {
      enrolled: 'green',
      promoted: 'teal',
      transferred: 'blue',
      graduated: 'purple',
      dropped: 'red',
      suspended: 'yellow',
    }[status] || 'gray'
  );
}

function docTypeLabel(type) {
  return DOCUMENT_TYPES.find((d) => d.value === type)?.label || type;
}

export default function StudentDetailModal({
  isOpen,
  onClose,
  studentId,
  canManageDocuments = false,
}) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingType, setPendingType] = useState('birth_certificate');
  const [pendingFile, setPendingFile] = useState(null);
  const [docError, setDocError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => fetchData({ url: `/student/${studentId}`, token }),
    enabled: !!token && !!studentId && isOpen,
    staleTime: 30000,
  });

  const s = data?.data;

  const uploadMutation = useMutation({
    mutationFn: (payload) => postData({ url: `/student/${studentId}/documents`, payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      toast.success(res?.message || 'Document uploaded');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err) => toast.error(err.message || 'Failed to upload document'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => deleteData({ url: `/student/${studentId}/documents/${docId}`, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] });
      toast.success(res?.message || 'Document removed');
    },
    onError: (err) => toast.error(err.message || 'Failed to remove document'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setDocError('');
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setDocError(`File type not allowed (${file.type}). Allowed: jpg, png, webp, pdf`);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_DOC_SIZE) {
      setDocError('File too large (max 5 MB)');
      e.target.value = '';
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = () => {
    if (!pendingFile) {
      setDocError('Please select a file');
      return;
    }
    const fd = new FormData();
    fd.append('type', pendingType);
    fd.append('document', pendingFile);
    uploadMutation.mutate(fd);
  };

  const name = s?.user?.name || '';
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Details"
      subtitle={s ? `${s.user?.name} · ${s.admissionNumber}` : 'Loading…'}
      size="xl"
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && s && (
        <div className="space-y-4">
          {/* Identity header */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100">
            <div className="relative flex-shrink-0">
              {s.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-teal-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-24 h-24 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-bold text-2xl items-center justify-center border-4 border-white shadow-md ring-2 ring-teal-200"
                style={{ display: s.photo ? 'none' : 'flex' }}
              >
                {initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {s.user?.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {s.class?.name}
                {s.section?.name ? ` / ${s.section.name}` : ''} · {s.academicYear}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s.admissionNumber} · Roll {s.rollNumber} · {s.user?.email}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  label={s.isActive ? 'Active' : 'Blocked'}
                  color={s.isActive ? 'green' : 'red'}
                />
                {s.academicStatus && (
                  <Badge label={s.academicStatus} color={statusColor(s.academicStatus)} />
                )}
                {s.admissionType && <Badge label={`${s.admissionType} admission`} color="blue" />}
                {s.feeWaiver && <Badge label="Fee Waived" color="purple" />}
                {!s.feeWaiver && s.feeDiscount > 0 && (
                  <Badge label={`${s.feeDiscount}% discount`} color="teal" />
                )}
              </div>
            </div>
          </div>

          {/* Enrollment */}
          <Section title="Enrollment">
            <Row label="Class" value={s.class?.name} />
            <Row label="Section" value={s.section?.name} />
            <Row label="Academic Year" value={s.academicYear} />
            <Row label="Branch" value={s.branch?.name} />
            <Row label="Admission Date" value={fmt(s.admissionDate)} />
            <Row
              label="Admission Type"
              value={
                s.admissionType
                  ? s.admissionType.charAt(0).toUpperCase() + s.admissionType.slice(1)
                  : null
              }
            />
            <Row
              label="Section Capacity"
              value={s.section ? `${s.section.currentStrength}/${s.section.capacity}` : null}
            />
            <Row label="Class Medium" value={s.class?.medium} />
          </Section>

          {/* Personal */}
          <Section title="Personal">
            <Row label="Date of Birth" value={fmt(s.dob)} />
            <Row
              label="Gender"
              value={s.gender ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1) : null}
            />
            <Row label="Blood Group" value={s.bloodGroup} />
            <Row label="Nationality" value={s.nationality} />
            <Row label="Religion" value={s.religion} />
            <Row label="B-Form" value={s.bForm} />
            <Row label="Place of Birth" value={s.placeOfBirth} />
            <Row label="Phone" value={s.phone} />
          </Section>

          {/* Father */}
          {s.father && (
            <Section title="Father" cols={3}>
              <Row label="Name" value={s.father.name} />
              <Row label="CNIC" value={s.father.cnic} />
              <Row label="Phone" value={s.father.phone} />
              <Row label="Email" value={s.father.email} />
              <Row label="Occupation" value={s.father.occupation} />
              <Row
                label="Monthly Income"
                value={
                  s.father.monthlyIncome != null
                    ? `PKR ${Number(s.father.monthlyIncome).toLocaleString()}`
                    : null
                }
              />
            </Section>
          )}

          {/* Mother */}
          {s.mother && (
            <Section title="Mother" cols={3}>
              <Row label="Name" value={s.mother.name} />
              <Row label="CNIC" value={s.mother.cnic} />
              <Row label="Phone" value={s.mother.phone} />
              <Row label="Occupation" value={s.mother.occupation} />
            </Section>
          )}

          {/* Guardian (if separate) */}
          {s.guardian && (
            <Section title="Guardian" cols={3}>
              <Row label="Name" value={s.guardian.name} />
              <Row label="Phone" value={s.guardian.phone} />
              <Row label="Relation" value={s.guardian.relation} />
              <Row label="CNIC" value={s.guardian.cnic} />
              <Row label="Occupation" value={s.guardian.occupation} />
            </Section>
          )}

          {/* Address & Emergency */}
          {(s.address || s.emergencyContact) && (
            <div className="grid grid-cols-2 gap-4">
              {s.address && (
                <Section title="Address" cols={2}>
                  <Row label="Street" value={s.address.street} className="col-span-2" />
                  <Row label="City" value={s.address.city} />
                  <Row label="State" value={s.address.state} />
                  <Row label="Postal Code" value={s.address.postalCode} />
                  <Row label="Country" value={s.address.country} />
                </Section>
              )}

              {s.emergencyContact && (
                <Section title="Emergency Contact" cols={2}>
                  <Row label="Name" value={s.emergencyContact.name} className="col-span-2" />
                  <Row label="Phone" value={s.emergencyContact.phone} />
                  <Row label="Relation" value={s.emergencyContact.relation} />
                </Section>
              )}
            </div>
          )}

          {/* Permanent Address */}
          {s.permanentAddress && (
            <Section title="Permanent Address" cols={3}>
              <Row label="Street" value={s.permanentAddress.street} className="col-span-3" />
              <Row label="City" value={s.permanentAddress.city} />
              <Row label="State" value={s.permanentAddress.state} />
              <Row label="Country" value={s.permanentAddress.country} />
            </Section>
          )}

          {/* Previous School */}
          {s.previousSchool && (
            <Section title="Previous School" cols={3}>
              <Row label="Name" value={s.previousSchool.name} />
              <Row label="Last Class" value={s.previousSchool.lastClass} />
              <Row label="Reason for Leaving" value={s.previousSchool.reasonForLeaving} />
            </Section>
          )}

          {/* Fees */}
          {(s.feeDiscount != null || s.feeWaiver != null || s.feeNotes) && (
            <Section title="Fees" cols={3}>
              <Row label="Discount" value={s.feeDiscount != null ? `${s.feeDiscount}%` : null} />
              <Row label="Full Waiver" value={s.feeWaiver ? 'Yes' : 'No'} />
              <Row label="Notes" value={s.feeNotes} />
            </Section>
          )}

          {/* Documents */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
              Documents
            </h3>

            {canManageDocuments && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">
                    Type
                  </label>
                  <select
                    value={pendingType}
                    onChange={(e) => setPendingType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:border-teal-500"
                  >
                    {DOCUMENT_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="block text-xs text-gray-700 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending || !pendingFile}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
                </button>
                {docError && <p className="w-full text-red-500 text-xs">{docError}</p>}
              </div>
            )}

            {!s.documents || s.documents.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">
                No documents uploaded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {s.documents.map((doc) => (
                  <li
                    key={doc._id}
                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {docTypeLabel(doc.type)}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {fmt(doc.uploadedAt)}
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                    {canManageDocuments && (
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this document?')) {
                            deleteDocMutation.mutate(doc._id);
                          }
                        }}
                        disabled={deleteDocMutation.isPending}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Meta */}
          <Section title="Record">
            <Row label="Serial Number" value={s.serialNumber} />
            <Row label="User Serial" value={s.user?.serialNumber} />
            <Row label="Created" value={fmt(s.createdAt)} />
            <Row label="Updated" value={fmt(s.updatedAt)} />
          </Section>
        </div>
      )}
    </Modal>
  );
}
