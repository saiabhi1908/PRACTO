import React from "react";
import { useParams } from "react-router-dom";
import { HMSRoomProvider } from "@100mslive/react-sdk";

import VideoConference from "../components/VideoConference";
import DummyAIBroadcaster from "../components/DummyAIBroadcaster";

const VideoCall = () => {
  const { roomId } = useParams(); // appointment or room ID from URL

  // Dummy AI user details (can be static or generate dynamically)
  const dummyAIUserId = "dummy-ai-user";
  const dummyAIUserName = "Dr. AI Consultant";

  return (
    <HMSRoomProvider>
      {/* Your real video conference */}
      <VideoConference roomId={roomId} />

      {/* Dummy AI broadcaster joins the same room */}
      <DummyAIBroadcaster
        roomId={roomId}
        userId={dummyAIUserId}
        userName={dummyAIUserName}
      />
    </HMSRoomProvider>
  );
};

export default VideoCall;
