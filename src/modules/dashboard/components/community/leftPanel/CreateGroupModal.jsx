import React, { useEffect, useRef, useState } from 'react';

import { useAuth } from '../../../../../shared/contexts/AuthContextContext';
import {
  authenticatedFetch,
  BASE_URL,
} from '../../../../../shared/services/API';

const CreateGroupModal = ({ isOpen, onClose, communityName, communityId, onCreateSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
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

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (!user?.email) {
      setError('User email not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `${BASE_URL}community/${communityId}/rooms/create`;
      const body = {
        roomName: groupName.trim()
      };

      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      onCreateSuccess?.(data.data || data);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#282828]/50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-[#282828] rounded-xl p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1"
          title="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white text-center mb-2">{communityName}</h2>
        <p className="text-white/80 text-center text-sm mb-6">Create a Group for seamless workflow!</p>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg outline-none placeholder:text-gray-400"
            maxLength={30}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !groupName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;

