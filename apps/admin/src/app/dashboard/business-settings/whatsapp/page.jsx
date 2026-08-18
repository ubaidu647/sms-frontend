'use client';
import React from 'react';
import WhatsAppSettingsSection from './WhatsAppSettingsSection';

// The WhatsApp channel is org configuration, not a personal preference, so it
// sits here as its own Business Settings tab instead of inside /settings.
export default function WhatsAppSettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-5xl mx-auto w-full pb-6">
        <WhatsAppSettingsSection />
      </div>
    </div>
  );
}
