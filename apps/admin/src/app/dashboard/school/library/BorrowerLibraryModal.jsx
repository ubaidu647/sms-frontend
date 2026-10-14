'use client';
// Read-only library view of one student / staff member (used from the
// Students and Staff lists).
import React from 'react';
import { Modal } from '@/component/Modal';
import BorrowerSummary from './BorrowerSummary';

/** `borrower` = { type: 'student'|'staff', id, name } | null */
export default function BorrowerLibraryModal({ borrower, onClose }) {
  return (
    <Modal
      isOpen={!!borrower}
      onClose={onClose}
      title="Library"
      subtitle={borrower?.name}
      size="lg"
    >
      {borrower && <BorrowerSummary type={borrower.type} id={borrower.id} showHistory />}
    </Modal>
  );
}
