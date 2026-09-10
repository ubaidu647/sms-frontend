'use client';

import Link from 'next/link';
import { Building2, Package, CreditCard, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

// Landing screen for the system console. Deliberately thin — the real work
// happens in the three sections below, and cross-tenant metrics would need
// aggregate endpoints the backend does not expose yet.
const SECTIONS = [
  {
    href: '/dashboard/organizations',
    icon: Building2,
    title: 'Organizations',
    desc: 'Every school on the platform — create tenants and review their setup.',
  },
  {
    href: '/dashboard/packages',
    icon: Package,
    title: 'Packages',
    desc: 'The plan catalog: pricing, billing cycles and the limits each plan grants.',
  },
  {
    href: '/dashboard/subscriptions',
    icon: CreditCard,
    title: 'Subscriptions',
    desc: 'Assign, change, renew or cancel a plan, and settle the invoices behind it.',
  },
];

export default function SystemDashboard() {
  const { user } = useUserStore();

  return (
    <div className="p-2 sm:p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        NodeCampus system console — tenants, plans and billing across every school.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1f1f1f] p-5 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              {title}
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
