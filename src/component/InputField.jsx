'use client';
import React, { useState } from 'react';

export default function InputField({
  id,
  name,
  label,
  type = 'text',
  value,
  placeholder = '',
  onChange,
  onBlur,
  required = false,
  disabled = false,
  errors = '',
  showPasswordToggle: _showPasswordToggle = true,
  className = '',
  inputClass = '',
  labelClass = '',
  register = () => {},
  watch = () => {},
}) {
  console.log(register, 'register');
  console.log(watch, 'watch');
  const [showPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || watch(name);

  const handleChange = (e) => {
    if (onChange) onChange(e);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`flex flex-col w-full mb-3 ${className}`}>
      <div className={`relative `}>
        {/* {IconLeft && (
          <IconLeft className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
        )} */}

        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          {...register(name)}
          // onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          // className={`w-full outline-none bg-transparent text-gray-800 placeholder-gray-400 ${inputClass}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all peer bg-white dark:bg-gray-800 text-black dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${inputClass} ${
            isFocused
              ? 'border-black dark:border-gray-200 focus:ring-1 focus:ring-black dark:focus:ring-gray-200'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {label && (
          <label
            htmlFor={id || name}
            // className={`mb-1 text-sm font-medium text-gray-700 ${labelClass}`}
            className={`absolute left-4 px-1 bg-white dark:bg-gray-800 pointer-events-none transition-all duration-200  ${labelClass} ${
              isActive
                ? '-top-2.5 text-xs font-medium text-black dark:text-gray-100'
                : 'top-3.5 text-base text-gray-500 dark:text-gray-400'
            }`}
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        {/* Password toggle or right icon */}
        {/* {type === "password" && showPasswordToggle ? (
          <button
            type="button"
            onClick={togglePassword}
            tabIndex={-1}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        ) : loading ? (
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin ml-2" />
        ) : IconRight ? (
          <IconRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
        ) : null} */}
      </div>

      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>}
    </div>
  );
}
