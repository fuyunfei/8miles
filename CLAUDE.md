# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server with hot reload (http://localhost:3000)
npm run build        # Build both client and server for production
npm run lint         # Run ESLint with auto-fix on .js/.jsx files
npm start            # Start production server
```

## Architecture

This is a minimal reference implementation of the OpenAI Realtime API using WebRTC. The application demonstrates real-time voice conversations with function calling capabilities.

### Server (`server.js`)

Express server with three responsibilities:
- `GET /token` - Generates ephemeral tokens by calling OpenAI's `/v1/realtime/client_secrets` endpoint
- `POST /session` - Relays SDP offers to OpenAI's `/v1/realtime/calls` endpoint and returns SDP answers
- Catch-all route serves the React frontend with Vite SSR

### Client (`/client`)

React application with Vite and Tailwind CSS:

- **`App.jsx`** - Main orchestrator managing RTCPeerConnection and DataChannel lifecycle. Handles `startSession()`, `stopSession()`, and event communication via the data channel.
- **`EventLog.jsx`** - Displays chronological stream of client/server events with expandable JSON viewer. Deduplicates streaming delta events.
- **`SessionControls.jsx`** - UI for starting/stopping sessions and sending text messages.
- **`ToolPanel.jsx`** - Demonstrates function calling by registering tools via `session.update` and handling `response.done` events containing `function_call` outputs.

### WebRTC Flow

1. Fetch ephemeral token from `/token`
2. Create RTCPeerConnection with audio tracks (microphone input, remote playback)
3. Create data channel `"oai-events"` for JSON event communication
4. SDP handshake via `/session` endpoint
5. All Realtime API events are JSON strings over the data channel

### Function Calling Pattern

Tools are registered after session creation by sending a `session.update` event with tool definitions. Function call results appear in `response.done` events' output array with `type: "function_call"`.

## Environment

Requires `.env` file with `OPENAI_API_KEY`. Copy from `.env.example`.
