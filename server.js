import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
dotenv.config({ override: true });
import { ProxyAgent, setGlobalDispatcher } from "undici";

// Setup proxy if HTTPS_PROXY or HTTP_PROXY is set
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrl) {
  const proxyAgent = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(proxyAgent);
  console.log(`Using proxy: ${proxyUrl}`);
}

const app = express();
app.use(express.json());
app.use(express.text());
const port = process.env.PORT || 3111;
const apiKey = process.env.OPENAI_API_KEY;

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// 8 Miles - Freestyle Rap Battle
const systemPrompt = `You are 8 Miles, a freestyle rapper in a rap battle. ONLY rap - no teaching, no explanations, no hints.

RULES:
- Say 2 lines that rhyme, then STOP and wait for the user
- After user responds, say "Ayy!" or "Yeah!" then your next 2 lines
- Keep it simple and fun
- Use the rhyme sound: -ide (ride, hide, side, pride, wide, guide)

EXAMPLE:
You: "Yo I'm 8 Miles, let me be your guide / Step into the booth, feel the vibe inside"
User: "..."
You: "Ayy! Now we rolling with the flow so wide / Every word you speak is a source of pride"

START with your opening 2 lines using -ide rhymes. Be brief.`;

// Build session config with custom settings
function buildSessionConfig(settings = {}) {
  const model = settings.model || "gpt-realtime";
  const voice = settings.voice || "shimmer";
  const vadMode = settings.vadMode || "semantic_vad";
  const speed = settings.speed || 1.0;
  const instructions = settings.systemPrompt || systemPrompt;

  const config = {
    session: {
      type: "realtime",
      model,
      instructions,
      audio: {
        input: {
          turn_detection:
            vadMode === "disabled"
              ? null
              : { type: vadMode },
          transcription: {
            model: "gpt-4o-transcribe",
          },
        },
        output: {
          voice,
          speed,
        },
      },
    },
  };

  return JSON.stringify(config);
}

// All-in-one SDP request (experimental)
app.post("/session", async (req, res) => {
  const fd = new FormData();
  console.log(req.body);
  fd.set("sdp", req.body);
  fd.set("session", buildSessionConfig());

  const r = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      "OpenAI-Beta": "realtime=v1",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: fd,
  });
  const sdp = await r.text();
  console.log(sdp);

  // Send back the SDP we received from the OpenAI REST API
  res.send(sdp);
});

// API route for ephemeral token generation with custom settings
app.post("/token", async (req, res) => {
  try {
    const settings = req.body || {};
    const sessionConfig = buildSessionConfig(settings);

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: sessionConfig,
      },
    );

    const data = await response.json();
    res.json({ ...data, model: settings.model || "gpt-realtime" });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
