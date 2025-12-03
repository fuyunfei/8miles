import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// 估算语速：每秒约3个词
const WORDS_PER_SECOND = 3;

/**
 * 单条消息的动画组件
 * @param {number} audioStartTime - 音频开始播放的时间戳(ms)，用于同步
 */
function AnimatedMessage({ text, isAI, rhymeWords = [], audioStartTime = null }) {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!text || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const words = containerRef.current.querySelectorAll(".word");
    const wordCount = words.length;

    // 估算每个词的显示间隔（毫秒）
    const intervalPerWord = 1000 / WORDS_PER_SECOND; // ~333ms per word
    const totalDuration = wordCount * intervalPerWord;

    // 计算已经过去的时间（如果有音频开始时间）
    let elapsedTime = 0;
    if (audioStartTime) {
      elapsedTime = Date.now() - audioStartTime;
    }

    // 计算应该跳过多少词（已经说过的）
    const wordsToSkip = Math.floor(elapsedTime / intervalPerWord);

    words.forEach((word, index) => {
      if (index < wordsToSkip) {
        // 已经说过的词，直接显示
        gsap.set(word, { opacity: 1, y: 0, rotateX: 0 });
      } else {
        // 还没说的词，计算延迟后显示
        const delay = (index - wordsToSkip) * (intervalPerWord / 1000);

        gsap.set(word, { opacity: 0, y: 20, rotateX: -45 });
        gsap.to(word, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.25,
          delay: delay,
          ease: "power2.out",
        });
      }
    });

    // 押韵词额外动画（在所有词显示完后）
    const rhymeElements = containerRef.current.querySelectorAll(".rhyme-word");
    if (rhymeElements.length > 0) {
      const finalDelay = Math.max(0, (wordCount - wordsToSkip) * intervalPerWord / 1000);
      gsap.to(rhymeElements, {
        scale: 1.15,
        color: "#ec4899",
        duration: 0.3,
        delay: finalDelay,
        ease: "elastic.out(1, 0.5)",
      });
    }
  }, [text, audioStartTime]);

  if (!text) return null;

  const words = text.split(/\s+/);

  // 检查是否押韵词
  const isRhymeWord = (word) => {
    const clean = word.toLowerCase().replace(/[.,!?'"]/g, "");
    return rhymeWords.some((rw) => clean.endsWith(rw.toLowerCase()));
  };

  return (
    <div
      ref={containerRef}
      className={`p-4 rounded-lg mb-3 ${
        isAI
          ? "bg-gradient-to-r from-purple-100 to-pink-50 border-l-4 border-purple-500"
          : "bg-gray-100 border-l-4 border-gray-400 ml-8"
      }`}
    >
      <div className="text-xs text-gray-500 mb-2">{isAI ? "8 Miles" : "You"}</div>
      <div className="flex flex-wrap gap-x-2 gap-y-1" style={{ perspective: "500px" }}>
        {words.map((word, idx) => (
          <span
            key={idx}
            className={`word inline-block text-lg font-semibold ${
              isRhymeWord(word)
                ? "rhyme-word text-pink-600 font-bold"
                : isAI
                ? "text-purple-800"
                : "text-gray-700"
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Battle对话日志 - 显示AI和用户的rap交流
 */
export default function BattleLog({ events, rhymeWords = [] }) {
  const scrollRef = useRef(null);

  // 追踪音频开始时间
  const [audioStartTime, setAudioStartTime] = useState(null);

  // 处理音频事件
  useEffect(() => {
    const latestEvent = events[0];
    if (!latestEvent) return;

    // 音频开始播放时记录时间
    if (latestEvent.type === "output_audio_buffer.started") {
      setAudioStartTime(Date.now());
    }

    // response完成时重置
    if (latestEvent.type === "response.output_audio_transcript.done") {
      // 延迟重置，让最后的消息有时间显示
      setTimeout(() => setAudioStartTime(null), 100);
    }
  }, [events]);

  // 从events中提取已完成的对话消息（去重）
  const completedMessages = events
    .filter((event) => {
      if (event.type === "conversation.item.create" && event.item?.role === "user") {
        return true;
      }
      if (event.type === "response.output_audio_transcript.done") {
        return true;
      }
      return false;
    })
    .map((event) => {
      if (event.type === "conversation.item.create") {
        return {
          id: event.event_id,
          role: "user",
          content: event.item?.content?.[0]?.text || "",
        };
      }
      if (event.type === "response.output_audio_transcript.done") {
        return {
          id: event.event_id,
          role: "assistant",
          content: event.transcript || "",
        };
      }
      return null;
    })
    .filter((msg) => msg && msg.content)
    .reverse();

  const messages = completedMessages;

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="text-gray-400 text-center mt-8">
          <div className="text-2xl mb-2">🎤</div>
          <div>Press start to begin the battle...</div>
        </div>
      ) : (
        messages.map((msg, index) => (
          <AnimatedMessage
            key={msg.id}
            text={msg.content}
            isAI={msg.role === "assistant"}
            rhymeWords={rhymeWords}
            audioStartTime={msg.role === "assistant" && index === messages.length - 1 ? audioStartTime : null}
          />
        ))
      )}
    </div>
  );
}
