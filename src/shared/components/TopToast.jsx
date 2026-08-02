import React, { useEffect, useRef, useState } from 'react';
import { TOAST_EVENT } from '../services/toast';

const TopToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // info | success | error
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      setMessage(detail.message || '');
      setType(detail.type || 'info');
      setVisible(true);
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => setVisible(false), 3000);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler);
      window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <div className={`fixed top-0 left-0 right-0 pointer-events-none z-[1000] flex justify-center transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div
        className={`mt-4 px-4 py-2 rounded-md text-white shadow-lg pointer-events-auto transition-all duration-300 ${bg} ${visible ? 'animate-slide-down' : ''}`}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
      >
        {message}
      </div>
    </div>
  );
};

export default TopToast;
