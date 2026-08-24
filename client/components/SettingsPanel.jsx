import { useState, useEffect } from "react";
import { Settings, ChevronDown, ChevronUp } from "react-feather";
import { RHYME_SETS, TOPICS, getAllModes, getMode, buildSystemPrompt } from "../lib/modes";

// Available models
const MODELS = [
  { id: "gpt-realtime", name: "GPT Realtime", description: "Latest stable" },
  { id: "gpt-4o-realtime-preview", name: "GPT-4o Realtime", description: "Full featured" },
  { id: "gpt-4o-mini-realtime-preview", name: "GPT-4o Mini Realtime", description: "Faster & cheaper" },
];

// Available voices
const VOICES = [
  { id: "shimmer", name: "Shimmer", description: "Warm, engaging" },
  { id: "alloy", name: "Alloy", description: "Neutral, balanced" },
  { id: "echo", name: "Echo", description: "Soft, gentle" },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
  { id: "nova", name: "Nova", description: "Friendly, upbeat" },
];

// VAD modes
const VAD_MODES = [
  { id: "semantic_vad", name: "Semantic VAD", description: "AI detects speech end" },
  { id: "server_vad", name: "Server VAD", description: "Silence-based" },
];

const DEFAULT_SETTINGS = {
  mode: "practice",
  rhyme: RHYME_SETS[0],
  topic: TOPICS[0].id,
  model: "gpt-realtime",
  voice: "shimmer",
  vadMode: "semantic_vad",
  speed: 1.0,
};

export default function SettingsPanel({ onSettingsChange, disabled = false }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate system prompt and notify parent
  useEffect(() => {
    if (onSettingsChange) {
      const systemPrompt = buildSystemPrompt(settings.mode, settings.rhyme, settings.topic);
      onSettingsChange({ ...settings, systemPrompt });
    }
  }, [settings, onSettingsChange]);

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const currentMode = getMode(settings.mode);
  const allModes = getAllModes();

  return (
    <div className="mb-4">
      {/* Mode Selection - Always Visible */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {allModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => updateSetting("mode", mode.id)}
              disabled={disabled}
              className={`p-3 rounded-lg text-center transition-all ${
                settings.mode === mode.id
                  ? "bg-purple-600 text-white shadow-lg scale-105"
                  : "bg-white border border-gray-200 hover:border-purple-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-sm font-semibold">{mode.name}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          {currentMode.description}
        </p>
      </div>

      {/* Rhyme Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Rhyme Sound
        </label>
        <div className="grid grid-cols-4 gap-2">
          {RHYME_SETS.map((rhyme) => (
            <button
              key={rhyme.sound}
              onClick={() => updateSetting("rhyme", rhyme)}
              disabled={disabled}
              className={`px-2 py-2 text-sm font-bold rounded-lg transition-all ${
                settings.rhyme.sound === rhyme.sound
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 hover:border-purple-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {rhyme.sound}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Selection - Only for Challenge mode */}
      {settings.mode === "challenge" && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Topic
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => updateSetting("topic", topic.id)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  settings.topic === topic.id
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-gray-200 hover:border-orange-400"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-2"
      >
        <Settings size={14} />
        <span>Advanced Settings</span>
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => updateSetting("model", e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white disabled:bg-gray-100"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Voice
            </label>
            <select
              value={settings.voice}
              onChange={(e) => updateSetting("voice", e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white disabled:bg-gray-100"
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>

          {/* VAD Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Turn Detection
            </label>
            <select
              value={settings.vadMode}
              onChange={(e) => updateSetting("vadMode", e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded bg-white disabled:bg-gray-100"
            >
              {VAD_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Speed: {settings.speed.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.speed}
              onChange={(e) => updateSetting("speed", parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
          </div>
        </div>
      )}

      {disabled && (
        <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
          Stop session to change settings
        </div>
      )}
    </div>
  );
}
