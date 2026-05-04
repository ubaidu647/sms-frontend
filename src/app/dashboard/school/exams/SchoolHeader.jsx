'use client';
import React from 'react';

export default function SchoolHeader({ user, title, subtitle }) {
  const schoolName =
    user?.school?.name ||
    user?.schoolName ||
    user?.branch?.school?.name ||
    'School Portal';
  const branchName = user?.branch?.name || user?.branchName || '';
  const address =
    user?.school?.address ||
    user?.branch?.address ||
    user?.schoolAddress ||
    '';
  const phone = user?.school?.phone || user?.branch?.phone || user?.schoolPhone || '';
  const email = user?.school?.email || user?.branch?.email || user?.schoolEmail || '';
  const logo = user?.school?.logo || user?.branch?.logo || user?.schoolLogo || '';

  return (
    <div className="border-b-2 border-gray-800 pb-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={schoolName} className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="white" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{schoolName}</h1>
          {branchName && (
            <p className="text-sm text-gray-700 font-medium">Branch: {branchName}</p>
          )}
          <p className="text-xs text-gray-500">
            {[address, phone, email].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {(title || subtitle) && (
        <div className="mt-4 text-center">
          {title && <h2 className="text-xl font-bold text-gray-900 uppercase">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
