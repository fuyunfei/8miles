import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * 逐词动画组件
 * 每个词依次弹出，押韵词高亮
 */
export default function AnimatedText({ text, rhymeWords = [], isAI = false }) {
  const containerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!text || hasAnimated.current) return;
    hasAnimated.current = true;

    const words = containerRef.current.querySelectorAll(".word");

    // 初始状态：隐藏
    gsap.set(words, {
      opacity: 0,
      y: 20,
      scale: 0.8
    });

    // 逐词弹出动画
    gsap.to(words, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.3,
      stagger: 0.08, // 每个词间隔
      ease: "back.out(1.7)",
    });

  }, [text]);

  if (!text) return null;

  // 将文本拆分为词
  const words = text.split(/\s+/);

  // 检查词是否是押韵词
  const isRhymeWord = (word) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "");
    return rhymeWords.some(rw => cleanWord.endsWith(rw.toLowerCase()));
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-wrap gap-x-2 gap-y-1 ${isAI ? "text-purple-700" : "text-gray-800"}`}
    >
      {words.map((word, idx) => (
        <span
          key={idx}
          className={`word inline-block text-lg font-medium ${
            isRhymeWord(word)
              ? "text-pink-500 font-bold scale-110"
              : ""
          }`}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
