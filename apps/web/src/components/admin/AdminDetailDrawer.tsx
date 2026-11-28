import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface AdminDetailDrawerProps {
  /** Dòng nhỏ phía trên tiêu đề, ví dụ "Transaction". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Vỏ khung chi tiết bên phải cho các trang Admin (màu nền sáng của khu Admin).
 * Đóng bằng nút đóng, phím Esc hoặc bấm ra ngoài. Cùng cách làm với DisputeProgressDrawer.
 */
export const AdminDetailDrawer: React.FC<AdminDetailDrawerProps> = ({ eyebrow, title, subtitle, onClose, children }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trang cha render lại thì đưa onClose mới, giữ trong ref để effect không chạy lại và giật focus.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end bg-[#101722]/40 backdrop-blur-xs" onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="flex h-full w-full max-w-[480px] flex-col border-l border-[#E5EAF0] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#E5EAF0] px-5 pb-3.5 pt-[18px]">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#667085]">{eyebrow}</p>
            <h2 id={titleId} className="mt-0.5 truncate text-[16px] font-bold text-[#101722]">
              {title}
            </h2>
            {subtitle && <p className="truncate text-[11.5px] text-[#667085]">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E5EAF0] bg-white text-[#667085] transition-colors hover:bg-slate-50 hover:text-[#101722] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">{children}</div>
      </motion.aside>
    </div>,
    document.body
  );
};

/** Một khối trong khung chi tiết, có tiêu đề nhỏ. */
export const DrawerSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="mb-2 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#667085]">{title}</h3>
    {children}
  </section>
);

/** Một dòng nhãn bên trái, giá trị bên phải. */
export const DrawerRow: React.FC<{ label: string; children: React.ReactNode; strong?: boolean }> = ({
  label,
  children,
  strong,
}) => (
  <div className="flex items-start justify-between gap-4 py-1 text-xs">
    <span className="shrink-0 text-[#667085]">{label}</span>
    <span className={`min-w-0 break-words text-right text-[#101722] ${strong ? 'font-bold' : 'font-medium'}`}>
      {children}
    </span>
  </div>
);
