import { useState, useEffect } from "react";
import { Settings } from "react-feather";

// Available models
const MODELS = [
  { id: "gpt-realtime", name: "GPT Realtime", description: "Latest stable" },
  { id: "gpt-4o-realtime-preview", name: "GPT-4o Realtime", description: "Full featured" },
  { id: "gpt-4o-mini-realtime-preview", name: "GPT-4o Mini Realtime", description: "Faster & cheaper" },
  { id: "gpt-realtime-mini", name: "GPT Realtime Mini", description: "Lightweight" },
];

// Available voices
const VOICES = [
  { id: "shimmer", name: "Shimmer", description: "Warm, engaging" },
  { id: "alloy", name: "Alloy", description: "Neutral, balanced" },
  { id: "echo", name: "Echo", description: "Soft, gentle" },
  { id: "fable", name: "Fable", description: "Expressive" },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
  { id: "nova", name: "Nova", description: "Friendly, upbeat" },
  { id: "marin", name: "Marin", description: "Clear, natural" },
];

// VAD modes
const VAD_MODES = [
  { id: "semantic_vad", name: "Semantic VAD", description: "AI detects when you finish speaking" },
  { id: "server_vad", name: "Server VAD", description: "Silence-based detection" },
  { id: "disabled", name: "Push to Talk", description: "Manual control" },
];

const DEFAULT_SETTINGS = {
  model: "gpt-realtime",
  voice: "shimmer",
  vadMode: "semantic_vad",
  speed: 1.0,
};

export default function SettingsPanel({ onSettingsChange, disabled = false }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent of settings changes
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  function updateSetting(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
      >
        <Settings size={16} />
        <span>Settings</span>
        <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 p-3 bg-gray-50 rounded-lg">
          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => updateSetting("model", e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Voice
            </label>
            <select
              value={settings.voice}
              onChange={(e) => updateSetting("voice", e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
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
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {VAD_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name} - {mode.description}
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
              max="2.0"
              step="0.1"
              value={settings.speed}
              onChange={(e) => updateSetting("speed", parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {disabled && (
            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
              Settings can only be changed before starting a session
            </div>
          )}
        </div>
      )}
    </div>
  );
}
