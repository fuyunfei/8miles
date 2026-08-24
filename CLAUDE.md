# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server with hot reload (http://localhost:3111)
npm run build        # Build both client and server for production
npm run lint         # Run ESLint with auto-fix on .js/.jsx files
npm start            # Start production server
```

## Architecture

8 Miles is a freestyle rap battle application built on the OpenAI Realtime API with WebRTC. Users engage in real-time voice rap battles with an AI opponent.

### Server (`server.js`)

Express server with Vite SSR middleware:
- `POST /token` - Generates ephemeral tokens via OpenAI's `/v1/realtime/client_secrets`, accepts settings (model, voice, vadMode, speed)
- `POST /session` - Relays SDP offers to OpenAI's `/v1/realtime/calls` endpoint
- Catch-all route serves the React frontend with Vite SSR

The rap battle persona and rules are defined in `systemPrompt` within server.js.

### Client (`/client`)

React application with Vite and Tailwind CSS:

- **`App.jsx`** - Main orchestrator managing RTCPeerConnection and DataChannel lifecycle. Has two view modes: Battle (stylized rap view) and Debug (raw event log).
- **`BattleLog.jsx`** - Displays conversation as a rap battle with animated text and rhyme highlighting.
- **`EventLog.jsx`** - Debug view showing chronological stream of client/server events with expandable JSON.
- **`SessionControls.jsx`** - UI for starting/stopping sessions and sending text messages.
- **`RhymePanel.jsx`** - Displays rhyme words for the current rhyme scheme.
- **`SettingsPanel.jsx`** - Configuration for model, voice, VAD mode, and speech speed.
- **`AnimatedText.jsx`** - GSAP-powered text animation for rap lyrics.

### WebRTC Flow

1. Client POSTs settings to `/token` to get ephemeral key
2. Create RTCPeerConnection with audio tracks (microphone input, remote playback)
3. Create data channel `"oai-events"` for JSON event communication
4. SDP handshake via OpenAI's `/v1/realtime/calls` endpoint
5. On data channel open, trigger `response.create` to let AI rap first
6. All Realtime API events are JSON strings over the data channel

## Environment

Requires `.env` file with `OPENAI_API_KEY`. Default port is 3111.
