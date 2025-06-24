import React, { useEffect, useState, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectPeers,
} from "@100mslive/react-sdk";
import axios from "axios";

const VideoConference = ({ userId, role }) => {
  const hmsActions = useHMSActions();
  const peers = useHMSStore(selectPeers);

  const [joined, setJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const videoRefs = useRef({});

  // Auto-join logic
  useEffect(() => {
    const joinCall = async () => {
      const finalRoomId = import.meta.env.VITE_HMS_ROOM_ID;

      if (!finalRoomId || !userId) {
        console.error("❌ Missing HMS_ROOM_ID or userId");
        return;
      }

      const mappedRole =
        role === "doctor" || role === "patient" ? "broadcaster" : "viewer";

      try {
        console.log("📡 Requesting token with:", {
          userId,
          roomId: finalRoomId,
          role: mappedRole,
        });

        const response = await axios.post(
          "http://localhost:4000/api/100ms/generate-token",
          {
            user_id: userId,
            room_id: finalRoomId,
            role: mappedRole,
          }
        );

        const token = response.data.token;

        await hmsActions.join({
          userName: userId,
          authToken: token,
          settings: {
            isAudioMuted: false,
            isVideoMuted: false,
          },
        });

        setJoined(true);
      } catch (error) {
        console.error("🔴 Error joining room:", error);
      }
    };

    joinCall();
  }, [userId, role, hmsActions]);

  // Attach video to peer refs
  useEffect(() => {
    peers.forEach((peer) => {
      if (!videoRefs.current[peer.id]) {
        videoRefs.current[peer.id] = React.createRef();
      }

      if (peer.videoTrack && videoRefs.current[peer.id].current) {
        hmsActions.attachVideo(
          peer.videoTrack,
          videoRefs.current[peer.id].current
        );
      }
    });
  }, [peers, hmsActions]);

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(isAudioMuted);
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(isVideoMuted);
    setIsVideoMuted(!isVideoMuted);
  };

  const leaveCall = async () => {
    await hmsActions.leave();
    setJoined(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Live Video Consultation</h2>

      {!joined ? (
        <p className="text-gray-600">Joining video call...</p>
      ) : (
        <>
          <div className="relative h-[70vh] bg-gray-200 rounded overflow-hidden">
            {peers.map((peer, index) => (
              <div
                key={peer.id}
                className={`absolute ${
                  index === 0
                    ? "w-full h-full"
                    : "w-40 h-40 bottom-4 right-4 border-2 border-white"
                }`}
              >
                <video
                  ref={videoRefs.current[peer.id]}
                  autoPlay
                  muted={peer.isLocal}
                  className="w-full h-full rounded shadow"
                />
                <p className="absolute bottom-1 left-1 bg-black text-white text-xs px-2 py-0.5 rounded opacity-80">
                  {peer.name}
                </p>
              </div>
            ))}
          </div>

          <div className="space-x-2 mt-4">
            <button
              onClick={toggleAudio}
              className="bg-yellow-500 px-3 py-1 rounded text-white"
            >
              {isAudioMuted ? "Unmute Mic" : "Mute Mic"}
            </button>
            <button
              onClick={toggleVideo}
              className="bg-purple-500 px-3 py-1 rounded text-white"
            >
              {isVideoMuted ? "Show Video" : "Hide Video"}
            </button>
            <button
              onClick={leaveCall}
              className="bg-red-600 px-3 py-1 rounded text-white"
            >
              End Call
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoConference;
