'use client';
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Smartphone, CheckCircle2, RotateCcw } from 'lucide-react';
import { Modal } from '@/component/Modal';

// Renders the live QR / status for the unofficial (Baileys) session. Driven
// entirely by useWhatsAppSession — this component only paints what it's handed.
export default function ConnectModal({
  isOpen,
  onClose,
  status,
  qr,
  connectedNumber,
  connecting,
  error,
  onRetry,
}) {
  const isConnected = status === 'connected';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect WhatsApp"
      subtitle="Scan the QR code with WhatsApp on the sender phone"
      size="sm"
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {isConnected ? (
          <>
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">WhatsApp connected</p>
              {connectedNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{connectedNumber}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
            >
              Done
            </button>
          </>
        ) : qr ? (
          <>
            <div className="rounded-2xl bg-white p-4 border border-gray-200 shadow-sm">
              <QRCodeSVG value={qr} size={220} includeMargin level="M" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Smartphone className="w-4 h-4" />
              Open WhatsApp → Linked devices → Link a device
            </div>
            <p className="text-xs text-gray-400">The code refreshes automatically until scanned.</p>
          </>
        ) : error ? (
          <>
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
            >
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {connecting ? 'Generating QR code…' : 'Waiting for QR code…'}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
