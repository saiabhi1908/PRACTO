import React, { useEffect } from "react";
import { useHMSActions } from "@100mslive/react-sdk";

const DummyAIBroadcaster = ({ roomId, userId, userName }) => {
  const hmsActions = useHMSActions();

  useEffect(() => {
    async function joinWithDummyVideo() {
      try {
        console.log("🎯 Sending token request with:", {
          room_id: roomId,
          user_id: userId,
          role: "broadcaster",
        });

        const response = await fetch("http://localhost:4000/api/100ms/generate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_id: roomId,
            user_id: userId,
            role: "broadcaster",
          }),
        });

        const data = await response.json();
        console.log("🎯 Received token response:", data);

        if (!response.ok) {
          throw new Error(`❌ Token request failed: ${data.error || response.statusText}`);
        }

        const token = data.token;
        if (!token || typeof token !== "string") {
          throw new Error("❌ Token missing or invalid in backend response");
        }

        await hmsActions.join({
          userName: userName || "Dummy AI",
          authToken: token,
          settings: {
            isAudioMuted: true,
            isVideoMuted: false,
          },
        });

        const videoEl = document.createElement("video");
        videoEl.src = "/consultant.mp4";
        videoEl.muted = true;
        videoEl.loop = true;

        await videoEl.play();

        const stream = videoEl.captureStream();
        const [videoTrack] = stream.getVideoTracks();

        if (!videoTrack) {
          console.error("🚫 No video track found in captured stream");
          return;
        }

        await hmsActions.setLocalVideoEnabled(false);
        await hmsActions.replaceLocalTrack(videoTrack);
        await hmsActions.setLocalVideoEnabled(true);

        console.log("✅ Dummy AI broadcaster joined and is streaming video");
      } catch (err) {
        console.error("🔥 Error in Dummy AI broadcaster:", err);
      }
    }

    joinWithDummyVideo();

    return () => {
      hmsActions.leave();
    };
  }, [hmsActions, roomId, userId, userName]);

  return <p>Dummy AI broadcaster is connecting...</p>;
};

export default DummyAIBroadcaster;
