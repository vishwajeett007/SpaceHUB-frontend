import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getChatroomsSummary,
  getVoiceRoomsList,
} from '../../../../../shared/services/API';
import RoomSection from './RoomSection';

const GroupSection = ({ groupName, open, onToggle, chatRooms, voiceRooms, onAddChatRoom, onAddVoiceRoom, selectedChannel, onSelectChannel, roomCode, roomId, isLocalGroup = false, canCreate = false, currentUserRole = '', onDeleteVoiceRoom = null, user = null, onSwitchToGeneral = null, onRefreshGroups = null }) => {
  const [chatOpen, setChatOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(true);
  const [fetchedChatrooms, setFetchedChatrooms] = useState([]);
  const [fetchedVoiceRooms, setFetchedVoiceRooms] = useState([]);
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  const [loadingVoiceRooms, setLoadingVoiceRooms] = useState(false);

  useEffect(() => {
    if (open && roomCode) {
      const fetchChatrooms = async () => {
        setLoadingChatrooms(true);
        try {
          const response = await getChatroomsSummary(roomCode);
          const chatroomsData = response?.data || [];
          const chatroomNames = chatroomsData.map((cr) => cr.name || cr.chatRoomCode).filter(Boolean);
          setFetchedChatrooms(chatroomNames);
        } catch (error) {
          console.error('Failed to fetch chatrooms:', error);
          setFetchedChatrooms([]);
        } finally {
          setLoadingChatrooms(false);
        }
      };
      
      fetchChatrooms();
    } else if (!open) {
      setFetchedChatrooms([]);
      }
  }, [open, roomCode]);

  useEffect(() => {
    if (open && roomId) {
      const fetchVoiceRooms = async () => {
        setLoadingVoiceRooms(true);
        try {
          const response = await getVoiceRoomsList(roomId);
          const voiceRoomsData = response?.data || response?.voiceRooms || [];
          const voiceRoomNames = voiceRoomsData.map((vr) => vr.name).filter(Boolean);
          setFetchedVoiceRooms(voiceRoomNames);
        } catch (error) {
          console.error('Failed to fetch voice rooms:', error);
          setFetchedVoiceRooms([]);
        } finally {
          setLoadingVoiceRooms(false);
        }
      };
      
      fetchVoiceRooms();
    } else if (!open) {
      setFetchedVoiceRooms([]);
    }
  }, [open, roomId, isLocalGroup]);

  useEffect(() => {
    if (!open || !roomId) return;

    const handleVoiceRoomCreated = (event) => {
      const { roomId: eventRoomId } = event.detail || {};
      if (eventRoomId === roomId || eventRoomId === String(roomId)) {
        // Refetch voice rooms when a new one is created
        const fetchVoiceRooms = async () => {
          try {
            const response = await getVoiceRoomsList(roomId);
            const voiceRoomsData = response?.data || response?.voiceRooms || [];
            const voiceRoomNames = voiceRoomsData.map((vr) => vr.name).filter(Boolean);
            setFetchedVoiceRooms(voiceRoomNames);
          } catch (error) {
            console.error('Failed to fetch voice rooms after creation:', error);
          }
        };
        fetchVoiceRooms();
      }
    };

    window.addEventListener('voice-room:created', handleVoiceRoomCreated);
    return () => {
      window.removeEventListener('voice-room:created', handleVoiceRoomCreated);
    };
  }, [open, roomId]);

  // Listen for chatroom creation events to refetch
  useEffect(() => {
    if (!open || !roomCode) return;

    const handleChatroomCreated = async () => {
      try {
        const response = await getChatroomsSummary(roomCode);
        const chatroomsData = response?.data || [];
        const chatroomNames = chatroomsData.map((cr) => cr.name || cr.chatRoomCode).filter(Boolean);
        setFetchedChatrooms(chatroomNames);
      } catch (error) {
        console.error('Failed to fetch chatrooms after creation:', error);
      }
    };

    window.addEventListener('chatroom:created', handleChatroomCreated);
    return () => {
      window.removeEventListener('chatroom:created', handleChatroomCreated);
    };
  }, [open, roomCode]);
  
  const isAnnouncement = (groupName || '').toLowerCase() === 'announcement';
  
  const allChatRooms = useMemo(() => {
    const chatRoomList = chatRooms || [];
    const filteredChatRooms = chatRoomList.filter(ch => ch.toLowerCase() !== 'general');
    const merged = [...filteredChatRooms];
    fetchedChatrooms.forEach((name) => {
      if (!merged.includes(name) && name.toLowerCase() !== 'general') {
        merged.push(name);
      }
    });
    return merged;
  }, [chatRooms, fetchedChatrooms]);

  // Handle chatroom deletion
  const handleDeleteChatroom = useCallback((chatroomName) => {
    setFetchedChatrooms((prev) => prev.filter(name => name !== chatroomName));
  }, []);

  const allVoiceRooms = useMemo(() => {
    const filteredVoiceRooms = (voiceRooms || []).filter(
      ch => ch.toLowerCase() !== 'general' && ch.toLowerCase() !== 'voice-lounge'
    );
    const merged = [...filteredVoiceRooms];
    fetchedVoiceRooms.forEach((name) => {
      if (!merged.includes(name) && name.toLowerCase() !== 'voice-lounge' && name.toLowerCase() !== 'general') {
        merged.push(name);
      }
    });
    return merged;
  }, [voiceRooms, fetchedVoiceRooms]);
  
  return (
    <div className="mb-3">
      <div className="flex items-center text-base text-gray-800 font-medium mb-1">
        <button onClick={onToggle} className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gray-600 transition-transform ${open ? 'rotate-90' : ''}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-gray-800 font-semibold">{groupName}</span>
        </button>
      </div>
      {open && (
        <div className="mt-1 space-y-1">
          {/* Chat rooms section */}
          <RoomSection
            title="Chat rooms"
            open={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
            onAdd={() => onAddChatRoom(groupName)}
            channels={allChatRooms}
            isVoice={false}
            selectedChannel={selectedChannel}
            onSelectChannel={onSelectChannel}
            groupName={groupName}
            roomCode={roomCode}
            isLocalGroup={isLocalGroup}
            canCreate={canCreate}
            onDeleteChatroom={handleDeleteChatroom}
            currentUserRole={currentUserRole}
            user={user}
            onSwitchToGeneral={onSwitchToGeneral}
            onRefreshGroups={onRefreshGroups}
          />

          {/* Voice rooms section */}
          <RoomSection
            title="Voice rooms"
            open={voiceOpen}
            onToggle={() => setVoiceOpen(!voiceOpen)}
            onAdd={() => onAddVoiceRoom(groupName)}
            channels={allVoiceRooms}
            isVoice={true}
            selectedChannel={selectedChannel}
            onSelectChannel={onSelectChannel}
            groupName={groupName}
            roomCode={roomCode}
            roomId={roomId}
            isLocalGroup={isLocalGroup}
            canCreate={canCreate}
            onDeleteVoiceRoom={onDeleteVoiceRoom}
            currentUserRole={currentUserRole}
            user={user}
            onSwitchToGeneral={onSwitchToGeneral}
            onRefreshGroups={onRefreshGroups}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(GroupSection);

