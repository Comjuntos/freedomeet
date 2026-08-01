import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream;
}

export function useWebRTC(roomId: string, userName: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerId = useRef(Math.random().toString(36).substring(7));
  const connections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);
  const initialized = useRef(false);

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error("Erro ao acessar câmera/microfone", e);
      return null;
    }
  };

  const createPeerConnection = (targetId: string, targetName: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    connections.current.set(targetId, pc);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.current?.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { target: targetId, source: peerId.current, candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      setRemotePeers(prev => {
        const existing = prev.find(p => p.id === targetId);
        if (existing) {
          return prev;
        }
        return [...prev, { id: targetId, name: targetName, stream: event.streams[0] }];
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
        removePeer(targetId);
      }
    };

    return pc;
  };

  const removePeer = (id: string) => {
    const pc = connections.current.get(id);
    if (pc) {
      pc.close();
      connections.current.delete(id);
    }
    setRemotePeers(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (!userName || initialized.current) return;
    initialized.current = true;
    
    let activeStream: MediaStream | null = null;

    const init = async () => {
      const stream = await startLocalStream();
      if (!stream) return;
      activeStream = stream;

      const ch = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false } }
      });
      channel.current = ch;

      ch.on("broadcast", { event: "join" }, async ({ payload }) => {
        const { source, name } = payload;
        const pc = createPeerConnection(source, name, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ch.send({
          type: "broadcast",
          event: "offer",
          payload: { target: source, source: peerId.current, name: userName, offer }
        });
      });

      ch.on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (payload.target !== peerId.current) return;
        const { source, name, offer } = payload;
        const pc = createPeerConnection(source, name, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ch.send({
          type: "broadcast",
          event: "answer",
          payload: { target: source, source: peerId.current, answer }
        });
      });

      ch.on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (payload.target !== peerId.current) return;
        const { source, answer } = payload;
        const pc = connections.current.get(source);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      ch.on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        if (payload.target !== peerId.current) return;
        const { source, candidate } = payload;
        const pc = connections.current.get(source);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      ch.on("broadcast", { event: "leave" }, ({ payload }) => {
        removePeer(payload.source);
      });

      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.send({
            type: "broadcast",
            event: "join",
            payload: { source: peerId.current, name: userName }
          });
        }
      });
    };

    init();

    return () => {
      channel.current?.send({
        type: "broadcast",
        event: "leave",
        payload: { source: peerId.current }
      });
      channel.current?.unsubscribe();
      connections.current.forEach(pc => pc.close());
      connections.current.clear();
      activeStream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId, userName]);

  const toggleMute = useCallback(() => {
    setLocalStream(prevStream => {
      if (prevStream) {
        prevStream.getAudioTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsMuted(prev => !prev);
      }
      return prevStream;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setLocalStream(prevStream => {
      if (prevStream) {
        prevStream.getVideoTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsVideoOff(prev => !prev);
      }
      return prevStream;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    setLocalStream(prevStream => {
      if (!prevStream) return prevStream;
      
      const doToggle = async () => {
        if (isScreenSharing) {
          if (originalVideoTrack.current) {
            const videoTrack = originalVideoTrack.current;
            prevStream.removeTrack(prevStream.getVideoTracks()[0]);
            prevStream.addTrack(videoTrack);
            
            connections.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track?.kind === "video");
              if (sender) sender.replaceTrack(videoTrack);
            });
            setIsScreenSharing(false);
          }
        } else {
          try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];
            
            screenTrack.onended = () => {
              toggleScreenShare();
            };
            
            originalVideoTrack.current = prevStream.getVideoTracks()[0];
            
            prevStream.removeTrack(originalVideoTrack.current);
            prevStream.addTrack(screenTrack);
            
            connections.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track?.kind === "video");
              if (sender) sender.replaceTrack(screenTrack);
            });
            
            setIsScreenSharing(true);
          } catch (e) {
            console.error("Erro ao compartilhar tela", e);
          }
        }
      };
      
      doToggle();
      return prevStream;
    });
  }, [isScreenSharing]);

  return {
    localStream,
    remotePeers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  };
}
