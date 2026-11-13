'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import { fmtMoney } from './format';
import ModuleChips from './ModuleChips';
import { addonPriceLabel, moduleLabel, pricedAddons, pricedModules } from '@/utils/addons';
import { offerSlotsLeft } from '@/utils/launchOffer';
import { formatGB } from '@/utils/storage';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
      {children}
    </span>
  </div>
);

export default function PackageDetailModal({ isOpen, onClose, pkg }) {
  if (!pkg) return null;
  const platforms = Object.entries(pkg.platforms || {})
    .filter(([, on]) => on)
    .map(([k]) => k);
  // Older packages predate dashboards — fall back to the model defaults.
  const dashboards = Object.entries(
    pkg.dashboards ?? { staff: true, student: false, parent: false },
  )
    .filter(([, on]) => on)
    .map(([k]) => k);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pkg.name} subtitle="Package details" size="md">
      <div className="space-y-1">
        {pkg.serialNumber != null && <Row label="Serial">#{pkg.serialNumber}</Row>}
        {pkg.description && <Row label="Description">{pkg.description}</Row>}
        <Row label="Price">{fmtMoney(pkg.price)}</Row>
        <Row label="Duration">{pkg.durationInDays} days</Row>
        <Row label="Students">{pkg.limits?.noOfStudents ?? '-'}</Row>
        <Row label="Branches">{pkg.limits?.noOfBranches ?? '-'}</Row>
        <Row label="Staff">{pkg.limits?.noOfStaffs ?? '-'}</Row>
        <Row label="Sections">{pkg.limits?.noOfSections ?? '-'}</Row>
        <Row label="Storage">
          {pkg.limits?.storageGB != null ? formatGB(pkg.limits.storageGB) : 'Unlimited'}
        </Row>
        <Row label="Add-on prices">
          {pricedAddons(pkg.addonPrices).length
            ? pricedAddons(pkg.addonPrices)
                .map((p) => `${addonPriceLabel(p.key)} ${fmtMoney(p.price)}`)
                .join(' · ') + ` per unit / ${pkg.durationInDays} days`
            : 'None'}
        </Row>
        <Row label="Module add-on prices">
          {pricedModules(pkg.moduleAddonPrices).length
            ? pricedModules(pkg.moduleAddonPrices)
                .map((p) => `${moduleLabel(p.key)} ${fmtMoney(p.price)}`)
                .join(' · ') + ` / ${pkg.durationInDays} days`
            : 'None'}
        </Row>
        <Row label="Launch offer">
          {pkg.launchOffer
            ? `${fmtMoney(pkg.launchOffer.price)} for ${pkg.launchOffer.lockDays} days · claimed ${
                pkg.launchOffer.claimed ?? 0
              } of ${pkg.launchOffer.maxSchools} (${offerSlotsLeft(pkg.launchOffer)} left)${
                pkg.launchOffer.active === false ? ' · paused' : ''
              }`
            : 'None'}
        </Row>
        <Row label="Platforms">{platforms.length ? platforms.join(', ') : 'None'}</Row>
        <Row label="Dashboards">{dashboards.length ? dashboards.join(', ') : 'None'}</Row>
        <Row label="Modules">
          <ModuleChips features={pkg.features} className="justify-end" />
        </Row>
        <Row label="Status">{pkg.isActive ? 'Active' : 'Inactive'}</Row>
      </div>
    </Modal>
  );
}
