import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  closeOnBackdrop = false,
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClass =
    {
      sm: 'w-full sm:max-w-md',
      md: 'w-full sm:max-w-lg md:max-w-xl',
      lg: 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
      xl: 'w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl',
    }[size] || 'w-full sm:max-w-lg md:max-w-xl';

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div
          className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ${sizeClass} max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transition-all duration-300 transform animate-fadeIn`}
        >
          <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/40 dark:to-blue-950/40 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-4 sm:py-6 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-2 sm:ml-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
              type="button"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="px-4 sm:px-8 py-4 sm:py-6">{children}</div>

          {footer && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-4 sm:py-6 flex flex-wrap gap-3 justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
