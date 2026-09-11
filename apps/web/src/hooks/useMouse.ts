import { useState, useEffect } from 'react';

export interface MousePosition {
  x: number; // Normalized -1 to 1
  y: number; // Normalized -1 to 1
  pixelX: number;
  pixelY: number;
}

export function useMouse(): MousePosition {
  const [mouse, setMouse] = useState<MousePosition>({
    x: 0,
    y: 0,
    pixelX: 0,
    pixelY: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setMouse({
        x: (e.clientX / innerWidth) * 2 - 1,
        y: -(e.clientY / innerHeight) * 2 + 1,
        pixelX: e.clientX,
        pixelY: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mouse;
}
