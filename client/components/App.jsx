import { useEffect, useRef, useState, useCallback } from "react";
import logo from "/assets/openai-logomark.svg";
import EventLog from "./EventLog";
import BattleLog from "./BattleLog";
import SessionControls from "./SessionControls";
import RhymePanel from "./RhymePanel";
import SettingsPanel from "./SettingsPanel";
import FeedbackOverlay from "./FeedbackOverlay";
import LiveTranscript from "./LiveTranscript";
import { getMode } from "../lib/modes";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [showBattleView, setShowBattleView] = useState(true); // 默认显示Battle视图
  const [sessionSettings, setSessionSettings] = useState(null);
  const peerConnection = useRef(null);
  const audioElement = useRef(null);

  async function startSession() {
    // Get a session token for OpenAI Realtime API with settings
    const tokenResponse = await fetch("/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionSettings || {}),
    });
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret?.value || data.value;
    const model = data.model || sessionSettings?.model || "gpt-realtime";

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime/calls";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const sdp = await sdpResponse.text();
    const answer = { type: "answer", sdp };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }


  // Handle settings change from SettingsPanel
  const handleSettingsChange = useCallback((settings) => {
    setSessionSettings(settings);
  }, []);

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        if (!event.timestamp) {
          event.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [event, ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);

        // Let AI speak first - trigger initial response
        setTimeout(() => {
          dataChannel.send(JSON.stringify({ type: "response.create" }));
        }, 500);
      });
    }
  }, [dataChannel]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center z-20 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <img style={{ width: "24px" }} src={logo} />
          <h1>8 Miles</h1>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowBattleView(true)}
              className={`px-3 py-1 rounded text-sm ${showBattleView ? "bg-purple-600 text-white" : "bg-gray-200"}`}
            >
              Battle
            </button>
            <button
              onClick={() => setShowBattleView(false)}
              className={`px-3 py-1 rounded text-sm ${!showBattleView ? "bg-purple-600 text-white" : "bg-gray-200"}`}
            >
              Debug
            </button>
          </div>
        </div>
      </nav>
      <main className="absolute top-16 left-0 right-0 bottom-0">
        <FeedbackOverlay 
          events={events} 
          currentRhyme={sessionSettings?.rhyme} 
        />
        <LiveTranscript 
          events={events} 
          rhymeWords={sessionSettings?.rhyme?.words || []} 
        />
        <section className="absolute top-0 left-0 right-[380px] bottom-0 flex">
          <section className="absolute top-0 left-0 right-0 bottom-32 px-4 overflow-y-auto">
            {showBattleView ? (
              <BattleLog events={events} rhymeWords={sessionSettings?.rhyme?.words || []} />
            ) : (
              <EventLog events={events} />
            )}
          </section>
          <section className="absolute h-32 left-0 right-0 bottom-0 p-4">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              events={events}
              isSessionActive={isSessionActive}
            />
          </section>
        </section>
        <section className="absolute top-0 w-[380px] right-0 bottom-0 p-4 pt-0 overflow-y-auto border-l border-gray-200">
          <SettingsPanel
            onSettingsChange={handleSettingsChange}
            disabled={isSessionActive}
          />
          <RhymePanel
            isSessionActive={isSessionActive}
            currentRhyme={sessionSettings?.rhyme}
            showHints={getMode(sessionSettings?.mode).ui.showHints}
          />
        </section>
      </main>
    </>
  );
}
