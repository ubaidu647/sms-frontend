"use client";
// Public admission enquiry form — reachable without login. Uses a bare axios
// instance (no cookies, no session headers, no token-refresh interceptor).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Send,
} from "lucide-react";
import {
  EMPTY_FORM,
  RELATIONS,
  NAME_MAX,
  SCHOOL_MAX,
  CLASS_MAX,
  EMAIL_MAX,
  ADDRESS_MAX,
  NOTES_MAX,
  localYMD,
  validateApplyForm,
  buildApplyPayload,
  applyErrorMessage,
  elapsedMs,
  applyResult,
} from "@/utils/applyForm";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api",
  withCredentials: false,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Monotonic where available so a clock change mid-form can't skew fillMs.
const monoNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const inputCls = (hasError) =>
  `w-full min-h-11 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] border outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-4 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
      : "border-gray-200 dark:border-[#2a2a2a] focus:border-[#00918e] focus:ring-[#00918e]/15"
  }`;

function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
      >
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen bg-[rgb(246,246,246)] dark:bg-[#0a0a0a] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        {children}
        <p className="mt-8 text-center text-sm text-gray-500">
          Already a parent at this school?{" "}
          <Link href="/signin" className="text-[#00918e] hover:underline">
            Parent sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5 sm:p-8">
      {children}
    </div>
  );
}

export default function ApplyPage() {
  const params = useParams();
  const key = typeof params?.key === "string" ? params.key : "";

  const [info, setInfo] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | missing | error
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const startedAt = useRef(0);
  const startedMono = useRef(0);
  const inFlight = useRef(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    startedMono.current = monoNow();
  }, []);

  useEffect(() => {
    if (!key) {
      setLoadState("missing");
      return;
    }
    let cancelled = false;
    setLoadState("loading");
    publicApi
      .get(`/public/admission/${encodeURIComponent(key)}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? {};
        setInfo(data);
        setLoadState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 404) setLoadState("missing");
        else {
          setLoadError(applyErrorMessage(err));
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, reloadTick]);

  const grades = Array.isArray(info?.grades) ? info.grades : [];

  const set = (name) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current || result) return;
    setSubmitError("");
    const v = validateApplyForm(form, { grades });
    setErrors(v.errors);
    if (!v.valid) {
      const first = Object.keys(v.errors)[0];
      document.getElementById(first)?.focus();
      return;
    }
    inFlight.current = true;
    setSending(true);
    try {
      const body = buildApplyPayload(form, {
        website,
        startedAt: startedAt.current,
        fillMs: elapsedMs(startedMono.current, monoNow()),
      });
      const res = await publicApi.post(
        `/public/admission/${encodeURIComponent(key)}`,
        body,
      );
      setResult(applyResult(res.data?.data, res.data?.message));
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } catch (err) {
      if (err?.response?.status === 404) setLoadState("missing");
      else setSubmitError(applyErrorMessage(err));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  if (loadState === "loading") {
    return (
      <Shell>
        <div
          className="flex justify-center py-24"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="animate-spin w-10 h-10 text-[#00918e]" />
          <span className="sr-only">Loading admission form…</span>
        </div>
      </Shell>
    );
  }

  if (loadState === "missing" || loadState === "error") {
    const missing = loadState === "missing";
    return (
      <Shell>
        <Card>
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {missing
                ? "This admission form is not available"
                : "Couldn't load the form"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              {missing
                ? "The link may be outdated or admissions may be closed. Please contact the school for the latest admission link."
                : loadError}
            </p>
            {!missing && (
              <button
                type="button"
                onClick={() => setReloadTick((t) => t + 1)}
                className="mt-2 h-10 px-5 rounded-xl bg-[#00918e] hover:bg-[#00736f] text-white font-semibold"
              >
                Try again
              </button>
            )}
          </div>
        </Card>
      </Shell>
    );
  }

  const header = (
    <div className="flex items-start gap-4 mb-6">
      {info?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.logo}
          alt=""
          className="w-14 h-14 rounded-xl object-contain bg-white border border-gray-200 shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-[#00918e]/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-7 h-7 text-[#00918e]" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 break-words">
          {info?.schoolName || "Admission enquiry"}
        </h1>
        {info?.branchName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {info.branchName}
          </p>
        )}
        {info?.academicYear && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Admissions {info.academicYear}
          </p>
        )}
      </div>
    </div>
  );

  if (result) {
    return (
      <Shell>
        <Card>
          {header}
          <div
            className="flex flex-col items-center text-center gap-3 py-4"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="w-14 h-14 text-[#00918e]" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Enquiry submitted
            </h2>
            {result.reference && (
              <p className="text-gray-700 dark:text-gray-300">
                Your reference is{" "}
                <span className="font-mono font-semibold text-lg select-all">
                  {result.reference}
                </span>
              </p>
            )}
            {result.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                {result.message}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              The school will contact you on the phone number you provided.
              {result.reference ? " Please keep this reference." : null}
            </p>
          </div>
        </Card>
      </Shell>
    );
  }

  const describedBy = (id) => (errors[id] ? `${id}-error` : undefined);

  return (
    <Shell>
      <Card>
        {header}
        {info?.message && (
          <p className="mb-6 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line rounded-xl bg-[#00918e]/5 border border-[#00918e]/20 p-4">
            {info.message}
          </p>
        )}

        <form onSubmit={onSubmit} noValidate className="space-y-8">
          {/* Honeypot: off-screen, must stay empty. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              top: "auto",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <fieldset className="space-y-4">
            <legend className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Child
            </legend>
            <Field
              id="childName"
              label="Child's full name"
              required
              error={errors.childName}
            >
              <input
                id="childName"
                type="text"
                autoComplete="off"
                maxLength={NAME_MAX}
                value={form.childName}
                onChange={set("childName")}
                aria-required="true"
                aria-invalid={!!errors.childName}
                aria-describedby={describedBy("childName")}
                className={inputCls(errors.childName)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="gender" label="Gender" error={errors.gender}>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={set("gender")}
                  aria-invalid={!!errors.gender}
                  aria-describedby={describedBy("gender")}
                  className={inputCls(errors.gender)}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field id="dob" label="Date of birth" error={errors.dob}>
                <input
                  id="dob"
                  type="date"
                  max={localYMD()}
                  value={form.dob}
                  onChange={set("dob")}
                  aria-invalid={!!errors.dob}
                  aria-describedby={describedBy("dob")}
                  className={inputCls(errors.dob)}
                />
              </Field>
              <Field
                id="previousSchool"
                label="Previous school"
                error={errors.previousSchool}
              >
                <input
                  id="previousSchool"
                  type="text"
                  maxLength={SCHOOL_MAX}
                  value={form.previousSchool}
                  onChange={set("previousSchool")}
                  aria-invalid={!!errors.previousSchool}
                  aria-describedby={describedBy("previousSchool")}
                  className={inputCls(errors.previousSchool)}
                />
              </Field>
              <Field
                id="previousClass"
                label="Previous class"
                error={errors.previousClass}
              >
                <input
                  id="previousClass"
                  type="text"
                  maxLength={CLASS_MAX}
                  value={form.previousClass}
                  onChange={set("previousClass")}
                  aria-invalid={!!errors.previousClass}
                  aria-describedby={describedBy("previousClass")}
                  className={inputCls(errors.previousClass)}
                />
              </Field>
            </div>
            <Field
              id="desiredGrade"
              label="Applying for class"
              required
              error={errors.desiredGrade}
            >
              <select
                id="desiredGrade"
                value={form.desiredGrade}
                onChange={set("desiredGrade")}
                aria-required="true"
                aria-invalid={!!errors.desiredGrade}
                aria-describedby={describedBy("desiredGrade")}
                className={inputCls(errors.desiredGrade)}
              >
                <option value="">Select a class…</option>
                {grades.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label || g.value}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Parent / guardian
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                id="guardianName"
                label="Full name"
                required
                error={errors.guardianName}
              >
                <input
                  id="guardianName"
                  type="text"
                  autoComplete="name"
                  maxLength={NAME_MAX}
                  value={form.guardianName}
                  onChange={set("guardianName")}
                  aria-required="true"
                  aria-invalid={!!errors.guardianName}
                  aria-describedby={describedBy("guardianName")}
                  className={inputCls(errors.guardianName)}
                />
              </Field>
              <Field
                id="relation"
                label="Relation to child"
                required
                error={errors.relation}
              >
                <select
                  id="relation"
                  value={form.relation}
                  onChange={set("relation")}
                  aria-required="true"
                  aria-invalid={!!errors.relation}
                  aria-describedby={describedBy("relation")}
                  className={inputCls(errors.relation)}
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {cap(r)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="phone"
                label="Phone"
                required
                error={errors.phone}
                hint="e.g. 0300-1234567 or +92 300 1234567"
              >
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={set("phone")}
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                  className={inputCls(errors.phone)}
                />
              </Field>
              <Field id="email" label="Email (optional)" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={EMAIL_MAX}
                  value={form.email}
                  onChange={set("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={describedBy("email")}
                  className={inputCls(errors.email)}
                />
              </Field>
            </div>
            <Field id="address" label="Address" error={errors.address}>
              <textarea
                id="address"
                rows={2}
                autoComplete="street-address"
                maxLength={ADDRESS_MAX}
                value={form.address}
                onChange={set("address")}
                aria-invalid={!!errors.address}
                aria-describedby={describedBy("address")}
                className={inputCls(errors.address)}
              />
            </Field>
            <Field
              id="notes"
              label="Anything else we should know?"
              error={errors.notes}
              hint={`${form.notes.length}/${NOTES_MAX}`}
            >
              <textarea
                id="notes"
                rows={3}
                maxLength={NOTES_MAX}
                value={form.notes}
                onChange={set("notes")}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? "notes-error" : "notes-hint"}
                className={inputCls(errors.notes)}
              />
            </Field>
          </fieldset>

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            aria-busy={sending}
            className="w-full h-12 rounded-xl bg-[#00918e] hover:bg-[#00736f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-[#00918e]/30 transition-all flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit enquiry
              </>
            )}
          </button>
        </form>
      </Card>
    </Shell>
  );
}
