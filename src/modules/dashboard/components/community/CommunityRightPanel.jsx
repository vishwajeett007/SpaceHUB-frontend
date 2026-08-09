import React, { useEffect, useMemo, useState } from 'react';
import { getCommunityMembers, getLocalGroupMembers, removeCommunityMember } from '../../../../shared/services/API';
import { useAuth } from '../../../../shared/contexts/AuthContextContext';
import { getStoredUserEmail } from '../../../../shared/services/authStorage';

const CommunityRightPanel = ({ community, isLocalGroup = false, onClose = null }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removingMember, setRemovingMember] = useState({});
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const communityId = useMemo(() => community?.id || community?.communityId || community?.community_id, [community]);

  const fetchMembers = async () => {
    if (!communityId) return;
    setLoading(true);
    setError('');
    try {
      let list = [];
      if (isLocalGroup) {
        const data = await getLocalGroupMembers(communityId);
        list = data?.data?.members || data?.members || data?.data || [];
      } else {
        const data = await getCommunityMembers(communityId);
        list = data?.data?.members || data?.members || [];
      }
      list = (Array.isArray(list) ? list : []).filter((m) => (m.role || '').toUpperCase() !== 'PENDING');
      
      // Store avatar URLs and usernames in session storage for use in chat rooms and voice rooms
      const avatarMap = {};
      const usernameMap = {};
      list.forEach((member) => {
        const email = member?.email || member?.username || '';
        if (email) {
          if (member?.avatarPreviewUrl) {
            avatarMap[email.toLowerCase()] = member.avatarPreviewUrl;
          }
          if (member?.username) {
            usernameMap[email.toLowerCase()] = member.username;
          }
        }
      });
      
      // Store avatars in session storage with community ID as key
      if (Object.keys(avatarMap).length > 0) {
        const storageKey = `community_avatars_${communityId}`;
        const existingAvatars = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        sessionStorage.setItem(storageKey, JSON.stringify({ ...existingAvatars, ...avatarMap }));
      }
      
      // Store usernames in session storage with community ID as key
      if (Object.keys(usernameMap).length > 0) {
        const storageKey = `community_usernames_${communityId}`;
        const existingUsernames = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        sessionStorage.setItem(storageKey, JSON.stringify({ ...existingUsernames, ...usernameMap }));
      }
      
      setMembers(list);

      // Find current user's role
      const userEmail = user?.email || getStoredUserEmail();
      if (userEmail) {
        const me = list.find((m) => {
          const memberEmail = m.email || m.username || '';
          return memberEmail.toLowerCase() === userEmail.toLowerCase();
        });
        const role = (me?.role || '').toUpperCase();
        setCurrentUserRole(role);
        // console.log('Current user role:', role, 'User email:', userEmail, 'Found member:', me);
      } else {
        // console.warn('User email not found for role check');
      }
    } catch (e) {
      const errorMsg = e.message || 'Failed to fetch members';
      setError(errorMsg);
      console.error('Error fetching members:', e);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, isLocalGroup, user?.email]);

  const handleRemoveMember = async (member) => {
    console.log('handleRemoveMember called with:', member);
    const userEmail = member?.email || member?.username;
    const requesterEmail = user?.email || getStoredUserEmail();

    console.log('Remove member params:', { userEmail, requesterEmail, communityId });

    if (!userEmail || !requesterEmail || !communityId) {
      console.error('Missing required info:', { userEmail, requesterEmail, communityId });
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Unable to remove member. Missing required information.', type: 'error' }
      }));
      return;
    }

    const memberId = member?.memberId || member?.id || userEmail;
    setRemovingMember((prev) => ({ ...prev, [memberId]: true }));

    try {
      console.log('Calling removeCommunityMember API...', {
        url: `community/removeMember`,
        payload: { communityId, userEmail, requesterEmail }
      });
      
      const response = await removeCommunityMember(communityId, userEmail, requesterEmail);
      console.log('Member removed successfully:', response);

      setMembers((prev) => {
        return prev.filter((m) => {
          const prevEmail = m?.email || m?.username;
          const prevId = m?.memberId || m?.id || prevEmail;
          const targetId = member?.memberId || member?.id || userEmail;
          return String(prevId) !== String(targetId);
        });
      });

      window.dispatchEvent(new CustomEvent('toast', {
        detail: {
          message: `Removed ${member?.username || member?.name || userEmail}`,
          type: 'success'
        }
      }));
    } catch (e) {
      console.error('Failed to remove member - Full error:', e);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: e.message || 'Failed to remove member', type: 'error' }
      }));
    } finally {
      setRemovingMember((prev) => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    }
  };

  const openConfirm = (member) => {
    setConfirmTarget(member);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const confirmRemove = async () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    closeConfirm();
    await handleRemoveMember(target);
  };

  const isAdmin = currentUserRole === 'ADMIN';
  const currentUserEmail = user?.email || getStoredUserEmail();

  // Shared content component
  const PanelContent = () => (
    <>
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <img src="/icons/user-friends.svg" alt="Members" className="w-5 h-5" />
        Members {members?.length ? `(${members.length})` : ''}
      </h3>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-lg">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {members.map((m, idx) => {
            const displayName = m.username || m.name || m.email || `member-${idx+1}`;
            const role = (m.role || '').toString();
            const memberRole = (m.role || '').toUpperCase();
            // Use avatarPreviewUrl from API response, fallback to other fields
            const avatarUrl = m.avatarPreviewUrl || m.avatarUrl || m.avatar || '/avatars/avatar-1.png';
            const memberEmail = m.email || m.username || '';
            const isCurrentUser = memberEmail && currentUserEmail && memberEmail.toLowerCase() === currentUserEmail.toLowerCase();
            const isMemberAdmin = memberRole === 'ADMIN';
            // Only show remove button to admins, and only for non-admin members (not themselves or other admins)
            const canRemove = isAdmin && !isCurrentUser && !isMemberAdmin;
            const memberId = m.memberId || m.id || memberEmail;
            const isRemoving = removingMember[memberId];

            return (
              <div key={memberId} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                    <div className="w-full h-full bg-gray-300 hidden" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 text-base font-medium truncate">{displayName}</div>
                    {role && (
                      <div className="text-xs text-gray-600 mt-0.5">{role}</div>
                    )}
                  </div>
                </div>
                {canRemove && (
                  <button
                    onClick={() => openConfirm(m)}
                    disabled={isRemoving}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Remove member"
                  >
                    <img src="/icons/delete.svg" alt="Remove member" className="w-4 h-4" />
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="text-gray-600">No members found.</div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile/Tablet: Slide-in Panel from Right */}
      {onClose && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Slide-in Panel from Right */}
          <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 lg:hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
                title="Close"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <PanelContent />
            </div>
          </div>
        </>
      )}

      {/* Desktop: In normal layout (1024px and above) */}
      <div className="hidden lg:block w-80 bg-white h-full overflow-y-auto flex-shrink-0 rounded-xl p-6 border border-gray-500">
        <PanelContent />
      </div>

      {/* Confirm Remove Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24">
          <div className="bg-white rounded-md shadow-lg w-[min(92%,420px)]">
            <div className="px-5 py-4 flex items-center justify-between">
              <h4 className="text-gray-900 font-semibold text-base">Remove member</h4>
              <button onClick={closeConfirm} className="text-gray-500 hover:text-gray-700" title="Close">✕</button>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              Are you sure you want to remove
              {' '}<span className="font-medium">{(confirmTarget?.username || confirmTarget?.name || confirmTarget?.email || confirmTarget?.username || '').toString()}</span>{' '}
              from this community?
            </div>
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={closeConfirm} className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={confirmRemove} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommunityRightPanel;
