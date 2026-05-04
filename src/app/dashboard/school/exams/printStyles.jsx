'use client';
import React from 'react';

export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4;
          margin: 14mm;
        }
        body {
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
        .print-area {
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          background: white !important;
        }
        .print-area table {
          page-break-inside: auto;
        }
        .print-area tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      }
    `}</style>
  );
}
