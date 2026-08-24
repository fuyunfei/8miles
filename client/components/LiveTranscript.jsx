import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

/**
 * LiveTranscript - 实时显示用户正在说的话
 * 
 * 产品价值：
 * 1. 用户知道系统在听（不是卡住了）
 * 2. 押韵词可以在说出的瞬间高亮
 * 3. 缩短奖励回路到极致
 */
export default function LiveTranscript({ events, rhymeWords = [] }) {
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!events.length) return;
    const latestEvent = events[0];

    // 用户开始说话
    if (latestEvent.type === "input_audio_buffer.speech_started") {
      setIsListening(true);
      setCurrentTranscript("");
    }

    // 增量转录 - 逐词更新
    if (latestEvent.type === "conversation.item.input_audio_transcription.delta") {
      const delta = latestEvent.delta || "";
      setCurrentTranscript(prev => prev + delta);
    }

    // 用户说完 - 清空实时区域（完整转录会显示在 BattleLog 中）
    if (
      latestEvent.type === "conversation.item.input_audio_transcription.completed" ||
      latestEvent.type === "input_audio_buffer.speech_stopped"
    ) {
      // 延迟清空，让用户看到完整的话
      setTimeout(() => {
        setCurrentTranscript("");
        setIsListening(false);
      }, 500);
    }
  }, [events]);

  // 检查是否押韵词
  const isRhymeWord = (word) => {
    const clean = word.toLowerCase().replace(/[.,!?'"]/g, "");
    return rhymeWords.some((rw) => clean.toLowerCase() === rw.toLowerCase() || clean.endsWith(rw.toLowerCase().replace('-', '')));
  };

  // 没有在说话或没有内容时不显示
  if (!isListening && !currentTranscript) return null;

  const words = currentTranscript.split(/\s+/).filter(w => w.length > 0);

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-36 left-4 right-[396px] bg-black/80 backdrop-blur-sm rounded-xl p-4 z-30 border border-purple-500/50"
    >
      {/* 录音指示器 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-gray-400 uppercase tracking-wider">Listening...</span>
      </div>

      {/* 实时转录文字 */}
      <div className="flex flex-wrap gap-x-2 gap-y-1 min-h-[2rem]">
        {words.length === 0 ? (
          <span className="text-gray-500 italic">Start rapping...</span>
        ) : (
          words.map((word, idx) => {
            const rhymed = isRhymeWord(word);
            return (
              <span
                key={`${idx}-${word}`}
                className={`inline-block text-xl font-bold transition-all duration-200 ${
                  rhymed 
                    ? "text-yellow-400 scale-125 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" 
                    : "text-white"
                }`}
              >
                {word}
                {rhymed && <span className="text-yellow-500">✨</span>}
              </span>
            );
          })
        )}
        {/* 闪烁光标 */}
        <span className="inline-block w-0.5 h-6 bg-purple-400 animate-pulse" />
      </div>
    </div>
  );
}

