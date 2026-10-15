import React from 'react';
import { StorefrontEvent } from '../../data/storefrontCatalog';

interface StageLayoutModalProps {
  event: StorefrontEvent;
  isOpen: boolean;
  onClose: () => void;
}

export const StageLayoutModal: React.FC<StageLayoutModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative bg-[#131B26] border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Sơ đồ bố trí sân khấu & khu vực khán đài
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">{event.title} - {event.venueName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#E11D48]"
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Modal Content: Image & Zone Legend */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0B0F17]">
            <img
              src={event.stageLayoutImage}
              alt={`Sơ đồ sân khấu ${event.title}`}
              className="w-full h-auto object-cover max-h-[380px] mx-auto filter contrast-105"
            />
          </div>

          {/* Zone Legend */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-[#94A3B8] tracking-wider">
              Bảng quy ước phân khu khán giả
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="p-3.5 rounded-xl bg-[#0B0F17] border border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tier.tierName}</span>
                    <span className="font-mono text-xs text-[#E11D48] font-bold">
                      {tier.price.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] leading-tight">
                    {tier.seatZone}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 pt-0.5">
                    {tier.gateEntrance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0E1520] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            Đóng & Tiếp tục chọn vé
          </button>
        </div>
      </div>
    </div>
  );
};
