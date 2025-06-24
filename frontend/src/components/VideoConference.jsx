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

  const roomId = searchParams.get("room");
  const userId = searchParams.get("user");
  const urlRole = searchParams.get("role");

  const mappedRole =
    urlRole === "doctor" || urlRole === "patient" ? "broadcaster" : "viewer";

  const [joined, setJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const videoRefs = useRef({});

  const checkPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      return true;
    } catch (err) {
      alert("Please allow microphone and camera access to join the call.");
      return false;
    }
  };

  const getTokenAndJoin = async () => {
    const finalUserId = userId || userData?._id;
    const finalUserName = userData?.name || "Guest";

    if (!finalUserId || !roomId) {
      console.error("Missing user_id or room_id — cannot generate token");
      return;
    }

    const permissionGranted = await checkPermissions();
    if (!permissionGranted) return;

    try {
      const response = await axios.post(
        "http://localhost:4000/api/100ms/generate-token",
        {
          user_id: finalUserId,
          room_id:import.meta.env.VITE_HMS_ROOM_ID,
          role: mappedRole,
        }
      );

      const token = response.data.token;

      await hmsActions.join({
        userName: finalUserName,
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

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(isAudioMuted);
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(isVideoMuted);
    setIsVideoMuted(!isVideoMuted);
  };

  const startScreenShare = async () => {
    try {
      await hmsActions.setScreenShareEnabled(true);
    } catch (err) {
      console.error("Failed to start screen share:", err);
    }
  };

  const stopScreenShare = async () => {
    try {
      await hmsActions.setScreenShareEnabled(false);
    } catch (err) {
      console.error("Failed to stop screen share:", err);
    }
  };

  const startRecording = async () => {
    try {
      await axios.post("http://localhost:4000/api/100ms/start-recording", {
        room_id: roomId,
      });
      alert("Recording started");
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = async () => {
    try {
      await axios.post("http://localhost:4000/api/100ms/stop-recording", {
        room_id: roomId,
      });
      alert("Recording stopped");
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  };

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
          {/* 📺 Video layout */}
          <div className="relative h-[70vh] bg-gray-200 rounded overflow-hidden">
            {peers.map((peer, index) => (
              <div
                key={peer.id}
                className={`absolute ${
                  index === 0 ? "w-full h-full" : "w-40 h-40 bottom-4 right-4"
                }`}
              >
                <video
                  ref={videoRefs.current[peer.id]}
                  autoPlay
                  muted={peer.isLocal}
                  className="w-full h-full rounded shadow"
                />
                <p className="text-xs text-white bg-black bg-opacity-60 px-2 py-0.5 absolute bottom-1 left-1 rounded">
                  {peer.name}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
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
              onClick={startScreenShare}
              className="bg-blue-600 px-3 py-1 rounded text-white"
            >
              Share Screen
            </button>
            <button
              onClick={stopScreenShare}
              className="bg-blue-400 px-3 py-1 rounded text-white"
            >
              Stop Sharing
            </button>
            <button
              onClick={startRecording}
              className="bg-black px-3 py-1 rounded text-white"
            >
              Start Recording
            </button>
            <button
              onClick={stopRecording}
              className="bg-gray-800 px-3 py-1 rounded text-white"
            >
              Stop Recording
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
