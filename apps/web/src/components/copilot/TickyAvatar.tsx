import React, { useRef, useEffect, useState } from 'react';

export type TickyState = 'idle_calm' | 'idle1' | 'hello' | 'idle2' | 'thinking';

interface TickyAvatarProps {
  state: TickyState;
  className?: string;
  onStateChange?: (newState: TickyState) => void;
}

type InternalClip = 'idle_calm' | 'idle1' | 'hello' | 'idle2' | 'think_in' | 'think_loop';

export const TickyAvatar: React.FC<TickyAvatarProps> = ({
  state,
  className = '',
  onStateChange,
}) => {
  const [activeClip, setActiveClip] = useState<InternalClip>(state === 'idle1' ? 'idle1' : 'idle_calm');
  const [isThinkPreRolling, setIsThinkPreRolling] = useState(false);

  const idleCalmRef = useRef<HTMLVideoElement>(null);
  const idle1Ref = useRef<HTMLVideoElement>(null);
  const helloRef = useRef<HTMLVideoElement>(null);
  const idle2Ref = useRef<HTMLVideoElement>(null);
  const thinkInRef = useRef<HTMLVideoElement>(null);
  const thinkLoopRef = useRef<HTMLVideoElement>(null);

  const videoRefs: Record<InternalClip, React.RefObject<HTMLVideoElement | null>> = {
    idle_calm: idleCalmRef,
    idle1: idle1Ref,
    hello: helloRef,
    idle2: idle2Ref,
    think_in: thinkInRef,
    think_loop: thinkLoopRef,
  };

  // State machine điều phối clip dựa trên state từ cha truyền vào
  useEffect(() => {
    if (state === 'idle_calm') {
      setIsThinkPreRolling(false);
      setActiveClip('idle_calm');
      const v = idleCalmRef.current;
      if (v) {
        v.play().catch(() => {});
      }
    } else if (state === 'idle1') {
      setIsThinkPreRolling(false);
      setActiveClip('idle1');
      const v = idle1Ref.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    } else if (state === 'idle2') {
      setIsThinkPreRolling(false);
      setActiveClip('idle2');
      const v = idle2Ref.current;
      if (v) {
        v.play().catch(() => {});
      }
    } else if (state === 'hello') {
      setActiveClip('hello');
      const v = helloRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      // Chuẩn bị sẵn frame đón đầu của idle2 tại Frame 20 (~0.85s) để vào nhịp nhún ngay
      const idle2 = idle2Ref.current;
      if (idle2) {
        idle2.currentTime = 0.85;
      }
    } else if (state === 'thinking') {
      setIsThinkPreRolling(false);
      setActiveClip('think_in');
      const v = thinkInRef.current;
      if (v) {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      // Chuẩn bị sẵn frame đầu của think_loop
      const loop = thinkLoopRef.current;
      if (loop) {
        loop.currentTime = 0;
      }
    }
  }, [state]);

  // Điều khiển play/pause cho từng clip
  useEffect(() => {
    Object.entries(videoRefs).forEach(([clipName, ref]) => {
      const v = ref.current;
      if (!v) return;

      const shouldPlay =
        clipName === activeClip ||
        (activeClip === 'think_in' && clipName === 'think_loop' && isThinkPreRolling);

      if (shouldPlay) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [activeClip, isThinkPreRolling]);

  // Bắt chính xác thời điểm clip hello kết thúc để kích hoạt idle2 nối tiếp mượt mà
  useEffect(() => {
    if (activeClip !== 'hello') return;

    let rafId: number;
    let switched = false;
    const checkHelloEnd = () => {
      const v = helloRef.current;
      const idle2 = idle2Ref.current;
      if (v && idle2 && v.duration) {
        // Khi clip hello chạm đến 1 frame cuối cùng (~40ms), kích hoạt chuyển giao tức thì
        if (v.currentTime >= v.duration - 0.04 && !switched) {
          switched = true;
          idle2.currentTime = 0.85;
          idle2.play().catch(() => {});
          setActiveClip('idle2');
          onStateChange?.('idle2');
        }
      }
      if (!switched) {
        rafId = requestAnimationFrame(checkHelloEnd);
      }
    };

    rafId = requestAnimationFrame(checkHelloEnd);
    return () => cancelAnimationFrame(rafId);
  }, [activeClip, onStateChange]);

  // Fallback đảm bảo nếu sự kiện onEnded kích hoạt trước RAF
  const handleHelloEnded = () => {
    const idle2 = idle2Ref.current;
    if (idle2 && activeClip === 'hello') {
      idle2.currentTime = 0.85;
      idle2.play().catch(() => {});
      setActiveClip('idle2');
      onStateChange?.('idle2');
    }
  };

  // Sử dụng requestAnimationFrame để pre-roll think_loop trước 200ms
  useEffect(() => {
    if (activeClip !== 'think_in') return;

    let rafId: number;
    const checkThinkInEnd = () => {
      const v = thinkInRef.current;
      const loop = thinkLoopRef.current;
      if (v && loop && v.duration) {
        if (v.currentTime >= v.duration - 0.2) {
          if (!isThinkPreRolling) {
            setIsThinkPreRolling(true);
            loop.currentTime = 0;
            loop.play().catch(() => {});
          }
        }
      }
      rafId = requestAnimationFrame(checkThinkInEnd);
    };

    rafId = requestAnimationFrame(checkThinkInEnd);
    return () => cancelAnimationFrame(rafId);
  }, [activeClip, isThinkPreRolling]);

  const handleThinkInEnded = () => {
    setIsThinkPreRolling(false);
    setActiveClip('think_loop');
  };

  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      {/* 0. Idle Calm (Mascot đứng yên giơ ngón like, thở êm và chớp mắt - Chế độ tĩnh mặc định) */}
      <video
        ref={idleCalmRef}
        src="/mascot/ticky_idle_calm.webm"
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain ${
          activeClip === 'idle_calm'
            ? 'opacity-100 z-10'
            : 'opacity-0 z-0 pointer-events-none'
        }`}
      />

      {/* 1. Idle 1 (Mascot lắc lư làm dáng like - Kích hoạt khi Hover) */}
      <video
        ref={idle1Ref}
        src="/mascot/ticky_idle1.webm"
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain ${
          activeClip === 'idle1' ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'
        }`}
      />

      {/* 2. Hello (Vẫy tay chào -> hạ tay đứng thẳng) */}
      <video
        ref={helloRef}
        src="/mascot/ticky_hello.webm"
        muted
        playsInline
        preload="auto"
        onEnded={handleHelloEnded}
        className={`absolute inset-0 w-full h-full object-contain ${
          activeClip === 'hello' ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'
        }`}
      />

      {/* 3. Idle 2 (Đứng thẳng chớp mắt quan sát khi chờ chat) */}
      <video
        ref={idle2Ref}
        src="/mascot/ticky_idle2.webm"
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain ${
          activeClip === 'idle2' ? 'opacity-100 z-20' : 'opacity-0 z-0 pointer-events-none'
        }`}
      />

      {/* 4. Think In (Đưa tay lên cằm, 0.9s) */}
      <video
        ref={thinkInRef}
        src="/mascot/ticky_think_in.webm"
        muted
        playsInline
        preload="auto"
        onEnded={handleThinkInEnded}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
          activeClip === 'think_in' ? 'opacity-100 z-20' : 'opacity-0 z-0'
        }`}
      />

      {/* 5. Think Loop (Giữ tay trên cằm, đảo mắt suy nghĩ) */}
      <video
        ref={thinkLoopRef}
        src="/mascot/ticky_think_loop.webm"
        loop
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
          activeClip === 'think_loop' || (activeClip === 'think_in' && isThinkPreRolling)
            ? 'opacity-100 z-10'
            : 'opacity-0 z-0'
        }`}
      />
    </div>
  );
};

export default TickyAvatar;
