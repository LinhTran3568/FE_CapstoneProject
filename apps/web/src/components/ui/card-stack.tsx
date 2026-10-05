import React, { useState } from 'react';
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
        'font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5',
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

  const currentIndex = activeIndex !== undefined ? activeIndex : internalIndex;

  const setIndex = (idx: number) => {
    if (idx === currentIndex) return;
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
      ? `${(total - 1) * offset + 300}px`
      : '22rem');

  return (
    <div
      className={cn('relative w-full flex items-start justify-center', className)}
      style={{ height: calculatedHeight }}
    >
      <AnimatePresence initial={false}>
        {items.map((item, originalIndex) => {
          const isTop = originalIndex === currentIndex;

          let topPos = 0;
          let zIndexVal = 10;
          let opacityVal = 1;

          if (layoutMode === 'staggered') {
            // Chế độ so le (Staggered Tabs):
            // Thẻ active nằm ở đáy cascade, mở rộng toàn bộ thân thẻ
            // Các thẻ phía sau nhô lên một khoảng `offset` để lộ thanh header
            if (isTop) {
              topPos = inactiveIndices.length * offset;
              zIndexVal = 30;
              opacityVal = 1;
            } else {
              const inactivePos = inactiveIndices.indexOf(originalIndex);
              topPos = inactivePos * offset;
              zIndexVal = 10 + inactivePos;
              opacityVal = 0.95;
            }
          } else {
            // Chế độ stack cổ điển
            const relativeIndex = (originalIndex - currentIndex + total) % total;
            if (relativeIndex > 3) return null;
            topPos = relativeIndex * -14;
            zIndexVal = total - relativeIndex;
            opacityVal = isTop ? 1 : Math.max(0.35, 1 - relativeIndex * 0.28);
          }

          return (
            <motion.div
              key={item.id}
              className={cn(
                'absolute w-full rounded-2xl transition-shadow duration-150',
                isTop
                  ? 'pointer-events-auto shadow-2xl shadow-black/80'
                  : 'pointer-events-auto cursor-pointer shadow-md shadow-black/40 hover:brightness-105',
                cardClassName
              )}
              style={{
                transformOrigin: 'top center',
              }}
              animate={{
                top: topPos,
                zIndex: zIndexVal,
                opacity: opacityVal,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 32,
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
