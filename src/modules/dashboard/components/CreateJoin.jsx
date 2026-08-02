import React, { useState } from 'react';
import { acceptCommunityInvite, acceptLocalGroupInvite } from '../../../shared/services/API';
import { readStoredUser } from '../../../shared/services/authStorage';

const CreateJoin = ({ onBack, onSend, onSuccess }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = touched && !inviteLink.trim();

  const parseInviteLink = (link) => {
    try {
      const trimmedLink = link.trim();
      const localGroupPattern = /localgroup\/invite\/([a-f0-9-]{36})\/([a-zA-Z0-9]+)/i;
      const localGroupMatch = trimmedLink.match(localGroupPattern);
      
      if (localGroupMatch) {
        const groupId = localGroupMatch[1];
        const inviteCode = localGroupMatch[2];
        return { type: 'localGroup', groupId, inviteCode };
      }
      const invitePattern = /\/invite\/([a-f0-9-]{36})\/([a-zA-Z0-9]+)/i;
      const match = trimmedLink.match(invitePattern);
      
      if (match) {
        const communityId = match[1];
        const inviteCode = trimmedLink; 
        return { type: 'community', communityId, inviteCode };
      }
      
      const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
      const uuidMatch = trimmedLink.match(uuidPattern);
      
      if (uuidMatch) {
        const communityId = uuidMatch[1];
        const inviteCode = trimmedLink;
        return { type: 'community', communityId, inviteCode };
      }
      
      throw new Error('Invalid invite link format');
    } catch (err) {
      throw new Error(`Could not parse invite link: ${err.message || 'Please check the link format.'}`);
    }
  };

  const onSendClick = async () => {
    setTouched(true);
    if (!inviteLink.trim()) {
      setError('Invite link is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = readStoredUser() || {};
      const userEmail = userData?.email;

      if (!userEmail) {
        throw new Error('User email not found. Please log in again.');
      }

      const parsed = parseInviteLink(inviteLink);

      let response;
      if (parsed.type === 'localGroup') {
        // Join local group
        response = await acceptLocalGroupInvite({
          groupId: parsed.groupId,
          inviteCode: parsed.inviteCode,
          acceptorEmail: userEmail
        });
      } else {
        // Join community
        response = await acceptCommunityInvite({
          communityId: parsed.communityId,
          inviteCode: parsed.inviteCode,
          acceptorEmail: userEmail
        });
      }

      // Handle success - response can be in different formats
      const isSuccess = response?.status === 200 || response?.data || response?.success || response?.message?.toLowerCase().includes('success');
      
      if (isSuccess) {
        const responseData = response?.data || response;
        // Pass both the response data and the parsed info (type and groupId/communityId) to onSuccess
        if (onSuccess) {  
          onSuccess({
            ...responseData,
            type: parsed.type,
            groupId: parsed.groupId,
            communityId: parsed.communityId
          });
        } else if (onSend) {
          onSend({
            ...responseData,
            type: parsed.type,
            groupId: parsed.groupId,
            communityId: parsed.communityId
          });
        }
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: parsed.type === 'localGroup' ? 'Successfully joined local group!' : 'Successfully joined community!', type: 'success' }
        }));
      } else {
        throw new Error(response?.message || response?.error || `Failed to join ${parsed.type === 'localGroup' ? 'local group' : 'community'}`);
      }
    } catch (err) {
      console.error('Error joining:', err);
      setError(err.message || 'Failed to join. Please check the invite link.');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to join. Please check the invite link.', type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-[750px] h-[680px] rounded-2xl overflow-hidden mx-auto my-0">
      <div className="bg-white py-3 px-2 sm:px-5 h-full flex items-center justify-center">
        <div className="relative bg-[#282828] text-white h-[70%] w-full rounded-2xl flex flex-col p-3 sm:p-8">
          {/* Back button absolutely top left */}
          <button onClick={onBack} className="absolute top-4 left-4 text-white/90 hover:text-white text-base sm:text-lg">Back</button>
          {/* Centered main content */}
          <div className="flex-1 flex flex-col justify-center items-center mt-6">
            <h2 className="text-2xl sm:text-4xl font-semibold text-center">Join group or community</h2>
            <p className="mt-3 sm:mt-4 text-gray-300 text-base sm:text-lg text-center max-w-md sm:max-w-xl">Enter the invite link below to become part of the community.</p>
          </div>
          {/* Bottom input + button row */}
          <div className="w-full flex flex-col items-center mb-4 px-1 sm:px-4 ">
            <div className="bg-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 w-full max-w-2xl">
              <input
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Invite link"
                className="flex-1 text-gray-900 text-base sm:text-lg outline-none bg-transparent"
              />
              <button
                onClick={onSendClick}
                disabled={loading || !inviteLink.trim()}
                className={`px-3 py-2 sm:px-8 sm:py-3 rounded-xl font-semibold text-base sm:text-lg transition-colors ${
                  inviteLink.trim() && !loading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-600/60 text-white/80 cursor-not-allowed'
                }`}
              >
                {loading ? 'Joining...' : 'Join'}
            </button>
            </div>
            {showError && !error && (
              <p className="mt-2 text-sm text-red-400 w-full max-w-2xl">Invite link is required.</p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-400 w-full max-w-2xl">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJoin;
