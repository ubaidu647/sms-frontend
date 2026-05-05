'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import Button from '@/component/Button';
import ImageUploadCard from './ImageUploadCard';
import {
  SOCIAL_NETWORKS,
  buildUpsertFormData,
  validateProfile,
} from '@/constants/branchProfile';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

const blank = {
  displayName: '',
  tagline: '',
  printAddress: '',
  printPhone: '',
  printEmail: '',
  website: '',
  primaryColor: '',
  secondaryColor: '',
  registrationNumber: '',
  taxId: '',
  status: 'active',
  principal: { name: '', designation: 'Principal', email: '', phone: '' },
  socialLinks: {},
};

export default function BranchProfileForm({
  initialProfile,
  branchLabel,
  branchId,
  onSaved,
}) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState(blank);
  const [files, setFiles] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  const acts = user?.role?.actions || [];
  const canEdit =
    isAdmin ||
    acts.includes('update-branch-profile') ||
    acts.includes('create-branch-profile') ||
    acts.includes('update-all-branch-profile') ||
    acts.includes('create-all-branch-profile');

  useEffect(() => {
    if (initialProfile) {
      setProfile({
        ...blank,
        ...initialProfile,
        principal: { ...blank.principal, ...(initialProfile.principal || {}) },
        socialLinks: { ...(initialProfile.socialLinks || {}) },
      });
    } else {
      setProfile(blank);
    }
    setFiles({});
    setSubmitError('');
    setSuccessState(false);
  }, [initialProfile]);

  const set = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const setPrincipal = (patch) =>
    setProfile((p) => ({ ...p, principal: { ...p.principal, ...patch } }));
  const setSocial = (key, value) =>
    setProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: value } }));

  const mutation = useMutation({
    mutationFn: (fd) => postData({ url: '/branch-profile/upsert', payload: fd, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Profile saved');
      queryClient.invalidateQueries({ queryKey: ['branch-profile'] });
      queryClient.invalidateQueries({ queryKey: ['branch-profiles-list'] });
      setFiles({});
      setSuccessState(true);
      setTimeout(() => setSuccessState(false), 700);
      onSaved?.(res?.data);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save profile';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setSubmitError('');
    const err = validateProfile(profile);
    if (err) {
      setSubmitError(err);
      toast.error(err);
      return;
    }
    const fd = buildUpsertFormData(profile, files, branchId);
    mutation.mutate(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {submitError}
        </div>
      )}

      {branchLabel && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-800">
          Editing profile for <strong>{branchLabel}</strong>
        </div>
      )}

      <Section title="Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Display Name" required>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => set({ displayName: e.target.value })}
              placeholder="e.g. Hogwarts School — Karachi Campus"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Tagline">
            <input
              type="text"
              value={profile.tagline || ''}
              onChange={(e) => set({ tagline: e.target.value })}
              placeholder="Excellence in Education"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Status">
            <select
              value={profile.status || 'active'}
              onChange={(e) => set({ status: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Branding">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadCard
            label="Logo"
            field="logo"
            current={profile.logo}
            pendingFile={files.logo}
            onPick={(f) => setFiles((s) => ({ ...s, logo: f }))}
            canDelete={canEdit && !!profile._id && !branchId}
            onDeleted={() => set({ logo: null })}
            hint="Square or wide; max 5MB."
          />
          <ImageUploadCard
            label="Stamp"
            field="stamp"
            current={profile.stamp}
            pendingFile={files.stamp}
            onPick={(f) => setFiles((s) => ({ ...s, stamp: f }))}
            canDelete={canEdit && !!profile._id && !branchId}
            onDeleted={() => set({ stamp: null })}
            hint="Used as the official stamp on printed reports."
          />
          <ImageUploadCard
            label="Letterhead"
            field="letterhead"
            current={profile.letterhead}
            pendingFile={files.letterhead}
            onPick={(f) => setFiles((s) => ({ ...s, letterhead: f }))}
            canDelete={canEdit && !!profile._id && !branchId}
            onDeleted={() => set({ letterhead: null })}
            hint="Wide banner image used at the top of letters."
          />
          <ImageUploadCard
            label="Principal Signature"
            field="signature"
            current={profile.principal?.signature}
            pendingFile={files.signature}
            onPick={(f) => setFiles((s) => ({ ...s, signature: f }))}
            canDelete={canEdit && !!profile._id && !branchId}
            onDeleted={() =>
              setProfile((p) => ({
                ...p,
                principal: { ...p.principal, signature: null },
              }))
            }
            hint="Goes in the report footer above the principal's name."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <ColorField
            label="Primary Color"
            value={profile.primaryColor || ''}
            onChange={(v) => set({ primaryColor: v })}
            disabled={!canEdit}
          />
          <ColorField
            label="Secondary Color"
            value={profile.secondaryColor || ''}
            onChange={(v) => set({ secondaryColor: v })}
            disabled={!canEdit}
          />
        </div>
      </Section>

      <Section title="Contact (printed on reports)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Print Address" full>
            <textarea
              rows={3}
              value={profile.printAddress || ''}
              onChange={(e) => set({ printAddress: e.target.value })}
              placeholder="Street, area, city — multiline supported"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={profile.printPhone || ''}
              onChange={(e) => set({ printPhone: e.target.value })}
              placeholder="+92-21-1234-5678"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.printEmail || ''}
              onChange={(e) => set({ printEmail: e.target.value })}
              placeholder="info@school.edu"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              value={profile.website || ''}
              onChange={(e) => set({ website: e.target.value })}
              placeholder="https://school.edu"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
        </div>
      </Section>

      <Section title="Principal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              type="text"
              value={profile.principal?.name || ''}
              onChange={(e) => setPrincipal({ name: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Designation">
            <input
              type="text"
              value={profile.principal?.designation || ''}
              onChange={(e) => setPrincipal({ designation: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={profile.principal?.email || ''}
              onChange={(e) => setPrincipal({ email: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Phone">
            <input
              type="text"
              value={profile.principal?.phone || ''}
              onChange={(e) => setPrincipal({ phone: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
        </div>
      </Section>

      <Section title="Legal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Registration #">
            <input
              type="text"
              value={profile.registrationNumber || ''}
              onChange={(e) => set({ registrationNumber: e.target.value })}
              placeholder="REG-2020-1234"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Tax ID">
            <input
              type="text"
              value={profile.taxId || ''}
              onChange={(e) => set({ taxId: e.target.value })}
              placeholder="NTN-1234567"
              className={inputCls}
              disabled={!canEdit}
            />
          </Field>
        </div>
      </Section>

      <Section title="Social Links">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOCIAL_NETWORKS.map((net) => (
            <Field key={net} label={net.charAt(0).toUpperCase() + net.slice(1)}>
              <input
                type="url"
                value={profile.socialLinks?.[net] || ''}
                onChange={(e) => setSocial(net, e.target.value)}
                placeholder={`https://${net}.com/yourschool`}
                className={inputCls}
                disabled={!canEdit}
              />
            </Field>
          ))}
        </div>
      </Section>

      {canEdit && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            label="Save Profile"
            type="submit"
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      )}
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, required, children, full }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-12 h-10 rounded-lg border border-gray-200 bg-white cursor-pointer disabled:opacity-50"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0066cc"
          disabled={disabled}
          className={inputCls}
        />
      </div>
    </div>
  );
}
