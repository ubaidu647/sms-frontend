'use client';
import { Video, MessageSquare, ClipboardCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore';

const cards = [
  {
    label: 'Live Classes',
    value: 'View schedule',
    icon: Video,
    href: '/dashboard/live-classes',
  },
  { label: 'Live Chat', value: 'Open chat', icon: MessageSquare, href: '/dashboard/chat' },
  { label: 'Live Tests', value: 'Take a test', icon: ClipboardCheck, href: '/dashboard/tests' },
  { label: 'Results', value: 'See results', icon: BarChart3, href: '/dashboard/results' },
];

export default function StudentDashboard() {
  const user = useUserStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Welcome{user?.name ? `, ${user.name}` : ''} 👋
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Here’s your learning space. Jump into a class, chat, or test.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 p-5 transition-shadow hover:shadow-lg no-underline"
            >
              <div className="w-11 h-11 rounded-xl bg-[#00918e] flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{c.label}</div>
              <div className="mt-0.5 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#00918e] dark:group-hover:text-[#33b3b0] transition-colors">
                {c.value}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
