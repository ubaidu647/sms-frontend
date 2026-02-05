import React from 'react';

export const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.value
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                  activeTab === tab.value
                    ? 'bg-teal-100 text-teal-600'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
