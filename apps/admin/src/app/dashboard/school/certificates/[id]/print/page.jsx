'use client';
// Printable certificate (A4 portrait) in English or Urdu (?lang=en|ur).
// window.print() + @media print, like the result-card / voucher print pages.
import React, { Suspense, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { Noto_Nastaliq_Urdu } from 'next/font/google';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import {
  PRINT_LABELS,
  buildCertificateText,
  buildVerifyUrl,
  formatCertDate,
} from '@/utils/certificateText';

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  fallback: ['Jameel Noori Nastaleeq', 'Urdu Typesetting', 'Noto Naskh Arabic', 'serif'],
});

const PARENT_PORTAL_URL = process.env.NEXT_PUBLIC_PARENT_PORTAL_URL || 'http://localhost:3003';

function CertificatePrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        html,
        body {
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
        .cert-page {
          padding: 0 !important;
          background: white !important;
          min-height: 0 !important;
        }
        .cert-sheet {
          box-shadow: none !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 272mm !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `}</style>
  );
}

function CertificatePrint() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang') === 'ur' ? 'ur' : 'en';
  const autoPrint = searchParams.get('print') === '1';
  const { accessToken: token } = useTokenStore();
  const printed = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => fetchData({ url: `/certificates/${id}`, token }),
    enabled: !!token && !!id,
    retry: retryUnless4xx,
  });
  const cert = data?.data;

  useEffect(() => {
    if (!autoPrint || !cert || printed.current) return undefined;
    printed.current = true;
    // Give the images (letterhead, signature, stamp) and font a moment to load.
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, [autoPrint, cert]);

  const setLang = (l) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('lang', l);
    p.delete('print');
    router.replace(`?${p.toString()}`);
  };

  if (isLoading) {
    return <div className="min-h-screen p-6 text-gray-500">Loading certificate…</div>;
  }
  if (error || !cert) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto w-full">
        <QueryErrorState error={error} fallback="Certificate not available" />
      </div>
    );
  }

  const L = PRINT_LABELS[lang];
  const branding = cert.branding || {};
  const text = buildCertificateText(cert, lang);
  const isUr = lang === 'ur';
  const cancelled = cert.status === 'cancelled';
  const verifyUrl = buildVerifyUrl(PARENT_PORTAL_URL, cert);
  const schoolName = branding.schoolName || cert.snapshot?.schoolName || '';
  const branchName = branding.branchName || cert.snapshot?.branchName || '';
  const signature = branding.principalSignature || branding.signature;

  return (
    <div className="cert-page min-h-screen bg-gray-100 dark:bg-gray-800 p-3 sm:p-6 print:bg-white">
      <CertificatePrintStyles />

      <div className="no-print max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/school/certificates')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Certificates
        </button>
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-1 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            {[
              { key: 'en', label: 'English' },
              { key: 'ur', label: 'اردو' },
            ].map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setLang(o.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  lang === o.key
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {cancelled && (
        <div className="no-print max-w-[210mm] mx-auto mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          This certificate was cancelled
          {cert.cancelledAt ? ` on ${formatCertDate(cert.cancelledAt, { local: true })}` : ''}
          {cert.cancelReason ? ` — ${cert.cancelReason}` : ''}.
        </div>
      )}

      <div
        className="cert-sheet relative mx-auto bg-white text-gray-900 shadow-lg w-full max-w-[210mm] min-h-[297mm] p-[8mm] flex flex-col overflow-hidden"
        dir={text.dir}
        lang={lang}
      >
        {cancelled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-10"
          >
            <span
              className={`text-red-600/25 font-extrabold tracking-widest select-none ${
                isUr ? nastaliq.className : ''
              }`}
              style={{ fontSize: isUr ? '96px' : '110px', transform: 'rotate(-30deg)' }}
            >
              {L.cancelled}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col border-[3px] border-double border-gray-800 p-[8mm]">
          {/* Header — letterhead image, else logo + names */}
          {branding.letterhead ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.letterhead}
              alt={schoolName}
              className="w-full max-h-[45mm] object-contain mb-4"
            />
          ) : (
            <div className="flex items-center gap-4 border-b-2 border-gray-800 pb-4 mb-4" dir="ltr">
              {branding.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logo}
                  alt={schoolName}
                  className="w-20 h-20 object-contain flex-shrink-0"
                />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-extrabold uppercase leading-tight">{schoolName}</h1>
                {branchName && branchName !== schoolName && (
                  <p className="text-sm font-medium text-gray-700">{branchName}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {[branding.address, branding.phone, branding.email].filter(Boolean).join(' · ')}
                </p>
              </div>
              {branding.logo && <div className="w-20 flex-shrink-0" />}
            </div>
          )}

          {/* Title */}
          <div className="text-center my-4">
            <h2
              className={`inline-block border-b-2 border-gray-800 pb-1 font-bold ${
                isUr
                  ? `${nastaliq.className} text-3xl leading-[2]`
                  : 'text-2xl uppercase tracking-wide'
              }`}
            >
              {text.title}
            </h2>
          </div>

          {/* Serial + date */}
          <div
            className={`flex justify-between text-sm mb-6 ${isUr ? `${nastaliq.className} leading-[2.2]` : ''}`}
          >
            <div>
              {L.serial}:{' '}
              <span className="font-mono font-semibold" dir="ltr">
                {cert.serialNumber}
              </span>
            </div>
            <div>
              {L.issueDate}:{' '}
              <span className="font-semibold" dir="ltr">
                {formatCertDate(cert.issuedAt, { local: true })}
              </span>
            </div>
          </div>

          {/* Body */}
          <div
            className={`flex-1 space-y-4 text-justify ${
              isUr ? `${nastaliq.className} text-[19px] leading-[2.6]` : 'text-[16px] leading-[2]'
            }`}
          >
            {text.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Footer — verification + principal signature */}
          <div className="mt-10 flex items-end justify-between gap-6">
            <div className="text-xs text-gray-700 max-w-[55%]">
              <div className={isUr ? `${nastaliq.className} leading-[2.2]` : ''}>
                {L.verificationCode}:{' '}
                <span className="font-mono font-bold text-sm tracking-wider" dir="ltr">
                  {cert.verificationCode}
                </span>
              </div>
              {verifyUrl && (
                <div className="mt-1">
                  <span className={isUr ? `${nastaliq.className} leading-[2.2]` : ''}>
                    {L.verifyAt}:
                  </span>{' '}
                  <span className="font-mono break-all" dir="ltr">
                    {verifyUrl}
                  </span>
                </div>
              )}
            </div>

            <div className="relative w-56 flex flex-col items-center text-center">
              {branding.stamp && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.stamp}
                  alt={L.stamp}
                  className="absolute -top-16 start-[-5.5rem] w-28 h-28 object-contain opacity-80"
                />
              )}
              <div className="h-16 flex items-end justify-center">
                {signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signature} alt="" className="max-h-16 max-w-[12rem] object-contain" />
                )}
              </div>
              <div className="w-full border-t border-gray-800 mt-1 pt-1">
                {branding.principalName && (
                  <div className="text-sm font-semibold" dir="auto">
                    {branding.principalName}
                  </div>
                )}
                <div
                  className={`text-sm font-bold ${isUr ? `${nastaliq.className} leading-[2.2]` : ''}`}
                >
                  {L.principal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatePrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6 text-gray-500">Loading certificate…</div>}>
      <CertificatePrint />
    </Suspense>
  );
}
