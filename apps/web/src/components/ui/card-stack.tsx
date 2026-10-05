import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardStackItem {
  id: string | number;
  name?: string;
  designation?: string;
  content?: React.ReactNode;
  [key: string]: any;
}

export interface CardStackProps<T extends CardStackItem = CardStackItem> {
  items: T[];
  offset?: number;
  xOffset?: number;
  scaleFactor?: number;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  renderCard?: (item: T, isTop: boolean, originalIndex: number) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  containerHeight?: string | number;
  layoutMode?: 'staggered' | 'stack';
}

// Utility to highlight specific sections of content
export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5',
        className
      )}
    >
      {children}
    </span>
  );
};

export const CardStack = <T extends CardStackItem>({
  items,
  offset = 48,
  xOffset = 10,
  scaleFactor = 0.04,
  activeIndex,
  onActiveIndexChange,
  renderCard,
  className,
  cardClassName,
  containerHeight,
  layoutMode = 'staggered',
}: CardStackProps<T>) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const [switchedId, setSwitchedId] = useState<string | number | null>(null);

  const currentIndex = activeIndex !== undefined ? activeIndex : internalIndex;

  const setIndex = (idx: number) => {
    if (idx === currentIndex) return;
    const targetItem = items[idx];
    if (targetItem) {
      setSwitchedId(targetItem.id);
      setTimeout(() => setSwitchedId(null), 500);
    }
    if (onActiveIndexChange) {
      onActiveIndexChange(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  if (!items || items.length === 0) return null;

  const total = items.length;
  const inactiveIndices = items.map((_, i) => i).filter((i) => i !== currentIndex);

  // Chiều cao tự động tính toán theo số lượng thẻ so le
  const calculatedHeight =
    containerHeight ??
    (layoutMode === 'staggered'
      ? `${(total - 1) * offset + 310}px`
      : '22rem');

  return (
    <div
      className={cn('relative w-full flex items-start justify-center', className)}
      style={{ height: calculatedHeight }}
    >
      <AnimatePresence initial={false}>
        {items.map((item, originalIndex) => {
          const isTop = originalIndex === currentIndex;
          const isJustSwitched = switchedId === item.id;

          let topPos = 0;
          let leftPos = 0;
          let zIndexVal = 10;
          let opacityVal = 1;

          if (layoutMode === 'staggered') {
            // Chế độ so le (Staggered Tabs Cascade):
            // Thẻ active nằm ở đáy cascade, mở rộng toàn bộ thân thẻ
            // Các thẻ phía sau nhô lên một khoảng `offset` (y) và lệch nhẹ `xOffset` (x)
            if (isTop) {
              topPos = inactiveIndices.length * offset;
              leftPos = inactiveIndices.length * xOffset;
              zIndexVal = 35;
              opacityVal = 1;
            } else {
              const inactivePos = inactiveIndices.indexOf(originalIndex);
              topPos = inactivePos * offset;
              leftPos = inactivePos * xOffset;
              zIndexVal = 10 + inactivePos;
              opacityVal = 0.96;
            }
          } else {
            // Chế độ stack cổ điển
            const relativeIndex = (originalIndex - currentIndex + total) % total;
            if (relativeIndex > 3) return null;
            topPos = relativeIndex * -14;
            zIndexVal = total - relativeIndex;
            opacityVal = isTop ? 1 : Math.max(0.35, 1 - relativeIndex * 0.28);
          }

          // Hiệu ứng Switch vòng cung (Arc Switch):
          // Khi một thẻ được chọn để đưa lên front, nó sẽ vòng ra ngoài mạn trái (x: -80px)
          // nâng z-index lên cao rồi lượn nhẹ về vị trí front, KHÔNG xuyên qua tâm thẻ khác
          const animateProps =
            layoutMode === 'staggered' && isTop && isJustSwitched
              ? {
                  x: [0, -80, 0],
                  y: [topPos - 20, topPos - 10, topPos],
                  rotate: [0, -4, 0],
                  top: topPos,
                  left: leftPos,
                  zIndex: 45,
                  opacity: 1,
                  scale: [0.98, 1.02, 1],
                }
              : {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  top: topPos,
                  left: leftPos,
                  zIndex: zIndexVal,
                  opacity: opacityVal,
                  scale: isTop ? 1 : 0.99,
                };

          return (
            <motion.div
              key={item.id}
              className={cn(
                'absolute rounded-2xl transition-shadow duration-200',
                isTop
                  ? 'pointer-events-auto shadow-2xl shadow-black/90'
                  : 'pointer-events-auto cursor-pointer shadow-lg shadow-black/50 hover:brightness-105',
                cardClassName
              )}
              style={{
                width:
                  layoutMode === 'staggered'
                    ? `calc(100% - ${(total - 1) * xOffset}px)`
                    : '100%',
                transformOrigin: 'top center',
              }}
              animate={animateProps}
              transition={{
                x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                rotate: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
                y: { type: 'spring', stiffness: 280, damping: 26 },
                top: { type: 'spring', stiffness: 280, damping: 26 },
                left: { type: 'spring', stiffness: 280, damping: 26 },
                scale: { type: 'spring', stiffness: 280, damping: 26 },
              }}
              onClick={() => {
                if (!isTop) {
                  setIndex(originalIndex);
                }
              }}
            >
              {renderCard ? (
                renderCard(item, isTop, originalIndex)
              ) : (
                <div className="bg-[#0E131F] border border-white/[0.08] rounded-2xl p-6 h-full flex flex-col justify-between">
                  <div className="text-white text-sm">{item.content}</div>
                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{item.name}</p>
                      <p className="text-white/40 text-xs">{item.designation}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
