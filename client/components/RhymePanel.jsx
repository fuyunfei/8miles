/**
 * RhymePanel - Displays current rhyme during battle
 * Rhyme selection is now in SettingsPanel (before session starts)
 * Hints visibility controlled by mode.ui.showHints
 */
export default function RhymePanel({ isSessionActive, currentRhyme, showHints = true }) {
  return (
    <section className="flex flex-col">
      <h2 className="text-lg font-bold mb-4 pb-2 border-b border-gray-200">
        Rhyme Guide
      </h2>

      {!isSessionActive ? (
        <div className="text-gray-500 text-center mt-4">
          <p className="mb-2">Select a rhyme in Settings, then start!</p>
          <p className="text-sm">AI will rap first, you follow with the same rhyme.</p>
        </div>
      ) : currentRhyme ? (
        <>
          {/* 当前韵脚 - 大显示 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-4 text-center">
            <div className="text-sm text-purple-100 mb-1">Current Rhyme</div>
            <div className="text-5xl font-black text-white">{currentRhyme.sound}</div>
          </div>

          {/* 提示词 - 只在 showHints 为 true 时显示 */}
          {showHints && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">Words you can use:</div>
              <div className="flex flex-wrap gap-2">
                {currentRhyme.words.map((word) => (
                  <span
                    key={word}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 提示 - 只在 showHints 为 true 时显示 */}
          {showHints ? (
            <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <strong>Tip:</strong> End your line with one of these words!
            </div>
          ) : (
            <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
              <strong>Battle Mode:</strong> No hints - trust your skills! 🔥
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 text-center mt-4">
          No rhyme selected
        </div>
      )}
    </section>
  );
}
