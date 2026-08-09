import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContextContext';
import { showToast } from '../../../../shared/services/toast';
import ChatRoom from '../chatRoom/Chatroom';
import CommunityVoiceRoom from '../voiceRoom/CommunityVoiceRoom';
import {
  CommunityWelcomeModal,
  readSessionUser,
  useCommunityChannelSelection,
  useCommunityChat,
  useCommunityWelcome,
} from '../../features/communityChat';
import {
  getCachedCommunityAvatar,
  getCachedCommunityUsername,
} from './utils/communityMemberCache';

const isGeneralAnnouncementChannel = (selectedChannelId, roomTitle) => (
  selectedChannelId === 'announcement:general'
  || selectedChannelId === 'general'
  || selectedChannelId?.endsWith(':chat:general')
  || roomTitle === '# general'
  || roomTitle === 'general'
);

const CommunityCenterPanel = ({
  community,
  roomCode,
  onToggleRightPanel = null,
  onBack = null,
  isLocalGroup = false,
}) => {
  const { user } = useAuth();
  const communityId = useMemo(() => (
    community?.id || community?.communityId || community?.community_id
  ), [community]);
  const sessionUser = readSessionUser();
  const userEmail = user?.email || sessionUser.email || '';

  const getCachedAvatar = useCallback((email) => (
    getCachedCommunityAvatar(communityId, email)
  ), [communityId]);
  const getCachedUsername = useCallback((email) => (
    getCachedCommunityUsername(communityId, email)
  ), [communityId]);

  const {
    activeChatRoomCode,
    currentMode,
    currentRoomCode,
    currentRoomTitle,
    selectedChannelId,
    voiceRoomData,
  } = useCommunityChannelSelection({
    communityId,
    roomCode,
    userEmail,
  });
  const { messages, sendMessage } = useCommunityChat({
    activeChatRoomCode: activeChatRoomCode || selectedChannelId || currentRoomCode || roomCode,
    currentMode,
    getCachedAvatar,
    getCachedUsername,
    roomCode: currentRoomCode || roomCode,
    userEmail,
  });
  const {
    closeWelcomeModal,
    currentUserRole,
    openInviteModal,
    showWelcomeModal,
  } = useCommunityWelcome({
    communityId,
    isLocalGroup,
    userEmail: user?.email,
  });

  const isReadOnly = isGeneralAnnouncementChannel(
    selectedChannelId,
    currentRoomTitle,
  ) && !(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'WORKSPACE_OWNER');

  const handleSend = useCallback(async (message) => {
    if (isReadOnly) {
      showToast('Only admins and owners can send messages in the #general channel', 'error');
      return;
    }

    await sendMessage(message);
  }, [isReadOnly, sendMessage]);

  return (
    <div className="flex-1 min-w-0 bg-white h-full flex flex-col rounded-xl border border-gray-500 overflow-hidden md:bg-white">
      {currentMode === 'voice' ? (
        <CommunityVoiceRoom
          key={`voice-room-${voiceRoomData?.janusRoomId || 'none'}-${selectedChannelId || 'no-channel'}`}
          title={currentRoomTitle}
          voiceRoomData={voiceRoomData}
          communityId={communityId}
          onBack={onBack}
        />
      ) : (
        <ChatRoom
          key={`${currentRoomCode || 'no-room'}-${currentRoomTitle}`}
          title={currentRoomTitle}
          currentUser={{
            email: user?.email,
            username: user?.username,
            avatarUrl: sessionUser.avatarUrl,
          }}
          messages={messages}
          isGroupChat={true}
          onToggleRightPanel={onToggleRightPanel}
          onBack={onBack}
          isReadOnly={isReadOnly}
          onSend={handleSend}
        />
      )}

      {showWelcomeModal
        && currentMode === 'chat'
        && currentRoomTitle === '# general'
        && (
          <CommunityWelcomeModal
            roomTitle={currentRoomTitle}
            onClose={closeWelcomeModal}
            onInvite={openInviteModal}
            onStartConversation={closeWelcomeModal}
          />
        )}
    </div>
  );
};

export default CommunityCenterPanel;
