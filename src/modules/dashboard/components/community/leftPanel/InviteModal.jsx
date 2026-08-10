import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../../../../../shared/contexts/AuthContextContext';
import {
  createCommunityInvite,
  createLocalGroupInvite,
} from '../../../../../shared/services/API';

const InviteModal = ({ isOpen, onClose, communityId, isLocalGroup = false, currentUserRole = '' }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const modalRef = useRef(null);

  const isAuthorized = !currentUserRole ||
                      currentUserRole.toUpperCase() === 'ADMIN' ||
                      currentUserRole.toUpperCase() === 'OWNER' ||
                      currentUserRole.toUpperCase() === 'WORKSPACE_OWNER' ||
                      currentUserRole.toUpperCase() === 'MEMBER';

  const generateInviteLink = useCallback(async () => {
    if (!communityId || !user?.email) {
      setError('Group ID or user email not found');
      return;
    }

    if (!isAuthorized) {
      setError('Only workspace owners and admins can generate invite links');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Only workspace owners and admins can generate invite links', type: 'error' }
      }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      if (isLocalGroup) {

        response = await createLocalGroupInvite({
          groupId: communityId,
          inviterEmail: user.email,
          maxUses: 5,
          expiresInHours: 24
        });
      } else {

        response = await createCommunityInvite({
          communityId,
          email: user.email,
          inviterEmail: user.email,
        });
      }

      const resData = response?.data || response;
      const code = resData?.inviteCode || resData?.code || response?.inviteCode || response?.code;
      const directLink = resData?.inviteLink || resData?.link || response?.inviteLink || response?.link;

      const link = directLink || (code ? `${window.location.origin}/${isLocalGroup ? 'localgroup/invite' : 'invite'}/${communityId}/${code}` : '');

      if (link) {
        setInviteLink(link);
      } else {
        setError('Failed to generate invite link');
      }
    } catch (err) {
      console.error('Error generating invite link:', err);
      setError(err.message || 'Failed to generate invite link');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to generate invite link', type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  }, [communityId, user?.email, isLocalGroup, isAuthorized]);

  useEffect(() => {
    if (isOpen) {
      setInviteLink('');
      setError('');
      setLoading(false);
      setCopied(false);
      generateInviteLink();
    }
  }, [isOpen, generateInviteLink]);

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

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <h2 className="text-2xl font-bold text-white text-center mb-2">Invite people</h2>
        <p className="text-white/80 text-center text-sm mb-6">
          Your community starts with you. Invite people and make it come alive.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {loading ? (
          <div className="text-white text-center py-4">Generating invite link...</div>
        ) : inviteLink ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-3 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white flex-shrink-0">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-white outline-none text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">

        </div>
      </div>
    </div>
  );
};

export default InviteModal;

