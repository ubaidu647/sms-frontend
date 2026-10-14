"use client";
// Public certificate verification result — reachable without login. Uses a bare
// axios instance (no cookies, no session headers, no token-refresh interceptor).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  certificateTypeLabel,
  formatIssueDate,
  isValidCode,
  normalizeCode,
  verifyErrorState,
} from "@/utils/verifyCertificate";
import { Shell, Card, CodeForm } from "../VerifyParts";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4001/api",
  withCredentials: false,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 py-2.5 border-b last:border-b-0 border-gray-100 dark:border-[#2a2a2a]">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-gray-100 sm:text-right break-words">
        {value || "—"}
      </dd>
    </div>
  );
}

function CheckAnother() {
  return (
    <div className="mt-6 text-center">
      <Link
        href="/verify"
        className="text-sm text-[#00918e] hover:underline font-medium"
      >
        Check another code
      </Link>
    </div>
  );
}

export default function VerifyCodePage() {
  const params = useParams();
  const rawCode = typeof params?.code === "string" ? params.code : "";
  const code = normalizeCode(rawCode);
  const valid = isValidCode(code);

  const [state, setState] = useState("loading"); // loading | ok | notfound | ratelimited | error
  const [cert, setCert] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setState("loading");
    publicApi
      .get(`/public/certificates/verify/${encodeURIComponent(code)}`)
      .then((res) => {
        if (cancelled) return;
        setCert(res.data?.data ?? null);
        setState(res.data?.data ? "ok" : "notfound");
      })
      .catch((err) => {
        if (!cancelled) setState(verifyErrorState(err));
      });
    return () => {
      cancelled = true;
    };
  }, [code, valid, tick]);

  if (!valid) {
    return (
      <Shell>
        <CodeForm
          initial={code}
          note={
            code
              ? "That code doesn't look right. Verification codes are 10 letters and digits — please check and type it again."
              : undefined
          }
        />
      </Shell>
    );
  }

  if (state === "loading") {
    return (
      <Shell>
        <div
          className="flex justify-center py-24"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="animate-spin w-10 h-10 text-[#00918e]" />
          <span className="sr-only">Checking certificate…</span>
        </div>
      </Shell>
    );
  }

  if (state !== "ok") {
    const title =
      state === "notfound"
        ? "No certificate found for this code"
        : state === "ratelimited"
          ? "Too many checks, try again later"
          : "Couldn't check the certificate";
    const body =
      state === "notfound"
        ? `No certificate matches the code ${code}. Check the code printed on the certificate and try again.`
        : state === "ratelimited"
          ? "Too many verification requests were made from your network. Please wait a few minutes and try again."
          : "Something went wrong while contacting the school. Please try again.";
    return (
      <Shell>
        <Card>
          <div
            className="flex flex-col items-center text-center gap-3 py-6"
            role="alert"
          >
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              {body}
            </p>
            {state === "error" && (
              <button
                type="button"
                onClick={() => setTick((t) => t + 1)}
                className="mt-2 h-10 px-5 rounded-xl bg-[#00918e] hover:bg-[#00736f] text-white font-semibold"
              >
                Try again
              </button>
            )}
          </div>
          <CheckAnother />
        </Card>
      </Shell>
    );
  }

  const cancelledCert = cert?.status === "cancelled";
  const school = [cert?.schoolName, cert?.branchName]
    .filter(Boolean)
    .join(" — ");

  return (
    <Shell>
      <Card
        className={
          cancelledCert
            ? "border-red-300 dark:border-red-900"
            : "border-emerald-300 dark:border-emerald-900"
        }
      >
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-3 rounded-xl p-4 ${
            cancelledCert
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {cancelledCert ? (
            <XCircle className="w-8 h-8 shrink-0" />
          ) : (
            <CheckCircle2 className="w-8 h-8 shrink-0" />
          )}
          <div>
            <h1 className="text-lg font-semibold">
              {cancelledCert
                ? "This certificate has been CANCELLED"
                : "Valid certificate"}
            </h1>
            <p className="text-sm opacity-90">
              {cancelledCert
                ? "It was issued by the school but has since been withdrawn and is no longer valid."
                : "This certificate was issued by the school and is genuine."}
            </p>
          </div>
        </div>

        <dl className="mt-5">
          <Row label="Certificate" value={certificateTypeLabel(cert?.type)} />
          <Row label="Serial number" value={cert?.serialNumber} />
          <Row label="Student name" value={cert?.studentName} />
          <Row label="Admission number" value={cert?.admissionNumber} />
          <Row label="School" value={school} />
          <Row label="Issue date" value={formatIssueDate(cert?.issuedAt)} />
          <Row label="Verification code" value={code} />
        </dl>
        <CheckAnother />
      </Card>
    </Shell>
  );
}
