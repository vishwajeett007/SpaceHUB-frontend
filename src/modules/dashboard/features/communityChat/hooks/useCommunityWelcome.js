import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCommunityMembers } from '../../../../../shared/services/API';
import { showToast } from '../../../../../shared/services/toast';

export const useCommunityWelcome = ({ communityId, isLocalGroup, userEmail }) => {
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const storageKey = useMemo(() => (
    communityId ? `welcomeShown:community:${communityId}:channel:general` : ''
  ), [communityId]);

  useEffect(() => {
    if (!communityId || !userEmail || isLocalGroup) return undefined;

    let disposed = false;

    const checkAdminAndMaybeShow = async () => {
      try {
        const response = await getCommunityMembers(communityId);
        if (disposed) return;

        const members = response?.data?.members || response?.members || [];
        const currentMember = members.find((member) => (
          (member.email || member.username) === userEmail
        ));
        const role = String(currentMember?.role || '').toUpperCase();
        setCurrentUserRole(role);

        if (localStorage.getItem(storageKey) !== '1' && role === 'ADMIN') {
          setShowWelcomeModal(true);
        }
      } catch (error) {
        console.error('Failed to decide welcome modal visibility:', error);
      }
    };

    checkAdminAndMaybeShow();
    return () => {
      disposed = true;
    };
  }, [communityId, isLocalGroup, storageKey, userEmail]);

  const closeWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false);
    try {
      if (storageKey) localStorage.setItem(storageKey, '1');
    } catch {
      // Remembering the modal state is best-effort.
    }
  }, [storageKey]);

  const openInviteModal = useCallback(() => {
    closeWelcomeModal();
    try {
      window.dispatchEvent(new Event('community:open-invite'));
      showToast('Invite people to your community', 'info');
    } catch (error) {
      console.error('Failed to open invite modal:', error);
    }
  }, [closeWelcomeModal]);

  return {
    closeWelcomeModal,
    currentUserRole,
    openInviteModal,
    showWelcomeModal,
  };
};
