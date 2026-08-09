import React, { useMemo, useEffect, useRef } from 'react';

const VideoElement = ({ stream, isMuted, isSelf }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isSelf || isMuted}
      className="w-full h-full object-cover rounded-xl"
    />
  );
};

const VoiceRoom = ({
  title = '# general',
  participants = [],
  localMuted = false,
  localVideoOn = false,
  isConnected = false,
  callActive = false,
  callEnded = false,
  onToggleMute,
  onToggleVideo,
  onLeave,
  onStartCall = () => {},
  onBack = null,
}) => {
  const placeholderAvatar = '/avatars/avatar-1.png';
  const participantCount = participants.length;

  const gridConfig = useMemo(() => {
    if (participantCount <= 1) {
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
    const showVideo = Boolean((p?.isVideoOn || (p?.isSelf && localVideoOn)) && p?.stream);

    return (
      <div
        className="relative bg-gray-900 rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-in-out border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl shadow-md"
        style={{
          aspectRatio: gridConfig.aspectRatio,
          minHeight: '140px',
        }}
      >
        {/* Video or Avatar Container */}
        {showVideo ? (
          <VideoElement stream={p.stream} isMuted={p.muted} isSelf={p.isSelf} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-white border-4 border-gray-200 shadow-xl ring-4 ring-white/50">
              <img
                src={p?.avatarUrl || placeholderAvatar}
                alt={p?.name || 'user'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Name and Status Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 via-gray-800/60 to-transparent p-3 sm:p-4">
          <div className="text-white font-semibold text-sm sm:text-base truncate mb-1" title={p?.name || ''}>
            {p?.name || 'Member'} {p?.isSelf ? '(You)' : ''}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {p?.muted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-500/90 text-white rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                Muted
              </span>
            ) : p?.isSpeaking ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/90 text-white rounded-full text-xs font-medium">
                Speaking
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-600/90 text-white rounded-full text-xs font-medium">
                Idle
              </span>
            )}

            {(p?.isVideoOn || (p?.isSelf && localVideoOn)) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/90 text-white rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
                Cam On
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
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
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

      {/* Video Grid Container */}
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
              <p className="text-lg text-gray-700 font-semibold mb-2">Connecting to voice & video room...</p>
              <p className="text-sm text-gray-500">Hang tight while we set things up for you</p>
            </div>
          </div>
        ) : showWaiting ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center border-4 border-gray-200 shadow-lg">
                <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
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
                gridAutoRows: participantCount > 4 ? 'minmax(140px, 1fr)' : '1fr',
                alignContent: 'center',
                justifyItems: 'stretch',
              }}
            >
              {participants.map((p, index) => (
                <Tile key={p?.socketId || p?.id || p?.email || `participant-${index}`} p={p} />
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
          <div className="mx-auto w-full sm:w-[min(480px,95%)] bg-black/80 rounded-2xl flex items-center justify-center gap-3 sm:gap-5 py-4 px-4 border border-gray-200 shadow-lg">
            {/* Microphone Mute Toggle */}
            <button
              onClick={onToggleMute}
              disabled={!isConnected}
              className={`w-24 sm:w-28 h-12 sm:h-14 rounded-xl flex items-center justify-center text-white transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                localMuted ? 'bg-white text-gray-800' : 'bg-[#595959]'
              }`}
              title={localMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <img
                src="/icons/mutecall.svg"
                alt={localMuted ? 'Unmute microphone' : 'Mute microphone'}
                className="w-16 h-8 object-contain"
              />
            </button>

            {/* Camera Video Toggle */}
            <button
              onClick={onToggleVideo}
              disabled={!isConnected}
              className={`w-24 sm:w-28 h-12 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                localVideoOn
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-[#595959] hover:bg-gray-600 text-white'
              }`}
              title={localVideoOn ? 'Turn camera OFF' : 'Turn camera ON'}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </button>

            {/* Leave Room Button */}
            <button
              onClick={onLeave}
              disabled={!isConnected && !callActive}
              className="w-24 sm:w-28 h-12 sm:h-14 rounded-xl flex items-center justify-center text-white bg-red-500 hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              title="Leave room"
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
