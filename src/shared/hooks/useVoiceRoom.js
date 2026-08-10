import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL } from '../services/API';

const getSocketServerUrl = () => {
  if (BASE_URL) {
    try {
      const url = new URL(BASE_URL);
      return url.origin;
    } catch {

    }
  }
  return typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000';
};

export const useVoiceRoom = (
  janusRoomId,
  sessionId,
  handleId,
  userId,
  enabled = false,
  communityId = null
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const audioContainerRef = useRef(null);

  const log = useCallback((msg) => {
    console.log(`[VoiceRoom] ${msg}`);
  }, []);

  const resolveParticipantName = useCallback((identifier) => {
    if (!identifier) return 'Member';
    if (communityId) {
      try {
        const usernames = JSON.parse(
          sessionStorage.getItem(`community_usernames_${communityId}`) || '{}'
        );
        const normalized = String(identifier).toLowerCase();
        if (usernames[normalized]) return usernames[normalized];
      } catch (e) {

      }
    }
    if (typeof identifier === 'string' && identifier.includes('@')) {
      return identifier.split('@')[0];
    }
    return identifier;
  }, [communityId]);

  useEffect(() => {
    if (enabled && janusRoomId) {
      let container = document.getElementById('voice-room-audio-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'voice-room-audio-container';
        container.style.display = 'none';
        document.body.appendChild(container);
      }
      audioContainerRef.current = container;
    }
  }, [enabled, janusRoomId]);

  const flushPendingIceCandidates = useCallback(async (peerSocketId, pc) => {
    const pending = pendingIceCandidatesRef.current.get(peerSocketId) || [];
    if (pending.length > 0 && pc.remoteDescription) {
      log(`🧊 Flushing ${pending.length} queued ICE candidates for ${peerSocketId}`);
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          log(`Error adding queued ICE candidate: ${e.message}`);
        }
      }
      pendingIceCandidatesRef.current.delete(peerSocketId);
    }
  }, [log]);

  const cleanup = useCallback(() => {
    log('Cleaning up voice/video room connections...');

    if (socketRef.current) {
      const sock = socketRef.current;
      socketRef.current = null;
      try {
        sock.emit('webrtc_leave_room');
        sock.disconnect();
      } catch (e) {
        log(`Error closing socket: ${e.message}`);
      }
    }

    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {

      }
    });
    peerConnectionsRef.current.clear();
    pendingIceCandidatesRef.current.clear();
    remoteStreamsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = '';
    }

    setIsConnected(false);
    setIsVideoOn(false);
    setIsMuted(false);
    setParticipants([]);
  }, [log]);

  useEffect(() => cleanup, [cleanup]);

  const createPeerConnection = useCallback((peerSocketId, peerUserId) => {
    if (peerConnectionsRef.current.has(peerSocketId)) {
      return peerConnectionsRef.current.get(peerSocketId);
    }

    log(`Creating RTCPeerConnection for peer: ${peerUserId} (${peerSocketId})`);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', {
          targetSocketId: peerSocketId,
          candidate: event.candidate,
          roomId: String(janusRoomId),
        });
      }
    };

    pc.ontrack = (event) => {
      log(`🎁 Received remote track from peer: ${peerUserId}`);
      const stream = event.streams[0];
      if (!stream) return;

      remoteStreamsRef.current.set(peerSocketId, stream);

      setParticipants((prev) =>
        prev.map((p) => (p.socketId === peerSocketId ? { ...p, stream } : p))
      );

      const audioId = `remote-audio-${peerSocketId}`;
      let audio = document.getElementById(audioId);
      if (audio) {
        audio.srcObject = stream;
      } else {
        audio = document.createElement('audio');
        audio.id = audioId;
        audio.autoplay = true;
        audio.playsInline = true;
        audio.srcObject = stream;
        if (audioContainerRef.current) {
          audioContainerRef.current.appendChild(audio);
        }
      }

      audio.play().catch((err) => {
        log(`Audio autoplay warning for ${peerUserId}: ${err.message}`);
      });
    };

    peerConnectionsRef.current.set(peerSocketId, pc);
    return pc;
  }, [janusRoomId, log]);

  const connectVoiceRoom = useCallback(async () => {
    if (!janusRoomId || !userId) {
      log('Missing janusRoomId or userId for voice/video room connection');
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      log('Socket.IO voice room connection already active');
      return;
    }

    log('Initializing media access (audio & video)...');
    try {

      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
      }
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
      }
      log('🎤📷 Media access granted (initial state: mic muted, camera off)');
    } catch (err) {
      log(`⚠️ Video media error fallback to audio-only: ${err.message}`);
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
        log('🎤 Audio-only media access granted (initial state: mic muted)');
      } catch (audioErr) {
        log(`❌ Audio media error: ${audioErr.message}`);
        setError(`Media access failed: ${audioErr.message}`);
      }
    }

    const socketUrl = getSocketServerUrl();
    log(`🔌 Connecting to Socket.IO Server: ${socketUrl}`);

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      log(`✅ Socket.IO connected (${socket.id}). Joining room: ${janusRoomId}`);
      setIsConnected(true);
      setError(null);

      socket.emit('webrtc_join_room', {
        roomId: String(janusRoomId),
        userId: userId,
      });

      socket.emit('webrtc_mute_status', {
        roomId: String(janusRoomId),
        isMuted: true,
      });

      socket.emit('webrtc_video_status', {
        roomId: String(janusRoomId),
        isVideoOn: false,
      });

      setParticipants([
        {
          userId,
          socketId: socket.id,
          name: resolveParticipantName(userId),
          muted: true,
          isVideoOn: false,
          isSelf: true,
          stream: localStreamRef.current,
        },
      ]);
    });

    socket.on('webrtc_existing_users', (existingPeers = []) => {
      log(`👥 Received ${existingPeers.length} existing room members`);
      existingPeers.forEach(async ({ userId: peerUserId, socketId: peerSocketId }) => {
        setParticipants((prev) => {
          if (prev.some((p) => p.userId === peerUserId || p.socketId === peerSocketId)) return prev;
          return [
            ...prev,
            {
              userId: peerUserId,
              socketId: peerSocketId,
              name: resolveParticipantName(peerUserId),
              muted: false,
              isVideoOn: false,
              isSelf: false,
              stream: remoteStreamsRef.current.get(peerSocketId) || null,
            },
          ];
        });

        try {
          const pc = createPeerConnection(peerSocketId, peerUserId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('webrtc_offer', {
            targetSocketId: peerSocketId,
            targetUserId: peerUserId,
            sdp: { type: offer.type || 'offer', sdp: offer.sdp },
            roomId: String(janusRoomId),
          });
          log(`📤 Sent SDP offer to existing peer ${peerUserId}`);
        } catch (err) {
          log(`Error sending offer to existing peer: ${err.message}`);
        }
      });
    });

    socket.on('webrtc_user_joined', async ({ userId: peerUserId, socketId: peerSocketId }) => {
      log(`👤 Remote peer joined: ${peerUserId} (${peerSocketId})`);

      setParticipants((prev) => {
        if (prev.some((p) => p.userId === peerUserId || p.socketId === peerSocketId)) return prev;
        return [
          ...prev,
          {
            userId: peerUserId,
            socketId: peerSocketId,
            name: resolveParticipantName(peerUserId),
            muted: false,
            isVideoOn: false,
            isSelf: false,
            stream: null,
          },
        ];
      });

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `${resolveParticipantName(peerUserId)} joined room`, type: 'info' },
        })
      );
    });

    socket.on('webrtc_offer', async ({ senderUserId, senderSocketId, sdp }) => {
      log(`📥 Received SDP offer from ${senderUserId}`);
      try {
        const pc = createPeerConnection(senderSocketId, senderUserId);
        const description = typeof sdp === 'string' ? { type: 'offer', sdp } : sdp;

        await pc.setRemoteDescription(new RTCSessionDescription(description));
        await flushPendingIceCandidates(senderSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc_answer', {
          targetSocketId: senderSocketId,
          targetUserId: senderUserId,
          sdp: { type: answer.type || 'answer', sdp: answer.sdp },
          roomId: String(janusRoomId),
        });
        log(`📤 Sent SDP answer to peer ${senderUserId}`);
      } catch (err) {
        log(`Error handling SDP offer from ${senderUserId}: ${err.message}`);
      }
    });

    socket.on('webrtc_answer', async ({ senderUserId, senderSocketId, sdp }) => {
      log(`📥 Received SDP answer from ${senderUserId}`);
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc) {
          const description = typeof sdp === 'string' ? { type: 'answer', sdp } : sdp;
          await pc.setRemoteDescription(new RTCSessionDescription(description));
          log(`✅ Remote description set for ${senderUserId}`);
          await flushPendingIceCandidates(senderSocketId, pc);
        }
      } catch (err) {
        log(`Error setting remote description from answer: ${err.message}`);
      }
    });

    socket.on('webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
      if (!candidate) return;
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        const iceCandidate = new RTCIceCandidate(candidate);

        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(iceCandidate);
        } else {
          if (!pendingIceCandidatesRef.current.has(senderSocketId)) {
            pendingIceCandidatesRef.current.set(senderSocketId, []);
          }
          pendingIceCandidatesRef.current.get(senderSocketId).push(iceCandidate);
        }
      } catch (err) {
        log(`Error adding ICE candidate: ${err.message}`);
      }
    });

    socket.on('webrtc_peer_mute_changed', ({ userId: peerUserId, isMuted: peerMuted }) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (
            p.userId === peerUserId ||
            (p.userId && peerUserId && p.userId.toLowerCase() === peerUserId.toLowerCase())
          ) {
            return { ...p, muted: peerMuted };
          }
          return p;
        })
      );
    });

    socket.on('webrtc_peer_video_changed', ({ userId: peerUserId, isVideoOn: peerVideoOn }) => {
      log(`📹 Video state changed for ${peerUserId}: ${peerVideoOn ? 'ON' : 'OFF'}`);
      setParticipants((prev) =>
        prev.map((p) => {
          if (
            p.userId === peerUserId ||
            (p.userId && peerUserId && p.userId.toLowerCase() === peerUserId.toLowerCase())
          ) {
            return { ...p, isVideoOn: peerVideoOn };
          }
          return p;
        })
      );
    });

    socket.on('webrtc_user_left', ({ userId: peerUserId, socketId: peerSocketId }) => {
      log(`👋 Remote peer left: ${peerUserId} (${peerSocketId})`);

      setParticipants((prev) =>
        prev.filter((p) => {
          if (p.isSelf) return true;

          const matchSocket = p.socketId && peerSocketId && p.socketId === peerSocketId;
          const matchUser =
            p.userId &&
            peerUserId &&
            (p.userId === peerUserId ||
              p.userId.toLowerCase() === peerUserId.toLowerCase() ||
              p.userId.split('@')[0].toLowerCase() === peerUserId.split('@')[0].toLowerCase());

          return !matchSocket && !matchUser;
        })
      );

      if (peerSocketId && peerConnectionsRef.current.has(peerSocketId)) {
        const pc = peerConnectionsRef.current.get(peerSocketId);
        try {
          pc.close();
        } catch (e) {

        }
        peerConnectionsRef.current.delete(peerSocketId);
      }
      pendingIceCandidatesRef.current.delete(peerSocketId);
      remoteStreamsRef.current.delete(peerSocketId);

      const audioElem = document.getElementById(`remote-audio-${peerSocketId}`);
      if (audioElem) {
        audioElem.remove();
      }

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `${resolveParticipantName(peerUserId)} left room`, type: 'info' },
        })
      );
    });

    socket.on('disconnect', () => {
      log('🔌 Socket.IO disconnected from Voice/Video Server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      log(`❌ Socket.IO Connection Error: ${err.message}`);
      setError(`Room server connection failed: ${err.message}`);
      setIsConnected(false);
    });
  }, [createPeerConnection, flushPendingIceCandidates, janusRoomId, log, resolveParticipantName, userId]);

  useEffect(() => {
    if (enabled && janusRoomId && userId) {
      connectVoiceRoom();
    } else {
      cleanup();
    }
  }, [connectVoiceRoom, cleanup, enabled, janusRoomId, userId]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMutedState = !isMuted;
        audioTracks[0].enabled = !newMutedState;
        setIsMuted(newMutedState);

        setParticipants((prev) =>
          prev.map((p) => (p.isSelf ? { ...p, muted: newMutedState } : p))
        );

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('webrtc_mute_status', {
            roomId: String(janusRoomId),
            isMuted: newMutedState,
          });
        }
        log(newMutedState ? '🔇 Muted microphone' : '🔊 Unmuted microphone');
      }
    }
  }, [isMuted, janusRoomId, log]);

  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return;

    let videoTracks = localStreamRef.current.getVideoTracks();

    if (videoTracks.length === 0) {
      try {
        log('📹 Requesting camera video stream...');
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newVideoTrack);

        peerConnectionsRef.current.forEach((pc) => {
          pc.addTrack(newVideoTrack, localStreamRef.current);
        });

        videoTracks = [newVideoTrack];
      } catch (err) {
        log(`❌ Failed to acquire camera: ${err.message}`);
        setError(`Camera access error: ${err.message}`);
        return;
      }
    }

    const newVideoState = !isVideoOn;
    videoTracks.forEach((track) => {
      track.enabled = newVideoState;
    });

    setIsVideoOn(newVideoState);

    setParticipants((prev) =>
      prev.map((p) => (p.isSelf ? { ...p, isVideoOn: newVideoState } : p))
    );

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('webrtc_video_status', {
        roomId: String(janusRoomId),
        isVideoOn: newVideoState,
      });
    }

    log(newVideoState ? '📹 Camera turned ON' : '📷 Camera turned OFF');
  }, [isVideoOn, janusRoomId, log]);

  const leave = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    isConnected,
    participants,
    isMuted,
    isVideoOn,
    error,
    toggleMute,
    toggleVideo,
    leave,
  };
};
