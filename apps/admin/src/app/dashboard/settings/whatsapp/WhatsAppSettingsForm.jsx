'use client';
import React, { useMemo, useState } from 'react';
import {
  MessageCircle,
  ShieldCheck,
  Plug,
  PlugZap,
  Save,
  Info,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Switch from '@/component/Switch';
import { useWhatsAppSession } from './hooks';
import ConnectModal from './ConnectModal';

// Status keys the backend accepts under modules.attendance.statuses.
const ATTENDANCE_STATUSES = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
  { key: 'leave', label: 'Leave' },
  { key: 'half-day', label: 'Half Day' },
  { key: 'holiday', label: 'Holiday' },
];

const PLACEHOLDERS = '{studentName} · {date} · {status} · {arrivalTime} · {branchName}';

const STATUS_BADGE = {
  connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  connecting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  disconnected: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'logged-out': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

// Merge a (possibly null/partial) settings doc onto safe defaults.
function toFormState(s) {
  const o = s || {};
  const antiBan = o.unofficial?.antiBan || {};
  const wh = antiBan.workingHours || {};
  const warmup = antiBan.warmup || {};
  const statuses = o.modules?.attendance?.statuses || {};
  return {
    enabled: !!o.enabled,
    provider: o.provider || 'unofficial',
    senderNumber: o.senderNumber || '',
    official: {
      phoneNumberId: o.official?.phoneNumberId || '',
      wabaId: o.official?.wabaId || '',
      accessToken: o.official?.accessToken || '',
      apiVersion: o.official?.apiVersion || 'v21.0',
    },
    antiBan: {
      minDelayMs: antiBan.minDelayMs ?? 5000,
      maxDelayMs: antiBan.maxDelayMs ?? 15000,
      perMinuteLimit: antiBan.perMinuteLimit ?? 10,
      dailyLimit: antiBan.dailyLimit ?? 150,
      workingHours: { start: wh.start || '08:00', end: wh.end || '20:00' },
      warmup: {
        enabled: !!warmup.enabled,
        startLimit: warmup.startLimit ?? 20,
        dailyIncrement: warmup.dailyIncrement ?? 10,
      },
    },
    attendanceEnabled: !!o.modules?.attendance?.enabled,
    statuses: ATTENDANCE_STATUSES.reduce((acc, { key }) => {
      acc[key] = {
        enabled: !!statuses[key]?.enabled,
        template: statuses[key]?.template || '',
      };
      return acc;
    }, {}),
  };
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

// Static class strings so Tailwind's purge keeps them (no dynamic interpolation).
const ACCENTS = {
  teal: 'bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
  blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300',
};

const Card = ({ icon: Icon, title, subtitle, accent = 'teal', right, children }) => (
  <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
      <span
        className={`inline-flex w-9 h-9 rounded-xl items-center justify-center ${ACCENTS[accent] || ACCENTS.teal}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {right}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export default function WhatsAppSettingsForm({
  settings,
  branchId,
  filterBranchId,
  requiresBranch = false,
  canEdit,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(() => toFormState(settings));
  const [showConnect, setShowConnect] = useState(false);

  // Org admins must have picked a branch before the session can act on one.
  const sessionEnabled = form.provider === 'unofficial' && (!requiresBranch || !!branchId);
  const session = useWhatsAppSession({
    branchId,
    filterBranchId: filterBranchId || branchId,
    enabled: sessionEnabled,
  });

  // Prefer the live session status; fall back to the persisted snapshot.
  const sessionStatus = session.status || settings?.unofficial?.session?.status || 'disconnected';
  const connectedNumber =
    session.connectedNumber || settings?.unofficial?.session?.connectedNumber || '';

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setOfficial = (patch) => setForm((f) => ({ ...f, official: { ...f.official, ...patch } }));
  const setAntiBan = (patch) => setForm((f) => ({ ...f, antiBan: { ...f.antiBan, ...patch } }));
  const setStatus = (key, patch) =>
    setForm((f) => ({
      ...f,
      statuses: { ...f.statuses, [key]: { ...f.statuses[key], ...patch } },
    }));

  const validationError = useMemo(() => {
    if (form.senderNumber && !/^\d+$/.test(form.senderNumber))
      return 'Sender number must be digits only (e.g. 923001234567).';
    if (Number(form.antiBan.minDelayMs) > Number(form.antiBan.maxDelayMs))
      return 'Min delay cannot be greater than max delay.';
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!hhmm.test(form.antiBan.workingHours.start) || !hhmm.test(form.antiBan.workingHours.end))
      return 'Working hours must be in HH:mm (24h) format.';
    return null;
  }, [form]);

  const buildPayload = () => {
    const payload = {
      enabled: form.enabled,
      provider: form.provider,
      senderNumber: form.senderNumber,
      modules: {
        attendance: {
          enabled: form.attendanceEnabled,
          statuses: Object.fromEntries(
            Object.entries(form.statuses).map(([k, v]) => [
              k,
              { enabled: v.enabled, template: v.template },
            ]),
          ),
        },
      },
    };
    if (form.provider === 'official') {
      payload.official = { ...form.official };
    } else {
      // Never send unofficial.session — that's owned by the backend.
      payload.unofficial = {
        antiBan: {
          minDelayMs: Number(form.antiBan.minDelayMs),
          maxDelayMs: Number(form.antiBan.maxDelayMs),
          perMinuteLimit: Number(form.antiBan.perMinuteLimit),
          dailyLimit: Number(form.antiBan.dailyLimit),
          workingHours: { ...form.antiBan.workingHours },
          warmup: {
            enabled: form.antiBan.warmup.enabled,
            startLimit: Number(form.antiBan.warmup.startLimit),
            dailyIncrement: Number(form.antiBan.warmup.dailyIncrement),
          },
        },
      };
    }
    if (branchId) payload.branchId = branchId;
    return payload;
  };

  const handleSave = () => {
    if (validationError) return;
    onSave(buildPayload());
  };

  const disabled = !canEdit;

  return (
    <div className="space-y-5">
      {/* Master toggle + provider */}
      <Card
        icon={MessageCircle}
        title="WhatsApp Notifications"
        subtitle="Send attendance alerts to parents over WhatsApp"
        right={
          <Switch
            checked={form.enabled}
            onChange={(v) => set({ enabled: v })}
            disabled={disabled}
            srLabel="Enable WhatsApp notifications"
          />
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className={labelCls}>Provider</span>
            <div className="flex flex-col gap-2">
              {[
                { id: 'official', label: 'Official (Meta Cloud API, paid)', comingSoon: true },
                { id: 'unofficial', label: 'Unofficial (Baileys / QR, free)' },
              ].map((p) => {
                const locked = p.comingSoon; // Official path isn't available yet.
                const isDisabled = disabled || locked;
                const selectable = !isDisabled;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      form.provider === p.id
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p.id}
                      checked={form.provider === p.id}
                      onChange={() => selectable && set({ provider: p.id })}
                      disabled={isDisabled}
                      className="accent-teal-600"
                    />
                    <span className="text-gray-800 dark:text-gray-200">{p.label}</span>
                    {locked && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" /> Coming soon
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="senderNumber">
              Sender number
            </label>
            <input
              id="senderNumber"
              className={inputCls}
              placeholder="923001234567"
              value={form.senderNumber}
              onChange={(e) => set({ senderNumber: e.target.value.replace(/\s/g, '') })}
              disabled={disabled}
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-gray-400">Digits only, international format.</p>
          </div>
        </div>
      </Card>

      {/* Provider-specific */}
      {form.provider === 'official' ? (
        <Card
          icon={Plug}
          title="Official API credentials"
          subtitle="From your Meta WhatsApp Business account"
          accent="indigo"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Phone Number ID</label>
              <input
                className={inputCls}
                value={form.official.phoneNumberId}
                onChange={(e) => setOfficial({ phoneNumberId: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelCls}>WABA ID</label>
              <input
                className={inputCls}
                value={form.official.wabaId}
                onChange={(e) => setOfficial({ wabaId: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Access Token</label>
              <input
                className={inputCls}
                type="password"
                value={form.official.accessToken}
                onChange={(e) => setOfficial({ accessToken: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelCls}>API Version</label>
              <input
                className={inputCls}
                value={form.official.apiVersion}
                onChange={(e) => setOfficial({ apiVersion: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card
          icon={PlugZap}
          title="Device connection"
          subtitle="Link the sender phone by scanning a QR code"
          accent="emerald"
          right={
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                STATUS_BADGE[sessionStatus] || STATUS_BADGE.disconnected
              }`}
            >
              {sessionStatus}
              {sessionStatus === 'connected' && connectedNumber ? ` · ${connectedNumber}` : ''}
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            {sessionStatus === 'connected' ? (
              <button
                type="button"
                onClick={session.logout}
                disabled={disabled}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowConnect(true);
                  session.connect();
                }}
                disabled={disabled}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                Connect WhatsApp
              </button>
            )}
            {sessionStatus === 'logged-out' && (
              <span className="text-xs text-gray-400">Session ended — reconnect to resume.</span>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            An unofficial connection can get a number banned. Use a dedicated number, not a personal
            one.
          </div>

          {/* Anti-ban */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> Anti-ban controls
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelCls}>Min delay (ms)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.antiBan.minDelayMs}
                  onChange={(e) => setAntiBan({ minDelayMs: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelCls}>Max delay (ms)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.antiBan.maxDelayMs}
                  onChange={(e) => setAntiBan({ maxDelayMs: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelCls}>Per-minute limit</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.antiBan.perMinuteLimit}
                  onChange={(e) => setAntiBan({ perMinuteLimit: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelCls}>Daily limit</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.antiBan.dailyLimit}
                  onChange={(e) => setAntiBan({ dailyLimit: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelCls}>Working hours start</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.antiBan.workingHours.start}
                  onChange={(e) =>
                    setAntiBan({
                      workingHours: { ...form.antiBan.workingHours, start: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div>
                <label className={labelCls}>Working hours end</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.antiBan.workingHours.end}
                  onChange={(e) =>
                    setAntiBan({
                      workingHours: { ...form.antiBan.workingHours, end: e.target.value },
                    })
                  }
                  disabled={disabled}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Switch
                    checked={form.antiBan.warmup.enabled}
                    onChange={(v) => setAntiBan({ warmup: { ...form.antiBan.warmup, enabled: v } })}
                    disabled={disabled}
                  />
                  Warm-up new number
                </label>
                {form.antiBan.warmup.enabled && (
                  <>
                    <div>
                      <label className={labelCls}>Start limit</label>
                      <input
                        type="number"
                        className={`${inputCls} w-32`}
                        value={form.antiBan.warmup.startLimit}
                        onChange={(e) =>
                          setAntiBan({
                            warmup: { ...form.antiBan.warmup, startLimit: e.target.value },
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Daily increment</label>
                      <input
                        type="number"
                        className={`${inputCls} w-32`}
                        value={form.antiBan.warmup.dailyIncrement}
                        onChange={(e) =>
                          setAntiBan({
                            warmup: { ...form.antiBan.warmup, dailyIncrement: e.target.value },
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Attendance module */}
      <Card
        icon={MessageCircle}
        title="Attendance notifications"
        subtitle="Which attendance outcomes trigger a WhatsApp message"
        accent="blue"
        right={
          <Switch
            checked={form.attendanceEnabled}
            onChange={(v) => set({ attendanceEnabled: v })}
            disabled={disabled}
            srLabel="Enable attendance notifications"
          />
        }
      >
        <div className="flex items-start gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Leave a template blank to use the backend default. Placeholders: {PLACEHOLDERS}
          </span>
        </div>
        <div className="space-y-3">
          {ATTENDANCE_STATUSES.map(({ key, label }) => {
            const st = form.statuses[key];
            return (
              <div key={key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {label}
                  </span>
                  <Switch
                    checked={st.enabled}
                    onChange={(v) => setStatus(key, { enabled: v })}
                    disabled={disabled || !form.attendanceEnabled}
                    srLabel={`Notify on ${label}`}
                  />
                </div>
                {st.enabled && (
                  <textarea
                    className={`${inputCls} mt-2 resize-y`}
                    rows={2}
                    placeholder={`Dear Parent, {studentName} is marked ${label.toLowerCase()} on {date}.`}
                    value={st.template}
                    onChange={(e) => setStatus(key, { template: e.target.value })}
                    disabled={disabled || !form.attendanceEnabled}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Save */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3 sticky bottom-0 py-3">
          {validationError && <span className="text-xs text-red-500">{validationError}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!validationError}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      )}

      <ConnectModal
        isOpen={showConnect}
        onClose={() => setShowConnect(false)}
        status={session.status}
        qr={session.qr}
        connectedNumber={session.connectedNumber}
        connecting={session.connecting}
        error={session.error}
        onRetry={session.connect}
      />
    </div>
  );
}
