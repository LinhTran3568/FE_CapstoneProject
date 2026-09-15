import React from 'react';
import { X, MapPin } from 'lucide-react';

interface StageMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone: (zone: string) => void;
}

export const StageMapModal: React.FC<StageMapModalProps> = ({
  isOpen,
  onClose,
  onSelectZone,
}) => {
  if (!isOpen) return null;

  const zones = [
    {
      id: 'VIP ZONE A',
      name: 'VIP ZONE A',
      color: 'from-amber-500/30 to-amber-600/10',
      border: 'border-amber-500',
      price: '2.250.000 đ',
      tag: 'Bán chạy nhất',
    },
    {
      id: 'VIP ZONE B',
      name: 'VIP ZONE B',
      color: 'from-orange-500/30 to-orange-600/10',
      border: 'border-orange-500',
      price: '2.100.000 đ',
      tag: 'Tầm nhìn đẹp',
    },
    {
      id: 'FANZONE',
      name: 'FANZONE STANDING',
      color: 'from-rose-500/30 to-rose-600/10',
      border: 'border-rose-500',
      price: '1.650.000 đ',
      tag: 'Sát thần tượng',
    },
    {
      id: 'SVIP',
      name: 'SVIP LOUNGE',
      color: 'from-yellow-400/30 to-yellow-600/10',
      border: 'border-yellow-400',
      price: '3.600.000 đ',
      tag: 'Đặc quyền VIP',
    },
    {
      id: 'GA',
      name: 'GA STANDING',
      color: 'from-blue-500/30 to-blue-600/10',
      border: 'border-blue-500',
      price: '950.000 đ',
      tag: 'Tiết kiệm',
    },
  ];

  return (
    <div
      id="stage-map-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="stage-map-modal-content"
        className="relative w-full max-w-4xl bg-[#0d0f17] border border-[#232736] rounded-3xl shadow-2xl overflow-hidden my-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2331] bg-[#121520]">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <MapPin className="w-5 h-5 text-[#FF5A36]" />
              Sơ đồ sân khấu • Van Hanh Mall Stadium / Mỹ Đình
            </h2>
            <p className="text-xs text-zinc-400">
              Bấm vào khu vực để lọc danh sách vé tương ứng trên sàn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual SVG Stage Layout */}
          <div className="relative p-6 rounded-2xl bg-[#06080d] border border-[#202432] flex flex-col items-center">
            {/* Stage element */}
            <div className="w-64 py-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 rounded-t-2xl text-center text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] text-black">
              ★ SÂN KHẤU CHÍNH (MAIN STAGE) ★
            </div>

            {/* Runway */}
            <div className="w-8 h-14 bg-gradient-to-b from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>

            {/* Stadium Zones Layout */}
            <div className="w-full max-w-lg mt-2 space-y-3">
              {/* Row 1: SVIP & Fanzone */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectZone('SVIP');
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-400/60 hover:bg-yellow-500/30 transition-all text-center cursor-pointer group"
                >
                  <div className="text-xs font-bold text-yellow-300">SVIP LOUNGE</div>
                  <div className="text-[10px] text-zinc-400">3.600.000 đ</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectZone('FANZONE');
                    onClose();
                  }}
                  className="col-span-1 p-3 rounded-xl bg-rose-500/20 border border-rose-500/60 hover:bg-rose-500/30 transition-all text-center cursor-pointer"
                >
                  <div className="text-xs font-bold text-rose-300">FANZONE</div>
                  <div className="text-[10px] text-zinc-400">1.650.000 đ</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectZone('SVIP');
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-yellow-500/20 border border-yellow-400/60 hover:bg-yellow-500/30 transition-all text-center cursor-pointer"
                >
                  <div className="text-xs font-bold text-yellow-300">SVIP LOUNGE</div>
                  <div className="text-[10px] text-zinc-400">3.600.000 đ</div>
                </button>
              </div>

              {/* Row 2: VIP A & VIP B */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelectZone('VIP ZONE A');
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-amber-500/20 border-2 border-amber-500/70 hover:bg-amber-500/30 transition-all text-center cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                >
                  <div className="text-sm font-bold text-amber-300">VIP ZONE A</div>
                  <div className="text-xs text-zinc-400">2.250.000 đ • Hot</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectZone('VIP ZONE B');
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-orange-500/20 border-2 border-orange-500/70 hover:bg-orange-500/30 transition-all text-center cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                >
                  <div className="text-sm font-bold text-orange-300">VIP ZONE B</div>
                  <div className="text-xs text-zinc-400">2.100.000 đ</div>
                </button>
              </div>

              {/* Row 3: GA Standing */}
              <button
                type="button"
                onClick={() => {
                  onSelectZone('GA');
                  onClose();
                }}
                className="w-full p-3 rounded-xl bg-blue-500/20 border border-blue-500/60 hover:bg-blue-500/30 transition-all text-center cursor-pointer"
              >
                <div className="text-xs font-bold text-blue-300">GA STANDING (KHU ĐỨNG PHỔ THÔNG)</div>
                <div className="text-[10px] text-zinc-400">950.000 đ • Tiết kiệm</div>
              </button>
            </div>
          </div>

          {/* Zone list cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => {
                  onSelectZone(z.id);
                  onClose();
                }}
                className={`p-3 rounded-xl border ${z.border} bg-gradient-to-br ${z.color} text-left transition-all hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{z.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
                    {z.tag}
                  </span>
                </div>
                <div className="text-xs font-mono font-extrabold text-white">{z.price}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
