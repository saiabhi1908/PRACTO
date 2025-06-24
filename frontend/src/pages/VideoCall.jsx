import React from "react";
import { useSearchParams } from "react-router-dom";
import { HMSRoomProvider } from "@100mslive/react-sdk";
import VideoConference from "../components/VideoConference";

const VideoCall = () => {
  const [searchParams] = useSearchParams();
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
