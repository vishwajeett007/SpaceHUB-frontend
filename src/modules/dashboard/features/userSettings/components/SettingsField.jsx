import { cloneElement, isValidElement } from 'react';

const SettingsField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  rightIcon,
  readOnly = false,
  isMobile = false,
  autoComplete,
}) => {
  const inputClasses = isMobile
    ? 'w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500'
    : 'w-full bg-transparent border border-gray-600 rounded-md px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClasses = isMobile
    ? 'text-sm text-gray-500 mb-1.5'
    : 'text-sm text-gray-300 mb-2';

  const renderRightIcon = () => {
    if (!rightIcon) return null;

    const positionClasses = `absolute right-3 top-1/2 -translate-y-1/2 ${
      isMobile
        ? 'text-gray-500 hover:text-gray-700'
        : 'text-gray-300 hover:text-white'
    }`;

    if (isValidElement(rightIcon) && rightIcon.type === 'button') {
      return cloneElement(rightIcon, {
        className: `${positionClasses} ${rightIcon.props.className || ''}`.trim(),
      });
    }

    return <div className={positionClasses}>{rightIcon}</div>;
  };

  return (
    <div className={isMobile ? 'mb-3' : 'mb-5'}>
      <div className={labelClasses}>{label}</div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          autoComplete={autoComplete}
          className={inputClasses}
        />
        {renderRightIcon()}
      </div>
    </div>
  );
};

export default SettingsField;
