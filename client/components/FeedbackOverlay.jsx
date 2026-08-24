import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

/**
 * FeedbackOverlay - 提供即时反馈特效
 * 
 * 核心设计：缩短奖励回路
 * - 监听语音转录的增量事件 (input_audio_transcription.delta) 实现逐词检测
 * - 用户说出押韵词的那一刻就炸特效，不等整句话说完
 * - 同时也支持文本输入作为后备
 */
export default function FeedbackOverlay({ events, currentRhyme }) {
  const [combo, setCombo] = useState(0);
  const [processedWords, setProcessedWords] = useState(new Set()); // 避免同一个词重复触发
  const [lastTranscriptId, setLastTranscriptId] = useState(null);
  const containerRef = useRef(null);
  const comboRef = useRef(null);

  // 押韵检测逻辑 - 检测单个词是否押韵
  const isRhymeWord = (word, rhyme) => {
    if (!word || !rhyme) return false;
    const clean = word.toLowerCase().replace(/[.,!?'"]/g, "");
    if (clean.length < 2) return false;
    
    // 方式1: 完全匹配预设词表
    if (rhyme.words.some(rw => rw.toLowerCase() === clean)) return true;
    
    // 方式2: 韵尾匹配 (如 -ide 匹配 "glide", "worldwide")
    const soundSuffix = rhyme.sound.replace('-', '');
    if (clean.endsWith(soundSuffix)) return true;
    
    return false;
  };

  // 从文本中提取所有押韵词
  const extractRhymeWords = (text, rhyme) => {
    if (!text || !rhyme) return [];
    const words = text.split(/\s+/);
    return words.filter(w => isRhymeWord(w, rhyme));
  };

  useEffect(() => {
    if (!events.length || !currentRhyme) return;

    const latestEvent = events[0];
    const eventId = latestEvent.event_id;

    // ========== 方式1: 语音输入的增量转录 (最实时!) ==========
    // OpenAI Realtime API: conversation.item.input_audio_transcription.delta
    if (latestEvent.type === "conversation.item.input_audio_transcription.delta") {
      const deltaText = latestEvent.delta || "";
      const words = deltaText.split(/\s+/).filter(w => w.length > 0);
      
      words.forEach(word => {
        const wordKey = `${latestEvent.item_id}-${word.toLowerCase()}`;
        if (!processedWords.has(wordKey) && isRhymeWord(word, currentRhyme)) {
          setProcessedWords(prev => new Set([...prev, wordKey]));
          setCombo(prev => prev + 1);
          triggerExplosion([word], 1);
        }
      });
      return;
    }

    // ========== 方式2: 语音输入完成转录 ==========
    // OpenAI Realtime API: conversation.item.input_audio_transcription.completed
    if (
      latestEvent.type === "conversation.item.input_audio_transcription.completed" &&
      eventId !== lastTranscriptId
    ) {
      setLastTranscriptId(eventId);
      const text = latestEvent.transcript || "";
      const rhymedWords = extractRhymeWords(text, currentRhyme);
      
      // 过滤掉已经通过增量事件处理过的词
      const newRhymedWords = rhymedWords.filter(w => {
        const wordKey = `${latestEvent.item_id}-${w.toLowerCase()}`;
        return !processedWords.has(wordKey);
      });

      if (newRhymedWords.length > 0) {
        setCombo(prev => prev + newRhymedWords.length);
        triggerExplosion(newRhymedWords, newRhymedWords.length);
      } else if (text.length > 10 && rhymedWords.length === 0) {
        // 说了一句话但没押韵 - 重置连击
        setCombo(0);
        triggerMiss();
      }
      
      // 清理这个 item 的已处理词
      setProcessedWords(new Set());
      return;
    }

    // ========== 方式3: 文本输入 (后备方案) ==========
    if (
      latestEvent.type === "conversation.item.create" && 
      latestEvent.item?.role === "user" &&
      eventId !== lastTranscriptId
    ) {
      setLastTranscriptId(eventId);
      const text = latestEvent.item?.content?.[0]?.text || "";
      const rhymedWords = extractRhymeWords(text, currentRhyme);

      if (rhymedWords.length > 0) {
        setCombo(prev => prev + 1);
        triggerExplosion(rhymedWords, rhymedWords.length);
      } else if (text.length > 10) {
        setCombo(0);
        triggerMiss();
      }
    }
  }, [events, currentRhyme, lastTranscriptId, processedWords]);

  // 触发连击和押韵词特效
  const triggerExplosion = (rhymedWords, count) => {
    const ctx = gsap.context(() => {
      // 1. 连击显示
      if (comboRef.current) {
        gsap.fromTo(comboRef.current, 
          { scale: 1, rotation: 0 },
          { 
            scale: 1.5, 
            rotation: Math.random() * 20 - 10, 
            duration: 0.2, 
            yoyo: true, 
            repeat: 1 
          }
        );
      }

      // 2. 屏幕中央炸开押韵词
      rhymedWords.forEach((word, i) => {
        const el = document.createElement("div");
        el.textContent = word.toUpperCase() + "!";
        el.className = "fixed left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 stroke-black pointer-events-none z-50 drop-shadow-2xl";
        el.style.textShadow = "0 4px 10px rgba(0,0,0,0.5)";
        containerRef.current.appendChild(el);

        // 随机位置偏移
        const xOffset = (Math.random() - 0.5) * 200;
        const yOffset = (Math.random() - 0.5) * 100;

        gsap.fromTo(el,
          { scale: 0, opacity: 0, x: xOffset, y: yOffset },
          {
            scale: 1.5 + (combo * 0.1), // 连击越高，字越大
            opacity: 1,
            duration: 0.5,
            ease: "elastic.out(1, 0.3)",
            onComplete: () => {
              gsap.to(el, {
                y: -100,
                opacity: 0,
                duration: 0.5,
                delay: 0.5,
                onComplete: () => el.remove()
              });
            }
          }
        );
      });

      // 3. 评价文字 (Nice! Dope! Fire!)
      const praises = ["NICE!", "DOPE!", "FIRE!", "SICK!", "LEGEND!"];
      const praise = praises[Math.min(count + Math.floor(combo/2), praises.length - 1)];
      
      const praiseEl = document.createElement("div");
      praiseEl.textContent = praise;
      praiseEl.className = "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl font-black text-white pointer-events-none z-40 opacity-0";
      praiseEl.style.textShadow = "0 0 20px #a855f7, 0 0 40px #a855f7"; // 紫色光晕
      containerRef.current.appendChild(praiseEl);

      gsap.fromTo(praiseEl,
        { scale: 0.5, opacity: 0, rotation: -10 },
        {
          scale: 1.2,
          opacity: 1,
          rotation: 0,
          duration: 0.4,
          ease: "back.out(1.7)",
          delay: 0.2,
          onComplete: () => {
            gsap.to(praiseEl, {
              scale: 2,
              opacity: 0,
              duration: 0.3,
              delay: 0.3,
              onComplete: () => praiseEl.remove()
            });
          }
        }
      );

      // 4. 背景闪光
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 bg-purple-500 pointer-events-none z-30 mix-blend-overlay";
      containerRef.current.appendChild(flash);
      gsap.fromTo(flash, { opacity: 0.4 }, { opacity: 0, duration: 0.5, onComplete: () => flash.remove() });

    }, containerRef);
  };

  const triggerMiss = () => {
    // Miss 效果 (可选)
  };

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Combo Counter */}
      {combo > 1 && (
        <div 
          ref={comboRef}
          className="absolute top-24 right-10 flex flex-col items-center z-40"
        >
          <div className="text-6xl font-black text-yellow-400 drop-shadow-lg italic" style={{ fontFamily: 'Impact, sans-serif' }}>
            {combo}x
          </div>
          <div className="text-xl font-bold text-white bg-black px-2 uppercase tracking-widest transform -skew-x-12">
            Combo
          </div>
        </div>
      )}
    </div>
  );
}

