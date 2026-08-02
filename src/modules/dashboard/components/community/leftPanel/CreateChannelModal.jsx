import React, { useEffect, useRef, useState } from 'react';

const CreateChannelModal = ({ isOpen, onClose, onSuccess }) => {
  const [channelName, setChannelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setChannelName('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }

    const cleanName = channelName.trim().replace(/^#+/, '');
    
    if (!cleanName) {
      setError('Channel name cannot be empty');
      return;
    }

    onSuccess?.(cleanName);
    setChannelName('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  {/* Create Channel Modal */}
  return (
    <div className="fixed inset-0 bg-[#282828]/50 flex items-start justify-center z-20 pt-20">
      <div ref={modalRef} className="bg-black rounded-md max-w-lg w-full mx-">
        <div className="flex items-center gap-4 p-4 ">
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="#Channelname"
              className="flex-1 bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 outline-purple-400 ring-2 ring-purple-600"
              maxLength={30}
              autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !channelName.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            title="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && (
          <div className="px-4 pb-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateChannelModal;

