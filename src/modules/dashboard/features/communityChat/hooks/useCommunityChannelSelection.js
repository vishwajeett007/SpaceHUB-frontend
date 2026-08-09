import { useCallback, useEffect, useState } from 'react';
import { joinVoiceRoom } from '../../../../../shared/services/API';
import { showToast } from '../../../../../shared/services/toast';
import {
  readCommunityChannelSelection,
  storeCommunityChannelSelection,
} from '../utils/communityChatStorage';

const getInitialSelection = (communityId, roomCode) => {
  const storedSelection = readCommunityChannelSelection(communityId);

  return {
    activeChatRoomCode: storedSelection?.chatRoomCode || null,
    currentMode: storedSelection?.mode || 'chat',
    currentRoomCode: roomCode || storedSelection?.roomCode || null,
    currentRoomTitle: storedSelection?.title || '#general',
    selectedChannelId: storedSelection?.channelId || null,
    voiceRoomData: storedSelection?.voiceRoomData || null,
  };
};

const getVoiceRoomData = (janusRoomId, userEmail, joinResponse) => {
  const data = joinResponse?.data || joinResponse;
  return {
    janusRoomId,
    sessionId: data?.sessionId || null,
    handleId: data?.handleId || null,
    userId: userEmail,
  };
};

export const useCommunityChannelSelection = ({
  communityId,
  roomCode,
  userEmail,
}) => {
  const [selection, setSelection] = useState(() => (
    getInitialSelection(communityId, roomCode)
  ));

  const storeSelection = useCallback((channelSelection) => {
    storeCommunityChannelSelection(communityId, channelSelection);
  }, [communityId]);

  const joinSelectedVoiceRoom = useCallback(async (janusRoomId, joinResponseKey) => {
    try {
      const joinResponse = await joinVoiceRoom(janusRoomId, userEmail);
      console.log('Auto-joined voice room:', joinResponse);
      sessionStorage.setItem(joinResponseKey, JSON.stringify(joinResponse));

      const voiceRoomData = getVoiceRoomData(janusRoomId, userEmail, joinResponse);
      if (!voiceRoomData.sessionId || !voiceRoomData.handleId) return;

      setSelection((currentSelection) => ({
        ...currentSelection,
        voiceRoomData,
      }));
      window.dispatchEvent(new CustomEvent('voice-room:joined', {
        detail: voiceRoomData,
      }));

      const storedSelection = readCommunityChannelSelection(communityId);
      if (storedSelection) {
        storeSelection({ ...storedSelection, voiceRoomData });
      }
    } catch (error) {
      console.error('Failed to auto-join voice room:', error);
      if (!error?.message?.includes('403')) {
        showToast(error?.message || 'Failed to join voice room', 'error');
      }
      setSelection((currentSelection) => ({
        ...currentSelection,
        voiceRoomData: null,
      }));
    }
  }, [communityId, storeSelection, userEmail]);

  useEffect(() => {
    const handleChannelSelect = (event) => {
      const {
        channelId,
        roomCode: nextRoomCode,
        chatRoomCode,
        janusRoomId,
      } = event.detail || {};
      const nextBaseSelection = {
        ...selection,
        activeChatRoomCode: chatRoomCode || null,
        currentRoomCode: nextRoomCode || selection.currentRoomCode,
      };

      if (!channelId || typeof channelId !== 'string') {
        setSelection(nextBaseSelection);
        return;
      }

      const channelParts = channelId.split(':');
      if (channelParts.length >= 3) {
        const mode = channelParts[1] === 'voice' ? 'voice' : 'chat';
        const title = `# ${channelParts[2]}`;
        let voiceRoomData = null;

        if (mode === 'voice' && janusRoomId) {
          const joinResponseKey = `voiceRoomJoin_${janusRoomId}`;
          const storedJoinResponse = sessionStorage.getItem(joinResponseKey);

          if (storedJoinResponse) {
            try {
              voiceRoomData = getVoiceRoomData(
                janusRoomId,
                userEmail,
                JSON.parse(storedJoinResponse),
              );
            } catch (error) {
              console.error('Failed to parse join response:', error);
            }
          } else if (userEmail) {
            voiceRoomData = getVoiceRoomData(janusRoomId, userEmail, null);
            joinSelectedVoiceRoom(janusRoomId, joinResponseKey);
          }
        }

        const nextSelection = {
          ...nextBaseSelection,
          selectedChannelId: channelId,
          currentMode: mode,
          currentRoomTitle: title,
          voiceRoomData,
        };
        setSelection(nextSelection);
        storeSelection({
          channelId,
          roomCode: nextRoomCode || selection.currentRoomCode || roomCode,
          chatRoomCode,
          mode,
          title,
          voiceRoomData,
        });
        return;
      }

      if (channelId.startsWith('announcement:') || channelId === 'general') {
        const nextSelection = {
          ...nextBaseSelection,
          selectedChannelId: channelId,
          currentMode: 'chat',
          currentRoomTitle: '# general',
          activeChatRoomCode: channelId || 'announcement:general',
          voiceRoomData: null,
        };
        setSelection(nextSelection);
        storeSelection({
          channelId,
          roomCode: nextRoomCode || selection.currentRoomCode || roomCode,
          chatRoomCode: channelId || 'announcement:general',
          mode: 'chat',
          title: '# general',
          voiceRoomData: null,
        });
      }
    };

    window.addEventListener('community:channel-selected', handleChannelSelect);
    return () => {
      window.removeEventListener('community:channel-selected', handleChannelSelect);
    };
  }, [joinSelectedVoiceRoom, roomCode, selection, storeSelection, userEmail]);

  useEffect(() => {
    const handleVoiceRoomJoin = (event) => {
      const { janusRoomId, sessionId, handleId, userId } = event.detail || {};
      if (!janusRoomId || !sessionId || !handleId || !userId) return;

      const voiceRoomData = { janusRoomId, sessionId, handleId, userId };
      setSelection((currentSelection) => ({
        ...currentSelection,
        voiceRoomData,
      }));

      const storedSelection = readCommunityChannelSelection(communityId);
      if (storedSelection) {
        storeSelection({ ...storedSelection, voiceRoomData });
      }
    };

    window.addEventListener('voice-room:joined', handleVoiceRoomJoin);
    return () => {
      window.removeEventListener('voice-room:joined', handleVoiceRoomJoin);
    };
  }, [communityId, storeSelection]);

  return selection;
};
