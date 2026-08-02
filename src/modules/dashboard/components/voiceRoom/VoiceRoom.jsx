import React, { useMemo } from 'react';

const VoiceRoom = ({
  title = '# general',
  participants = [],
  localMuted = false,
  isConnected = false,
  callActive = false,
  callEnded = false,
  onToggleMute,
  onLeave,
  onStartCall = () => {},
  onBack = null,
}) => {
  const placeholderAvatar = '/avatars/avatar-1.png';
  const participantCount = participants.length;

  const gridConfig = useMemo(() => {
    if (participantCount === 0) {
      return { cols: 1, aspectRatio: '16/9' };
    } else if (participantCount === 1) {
      return { cols: 1, aspectRatio: '16/9' };
    } else if (participantCount === 2) {
      return { cols: 2, aspectRatio: '16/9' };
    } else if (participantCount <= 4) {
      return { cols: 2, aspectRatio: '16/9' };
    } else {
      return { cols: 'auto-fit', aspectRatio: '16/9', minTileSize: 200 };
    }
  }, [participantCount]);

  const Tile = ({ p }) => {
    return (
      <div
        className="relative bg-white rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-in-out border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl shadow-md"
        style={{
          aspectRatio: gridConfig.aspectRatio,
          minHeight: '120px',
        }}
      >
        {/* Video/Avatar Container */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white border-4 border-gray-200 shadow-xl ring-4 ring-white/50">
            <img
              src={p?.avatarUrl || placeholderAvatar}
              alt={p?.name || 'user'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Name and Status Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-700/90 via-gray-600/80 to-transparent p-3 sm:p-4">
          <div className="text-white font-semibold text-sm sm:text-base truncate mb-1" title={p?.name || ''}>
            {p?.name || 'Member'}
          </div>
          <div className="flex items-center gap-2">
            {p?.muted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/90 text-white rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                Muted
              </span>
            ) : p?.isSpeaking ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/90 text-white rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
                Speaking
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-600/90 text-white rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Idle
              </span>
            )}
          </div>
        </div>

        {/* Speaking indicator border */}
        {p?.isSpeaking && !p?.muted && (
          <div className="absolute inset-0 border-4 border-green-500 rounded-xl animate-pulse pointer-events-none shadow-lg" />
        )}
      </div>
    );
  };

  // Generate grid classes based on participant count
  const getGridClasses = () => {
    if (participantCount === 0 || participantCount === 1) {
      return 'grid-cols-1';
    } else if (participantCount === 2) {
      return 'grid-cols-1 sm:grid-cols-2';
    } else if (participantCount <= 4) {
      return 'grid-cols-1 sm:grid-cols-2';
    } else {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
  };
  const getGridStyle = () => {
    if (participantCount === 0 || participantCount === 1) {
      return { width: '100%', maxWidth: '800px' };
    } else if (participantCount === 2) {
      return { width: '100%', maxWidth: '1200px' };
    } else if (participantCount <= 4) {
      return { width: '100%', maxWidth: '1400px' };
    } else {
      return { width: '100%', maxWidth: '1800px' };
    }
  };

  const showCallEnded = callEnded || (!callActive && participantCount === 0);
  const showConnecting = callActive && !isConnected && !showCallEnded;
  const showWaiting = !showCallEnded && !showConnecting && participantCount === 0 && callActive;

  return (
    <div className="flex-1 bg-gray-50 h-full md:h-[calc(100vh-56px)] flex flex-col rounded-xl border border-gray-300 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="h-14 md:h-16 border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button - Mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
              <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5c-.55 0-1-.45-1-1V9c0-3.87 3.13-7 7-7s7 3.13 7 7v2c0 .55-.45 1-1 1h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
            </svg>
          </div>
          <div className="font-semibold text-gray-800 truncate text-base md:text-lg">{title}</div>
          {callActive && participantCount > 0 && (
            <span className="text-xs text-gray-500 ml-2 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </span>
          )}
        </div>
      </div>

      {/* Video Grid Container - Centered and responsive */}
      <div className="flex-1 overflow-auto min-h-0 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        {showCallEnded ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center border-4 border-gray-200 shadow-lg">
                <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13H7v-2h10v2z" />
                </svg>
              </div>
              <p className="text-lg text-gray-700 font-semibold mb-2">Call ended</p>
              <p className="text-sm text-gray-500 mb-6">Start the call again to invite participants back</p>
            </div>
          </div>
        ) : showConnecting ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center border-4 border-blue-200 shadow-lg animate-spin">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8" />
                </svg>
              </div>
              <p className="text-lg text-gray-700 font-semibold mb-2">Connecting to the voice room...</p>
              <p className="text-sm text-gray-500">Hang tight while we set things up for you</p>
            </div>
          </div>
        ) : showWaiting ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center border-4 border-gray-200 shadow-lg">
                <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5c-.55 0-1-.45-1-1V9c0-3.87 3.13-7 7-7s7 3.13 7 7v2c0 .55-.45 1-1 1h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                </svg>
              </div>
              <p className="text-lg text-gray-700 font-semibold mb-2">Waiting for participants...</p>
              <p className="text-sm text-gray-500">Participants will appear here when they join</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div
              className={`grid ${getGridClasses()} gap-3 sm:gap-4 md:gap-5`}
              style={{
                ...getGridStyle(),
                gridAutoRows: participantCount > 4 ? 'minmax(120px, 1fr)' : '1fr',
                alignContent: 'center',
                justifyItems: 'stretch',
              }}
            >
              {participants.map((p, index) => (
                <Tile key={p?.id || p?.email || `participant-${index}`} p={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 sm:pb-6 flex-shrink-0">
        {showCallEnded ? (
          <div className="mx-auto w-full sm:w-[min(360px,90%)] bg-white/90 border border-gray-200 rounded-2xl shadow-lg px-4 py-4 flex items-center justify-center">
            <button
              onClick={onStartCall}
              className="w-full h-12 sm:h-14 rounded-xl flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Start call
            </button>
          </div>
        ) : (
          <div className="mx-auto w-full sm:w-[min(400px,90%)] bg-black/80 rounded-2xl flex items-center justify-center gap-4 sm:gap-6 py-4 px-4 border border-gray-200 shadow-lg">
            <button
              onClick={onToggleMute}
              disabled={!isConnected}
              className={`w-28 sm:w-32 h-12 sm:h-14 rounded-xl flex items-center justify-center text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                localMuted 
                  ? 'bg-white hover:bg-gray-100' 
                  : 'bg-[#595959]'
              }`}
              title={localMuted ? 'Unmute' : 'Mute'}
            >
              <img
                src="/icons/mutecall.svg"
                alt={localMuted ? 'Unmute microphone' : 'Mute microphone'}
                className="w-[70px] h-9 object-contain"
              />
            </button>
            <button
              onClick={onLeave}
              disabled={!isConnected && !callActive}
              className="w-28 sm:w-32 h-12 sm:h-14 rounded-xl flex items-center justify-center text-white bg-red-500 hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              title="Leave"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="sm:w-[24px] sm:h-[24px]">
                <path d="M12 7c-4.97 0-9 2.69-9 6v3h6v-3H5.08c.74-1.77 3.52-3 6.92-3s6.18 1.23 6.92 3H15v3h6v-3c0-3.31-4.03-6-9-6z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRoom;
