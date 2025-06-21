import React, { useEffect, useState, useContext, useRef } from "react";
import {
  useHMSActions,
  useHMSStore,
  selectPeers,
} from "@100mslive/react-sdk";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useSearchParams } from "react-router-dom";

const VideoConference = () => {
  const { userData, userLoading } = useContext(AppContext);
  const hmsActions = useHMSActions();
  const peers = useHMSStore(selectPeers);
  const [searchParams] = useSearchParams();

  const roomId = searchParams.get("room") || import.meta.env.VITE_HMS_ROOM_ID;

  // Force role to 'broadcaster' so you can publish your video/audio
  const role = "broadcaster";

  const [joined, setJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Refs to hold video elements for each peer
  const videoRefs = useRef({});

  const getTokenAndJoin = async () => {
    if (!userData?._id || !roomId) {
      console.error("Missing user_id or room_id — cannot generate token");
      return;
    }

    try {
      console.log("Requesting token with:", { user_id: userData._id, room_id: roomId, role });

      const response = await axios.post(
        "http://localhost:4000/api/100ms/generate-token",
        {
          user_id: userData._id,
          room_id: roomId,
          role,
        }
      );

      const token = response.data.token;

      await hmsActions.join({
        userName: userData.name,
        authToken: token,
        settings: {
          isAudioMuted: false,
          isVideoMuted: false,
        },
      });

      setJoined(true);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  // Attach video tracks whenever peers update
  useEffect(() => {
    peers.forEach((peer) => {
      if (!videoRefs.current[peer.id]) {
        videoRefs.current[peer.id] = React.createRef();
      }

      if (peer.videoTrack && videoRefs.current[peer.id].current) {
        hmsActions.attachVideo(peer.videoTrack, videoRefs.current[peer.id].current);
      }
    });
  }, [peers, hmsActions]);

  // Toggle local audio (mute/unmute mic)
  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(isAudioMuted);
    setIsAudioMuted(!isAudioMuted);
  };

  // Toggle local video (hide/show camera)
  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(isVideoMuted);
    setIsVideoMuted(!isVideoMuted);
  };

  // Leave call
  const leaveCall = async () => {
    await hmsActions.leave();
    setJoined(false);
  };

  if (userLoading || !userData) {
    return <p className="text-center mt-10 text-gray-600">Loading user...</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Live Video Consultation</h2>

      {!joined ? (
        <button
          onClick={getTokenAndJoin}
          className="bg-green-600 px-4 py-2 rounded text-white"
        >
          Join Call
        </button>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peers.map((peer) => (
              <div key={peer.id}>
                <h4 className="font-medium mb-1">{peer.name}</h4>
                <video
                  ref={videoRefs.current[peer.id]}
                  autoPlay
                  muted={peer.isLocal} // mute your own video locally to avoid echo
                  className="w-full rounded shadow"
                />
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
