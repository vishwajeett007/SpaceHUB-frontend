import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVoiceRoom } from '../../../../shared/hooks/useVoiceRoom';
import {
  getCachedCommunityAvatar,
  getCachedCommunityUsername,
} from '../community/utils/communityMemberCache';
import VoiceRoom from './VoiceRoom';

const CommunityVoiceRoom = ({ title, voiceRoomData, communityId, onBack = null }) => {
  const hasConnectionParams = Boolean(
    voiceRoomData?.janusRoomId &&
    voiceRoomData?.sessionId &&
    voiceRoomData?.handleId &&
    voiceRoomData?.userId
  );
  const [callActive, setCallActive] = useState(hasConnectionParams);
  const [callEnded, setCallEnded] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const previousJanusRoomIdRef = useRef(voiceRoomData?.janusRoomId);

  useEffect(() => {
    const currentJanusRoomId = voiceRoomData?.janusRoomId;
    const previousJanusRoomId = previousJanusRoomIdRef.current;

    if (previousJanusRoomId && currentJanusRoomId && previousJanusRoomId !== currentJanusRoomId) {
      setCallActive(false);
      setCallEnded(false);
      setHasConnectedOnce(false);
      previousJanusRoomIdRef.current = currentJanusRoomId;

      const timer = setTimeout(() => {
        if (hasConnectionParams) setCallActive(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    previousJanusRoomIdRef.current = currentJanusRoomId;
    setCallActive(hasConnectionParams);
    setCallEnded(false);
    setHasConnectedOnce(false);
  }, [
    hasConnectionParams,
    voiceRoomData?.handleId,
    voiceRoomData?.janusRoomId,
    voiceRoomData?.sessionId,
    voiceRoomData?.userId,
  ]);

  const enabled = hasConnectionParams && callActive;
  const {
    isConnected,
    participants,
    isMuted,
    isVideoOn,
    error,
    toggleMute,
    toggleVideo,
    leave,
  } = useVoiceRoom(
    voiceRoomData?.janusRoomId,
    voiceRoomData?.sessionId,
    voiceRoomData?.handleId,
    voiceRoomData?.userId,
    enabled,
    communityId
  );

  useEffect(() => {
    if (enabled && isConnected) {
      setHasConnectedOnce(true);
      setCallEnded(false);
    }
  }, [enabled, isConnected]);

  useEffect(() => {
    if (!callActive && hasConnectedOnce) setCallEnded(true);
  }, [callActive, hasConnectedOnce]);

  useEffect(() => leave, [leave]);

  const getAvatar = useCallback(
    (email) => getCachedCommunityAvatar(communityId, email),
    [communityId]
  );
  const getUsername = useCallback(
    (email) => getCachedCommunityUsername(communityId, email),
    [communityId]
  );

  const enrichedParticipants = useMemo(() => participants.map((participant) => {
    const participantId = participant.userId || participant.email || '';
    return {
      ...participant,
      avatarUrl: getAvatar(participantId) || participant.avatarUrl || '/avatars/avatar-1.png',
      name: participant.name || getUsername(participantId) ||
        (participantId ? participantId.split('@')[0] : 'Member'),
      email: participantId,
    };
  }), [getAvatar, getUsername, participants]);

  useEffect(() => {
    if (error) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: error, type: 'error' }
      }));
    }
  }, [error]);

  const handleLeave = () => {
    leave();
    setCallActive(false);
    setCallEnded(true);
    setHasConnectedOnce(true);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: 'Call has ended', type: 'info' }
    }));

    if (onBack && window.innerWidth <= 640) {
      setTimeout(onBack, 100);
    }
  };

  return (
    <VoiceRoom
      title={title}
      participants={enrichedParticipants}
      localMuted={isMuted}
      localVideoOn={isVideoOn}
      isConnected={isConnected}
      callActive={callActive}
      callEnded={callEnded}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
      onLeave={handleLeave}
      onStartCall={() => {
        setCallEnded(false);
        setCallActive(true);
      }}
      onBack={onBack}
    />
  );
};

export default CommunityVoiceRoom;
