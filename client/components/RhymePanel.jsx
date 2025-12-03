import { useState, useEffect } from "react";

// 预设韵脚库
const RHYME_SETS = [
  { sound: "-ide", words: ["ride", "hide", "side", "pride", "wide", "guide", "slide"] },
  { sound: "-ay", words: ["day", "way", "say", "play", "stay", "away", "today"] },
  { sound: "-ight", words: ["night", "right", "fight", "light", "sight", "might", "bright"] },
  { sound: "-ow", words: ["flow", "know", "go", "show", "grow", "low", "glow"] },
  { sound: "-ame", words: ["game", "name", "fame", "flame", "same", "came", "aim"] },
  { sound: "-ine", words: ["time", "mine", "line", "shine", "fine", "sign", "climb"] },
  { sound: "-eat", words: ["beat", "heat", "street", "feet", "meet", "seat", "treat"] },
  { sound: "-ound", words: ["sound", "ground", "round", "found", "bound", "pound", "crown"] },
];

export default function RhymePanel({ isSessionActive, onRhymeChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentRhyme = RHYME_SETS[currentIndex];

  // 通知父组件韵脚变化
  useEffect(() => {
    if (onRhymeChange) {
      onRhymeChange(currentRhyme);
    }
  }, [currentIndex, onRhymeChange]);

  function nextRhyme() {
    setCurrentIndex((prev) => (prev + 1) % RHYME_SETS.length);
  }

  function prevRhyme() {
    setCurrentIndex((prev) => (prev - 1 + RHYME_SETS.length) % RHYME_SETS.length);
  }

  return (
    <section className="flex flex-col h-full">
      <h2 className="text-lg font-bold mb-4 pb-2 border-b border-gray-200">
        Rhyme Guide
      </h2>

      {!isSessionActive ? (
        <div className="text-gray-500 text-center mt-8">
          <p className="mb-2">Start a battle to begin!</p>
          <p className="text-sm">AI will rap first, you follow with the same rhyme.</p>
        </div>
      ) : (
        <>
          {/* 当前韵脚 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-500 mb-1">Current Rhyme</div>
            <div className="text-3xl font-bold text-purple-600">{currentRhyme.sound}</div>
          </div>

          {/* 提示词 */}
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Words you can use:</div>
            <div className="flex flex-wrap gap-2">
              {currentRhyme.words.map((word) => (
                <span
                  key={word}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* 切换按钮 */}
          <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={prevRhyme}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              ← Previous
            </button>
            <button
              onClick={nextRhyme}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
            >
              Next →
            </button>
          </div>

          {/* 提示 */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <strong>Tip:</strong> End your line with one of these words!
          </div>
        </>
      )}
    </section>
  );
}
