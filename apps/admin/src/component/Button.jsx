import React from 'react';
import { Loader2 } from 'lucide-react';
// Button.jsx — A fully dynamic Tailwind button component
// Allows live changes to size, color, shape, animations, and states.

export default function Button({
  styleObject = {
    baseColor: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    rounded: 'rounded-full',
    size: 'px-8 py-3 text-lg',
    textColor: 'text-white',
    animation: '',
  },
  label = 'Submit',
  loading = false,
  success = false,
  handleClick,
  className = '',
  type = 'button',
}) {
  const getButtonColor = () => {
    if (success) return 'bg-green-600';
    return styleObject.baseColor;
  };
  return (
    <button
      type={type}
      onClick={handleClick}
      className={`relative flex items-center justify-center font-semibold select-none overflow-hidden ${styleObject.animation} ${getButtonColor()} ${
        loading || success ? 'opacity-100' : styleObject.hoverColor
      } ${styleObject.textColor} ${styleObject.rounded} ${styleObject.size} ${className}`}
      disabled={loading || success}
      style={{ transformOrigin: 'center center' }}
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      ) : (
        <span>{success ? 'Done' : label}</span>
      )}
    </button>
  );
}

// Example Usage:
// <Button
//   label="Submit"
//   baseColor="bg-black"
//   hoverColor="hover:bg-gray-800"
//   rounded="rounded-full"
//   size="px-8 py-3 text-lg"
//   onClick={async () => {
//     await new Promise(res => setTimeout(res, 2000));
//     return { success: true };
//   }}
// />
