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
  renderCard?: (item: T, relativeIndex: number, isTop: boolean) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  containerHeight?: string | number;
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
  offset = 12,
  scaleFactor = 0.04,
  activeIndex,
  onActiveIndexChange,
  renderCard,
  className,
  cardClassName,
  containerHeight = '22rem',
}: CardStackProps<T>) => {
  const [internalIndex, setInternalIndex] = useState(0);

  const currentIndex = activeIndex !== undefined ? activeIndex : internalIndex;
  const setIndex = (idx: number) => {
    if (onActiveIndexChange) {
      onActiveIndexChange(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  if (!items || items.length === 0) return null;

  const total = items.length;

  return (
    <div
      className={cn('relative w-full flex items-center justify-center', className)}
      style={{ height: containerHeight }}
    >
      <AnimatePresence initial={false}>
        {items.map((item, originalIndex) => {
          // Tính relativeIndex so với currentIndex theo vòng tròn
          const relativeIndex = (originalIndex - currentIndex + total) % total;

          // Chỉ render tối đa 3-4 thẻ trên stack để tối ưu hiệu năng
          if (relativeIndex > 3) return null;

          const isTop = relativeIndex === 0;

          return (
            <motion.div
              key={item.id}
              className={cn(
                'absolute w-full rounded-2xl transition-shadow duration-200',
                isTop
                  ? 'pointer-events-auto shadow-2xl shadow-black/60'
                  : 'pointer-events-auto cursor-pointer shadow-lg shadow-black/40 hover:brightness-110',
                cardClassName
              )}
              style={{
                transformOrigin: 'top center',
              }}
              animate={{
                top: relativeIndex * -offset,
                scale: 1 - relativeIndex * scaleFactor,
                zIndex: total - relativeIndex,
                opacity: isTop ? 1 : Math.max(0.35, 1 - relativeIndex * 0.28),
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 26,
              }}
              onClick={() => {
                if (!isTop) {
                  setIndex(originalIndex);
                }
              }}
            >
              {renderCard ? (
                renderCard(item, relativeIndex, isTop)
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
