'use client';

// Card container + page header used across the dashboard pages.

export function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-[#00918e] flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, className = '', children, padded = true }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          {title && (
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          )}
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
}
