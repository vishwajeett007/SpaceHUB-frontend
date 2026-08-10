import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { joinCommunity, cancelJoinCommunity } from '../../../shared/services/API';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

const JoinCommunityModal = ({ isOpen, onClose, community }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess(false);
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

  const handleJoin = async () => {
    if (!community) return;

    const storedEmail = getStoredUserEmail();
    const userEmail = user?.email || storedEmail;

    if (!userEmail) {
      setError('User email not found');
      return;
    }

    const communityIdentifier = community.id || community.communityId || community.slug || community.name || community.title || '';
    if (!communityIdentifier) {
      setError('Community identifier not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await joinCommunity(communityIdentifier, userEmail);
      setSuccess(true);

      const isAlready = res?.data?.alreadyMember || res?.alreadyMember;
      if (isAlready) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'You are already a member of this community!', type: 'info' }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Joined community successfully!', type: 'success' }
        }));
      }

      window.dispatchEvent(new Event('refresh:communities'));

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error joining community:', err);
      const errorMsg = err.message || 'Failed to send join request';
      setError(errorMsg);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!community) return;
    const communityIdentifier = community.id || community.communityId || community.slug || community.name || community.title || '';
    if (!communityIdentifier) return;

    setLoading(true);
    setError('');

    try {
      await cancelJoinCommunity(communityIdentifier);
      setSuccess(true);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Cancelled join request', type: 'info' }
      }));
      window.dispatchEvent(new Event('refresh:communities'));
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || 'Failed to cancel join request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !community) return null;

  const communityName = community.name || 'Community';
  const communityDescription = community.description || '';
  const communityImage = community.imageUrl || community.bannerUrl || community.imageURL || '';

  return (
    <div className="fixed inset-0 bg-[#282828]/50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-[#282828] rounded-lg md:rounded-xl p-5 md:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 md:top-4 right-3 md:right-4 text-white/80 hover:text-white transition-colors p-1 z-10"
          title="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {communityImage && (
          <div className="w-full h-24 md:h-32 mb-3 md:mb-4 rounded-lg overflow-hidden bg-gray-700">
            <img
              src={communityImage}
              alt={communityName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">{communityName}</h2>

        {communityDescription && (
          <p className="text-white/70 text-center text-sm mb-4 md:mb-6 line-clamp-3">{communityDescription}</p>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {success ? (
          <div className="text-center">
            <div className="text-green-400 text-lg font-semibold mb-4">✓ Request processed!</div>
            <p className="text-white/80 text-sm">Community membership status updated.</p>
          </div>
        ) : community.isMember ? (
          <div className="flex flex-col gap-2.5 md:gap-3">
            <button
              onClick={() => {
                onClose();
                if (community.slug || community.id) {
                  window.location.href = `/dashboard/community/${community.slug || community.id}`;
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2"
            >
              View Community (Joined)
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        ) : community.isPending ? (
          <div className="flex flex-col gap-2.5 md:gap-3">
            <button
              onClick={handleCancelRequest}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-red-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold transition-all group flex items-center justify-center"
            >
              <span className="group-hover:hidden">Requested</span>
              <span className="hidden group-hover:inline">Cancel Request</span>
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 md:gap-3">
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Joining...' : 'Join Community'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-md text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinCommunityModal;
