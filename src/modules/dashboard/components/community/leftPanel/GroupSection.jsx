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
          const voiceRoomsData = response?.voiceRooms || [];
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
            const voiceRoomsData = response?.voiceRooms || [];
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
  
  const isAnnouncement = (groupName || '').toLowerCase() === 'announcement';
  
  const allChatRooms = useMemo(() => {
    const chatRoomList = chatRooms || [];
    const filteredChatRooms = isAnnouncement
      ? chatRoomList
      : chatRoomList.filter(ch => ch !== 'general' && ch !== 'General');
    const merged = [...filteredChatRooms];
    fetchedChatrooms.forEach((name) => {
      if (!merged.includes(name)) {
        merged.push(name);
      }
    });
    return merged;
  }, [chatRooms, fetchedChatrooms, isAnnouncement]);

  // Handle chatroom deletion
  const handleDeleteChatroom = useCallback((chatroomName) => {
    setFetchedChatrooms((prev) => prev.filter(name => name !== chatroomName));
  }, []);

  const allVoiceRooms = useMemo(() => {
    const filteredVoiceRooms = (voiceRooms || []).filter(
      ch => ch !== 'general' && ch !== 'General'
    );
    const merged = [...filteredVoiceRooms];
    fetchedVoiceRooms.forEach((name) => {
      if (!merged.includes(name)) {
        merged.push(name);
      }
    });
    return merged;
  }, [voiceRooms, fetchedVoiceRooms]);

  const generalChatroom = isAnnouncement ? allChatRooms.find(ch => ch.toLowerCase() === 'general') : null;
  
  const hasNoRooms = allChatRooms.length === 0 && allVoiceRooms.length === 0;
  
  return (
    <div className="mb-3">
      <div className="flex items-center text-base text-gray-800">
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
          <span className="text-gray-800">{groupName}</span>
        </button>
      </div>
      {open && (
        <div className="mt-2">
          {isAnnouncement ? (
            // For Announcement group, show general chatroom directly
            loadingChatrooms ? (
              <div className="pl-5">
                <div className="h-8 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ) : generalChatroom ? (
              <div className="pl-5 space-y-1">
                <button
                  onClick={() => {
                    const channelId = `${groupName}:chat:${generalChatroom}`;
                    onSelectChannel?.(channelId, roomCode, roomId);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                    selectedChannel === `${groupName}:chat:${generalChatroom}`
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  # {generalChatroom}
                </button>
              </div>
            ) : (
              // Fallback: show general even if not found in fetched list (it should be in chatRooms prop)
              <div className="pl-5 space-y-1">
                <button
                  onClick={() => {
                    const channelId = `${groupName}:chat:general`;
                    onSelectChannel?.(channelId, roomCode, roomId);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                    selectedChannel === `${groupName}:chat:general`
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  # general
                </button>
              </div>
            )
          ) : loadingChatrooms || loadingVoiceRooms ? (
            <div className="ml-4 space-y-2">
              {/* Shimmer for Chat Room section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="pl-5 space-y-1">
                  <div className="h-8 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-8 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              {/* Shimmer for Voice Room section */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="pl-5 space-y-1">
                  <div className="h-8 w-full bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : hasNoRooms ? (
            <div className="ml-4 px-3 py-4 text-xs text-gray-500 italic bg-gray-50 rounded-md border border-gray-200">
              <p className="mb-2">No channels yet. Create a channel to get started!</p>
              {canCreate && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddChatRoom(groupName)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Create Chat Room
                  </button>
                  <button
                    onClick={() => onAddVoiceRoom(groupName)}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    Create Voice Room
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <RoomSection
                title="Chat room"
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
              <RoomSection
                title="Voice room"
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
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSection;

