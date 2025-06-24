import React from "react";
import { useLocation } from "react-router-dom";
import { HMSRoomProvider } from "@100mslive/react-sdk";

import VideoConference from "../components/VideoConference";

const VideoCall = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const roomId = searchParams.get("room");
  const userId = searchParams.get("user");
  const role = searchParams.get("role");

  return (
    <HMSRoomProvider>
      <VideoConference roomId={roomId} userId={userId} role={role} />
    </HMSRoomProvider>
  );
};

export default VideoCall;
