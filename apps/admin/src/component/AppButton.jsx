const AppButton = ({ children, className = '', onClick, variant, size }) => {
  const base = 'inline-flex items-center justify-center rounded-full font-medium transition-colors';
  const variants = {
    ghost: 'bg-transparent hover:bg-white/10 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  };
  const sizes = {
    icon: 'p-2',
    default: 'px-4 py-2 h-14',
    small: 'px-3 py-1 h-10',
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant] || ''} ${sizes[size] || ''} ${className}`}
    >
      {children}
    </button>
  );
};

export default AppButton;
