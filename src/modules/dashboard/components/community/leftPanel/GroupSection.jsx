import React, { useMemo, useState } from 'react';
import RoomSection from './RoomSection';

const GroupSection = ({ groupName, open, onToggle, chatRooms, voiceRooms, onAddChatRoom, onAddVoiceRoom, selectedChannel, onSelectChannel, roomCode, roomId, isLocalGroup = false, canCreate = false, currentUserRole = '', onDeleteVoiceRoom = null, user = null, onSwitchToGeneral = null, onRefreshGroups = null }) => {
  const [chatOpen, setChatOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(true);

  const allChatRooms = useMemo(() => {
    const chatRoomList = chatRooms || [];
    return chatRoomList.filter(ch => ch.toLowerCase() !== 'general');
  }, [chatRooms]);

  const allVoiceRooms = useMemo(() => {
    const filteredVoiceRooms = (voiceRooms || []).filter(
      ch => ch.toLowerCase() !== 'general' && ch.toLowerCase() !== 'voice-lounge'
    );
    return filteredVoiceRooms;
  }, [voiceRooms]);

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
            currentUserRole={currentUserRole}
            user={user}
            onSwitchToGeneral={onSwitchToGeneral}
            onRefreshGroups={onRefreshGroups}
          />

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
