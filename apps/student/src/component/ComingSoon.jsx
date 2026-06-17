'use client';

// Consistent placeholder used by the not-yet-built student pages.
export default function ComingSoon({ icon: Icon, title, description }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-[#00918e] flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-10 text-center">
        {Icon && <Icon className="w-10 h-10 mx-auto text-[#00918e] dark:text-[#33b3b0]" />}
        <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Coming soon</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
