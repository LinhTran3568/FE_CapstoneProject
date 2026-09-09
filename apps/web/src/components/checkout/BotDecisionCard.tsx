import React from 'react';
import { BotRiskAssessment } from '@ticketshield/types';
import { Card } from '../ui/Card';
import { BotDecisionBadge } from '../ui/BotDecisionBadge';
import { RiskBadge } from '../ui/RiskBadge';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, Activity, Lock } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const BotDecisionCard: React.FC<{ assessment: BotRiskAssessment }> = ({ assessment }) => {
  const { setSimulateBotState } = useUIStore();

  return (
    <Card className="border border-navy-700 bg-navy-850 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-750">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Kiểm Tra Hành Vi An Ninh TicketShield AI</h4>
            <p className="text-xs text-slate-400">Đánh giá phiên làm việc chống Bot tự động</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskBadge score={assessment.score} />
          <BotDecisionBadge decision={assessment.decision} />
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
          <span className="text-slate-400 block mb-1">Tốc độ gửi request</span>
          <span className="font-bold text-slate-200">{assessment.factors.requestVelocity} req/min</span>
        </div>
        <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
          <span className="text-slate-400 block mb-1">Entropy di chuyển chuột</span>
          <span className="font-bold text-slate-200">
            {assessment.factors.mouseMovementEntropy ? assessment.factors.mouseMovementEntropy.toFixed(2) : '0.92'} (Tự nhiên)
          </span>
        </div>
        <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
          <span className="text-slate-400 block mb-1">Độ uy tín địa chỉ IP</span>
          <span className={`font-bold ${assessment.factors.ipReputation === 'CLEAN' ? 'text-emerald-400' : 'text-red-400'}`}>
            {assessment.factors.ipReputation}
          </span>
        </div>
        <div className="bg-navy-900 p-2.5 rounded-lg border border-navy-800">
          <span className="text-slate-400 block mb-1">Fingerprint thiết bị</span>
          <span className="font-mono text-[10px] text-cyan-400 truncate block">
            {assessment.factors.deviceFingerprintHash}
          </span>
        </div>
      </div>

      {/* Interactive Switcher for Capstone Demonstration */}
      <div className="pt-3 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 font-medium">Mô phỏng trạng thái AI (Dành cho Đồ Án):</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSimulateBotState('ALLOWED')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              assessment.decision === 'ALLOWED'
                ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                : 'bg-navy-800 text-slate-400 hover:text-white'
            }`}
          >
            1. ALLOWED (Hợp lệ)
          </button>
          <button
            onClick={() => setSimulateBotState('THROTTLED')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              assessment.decision === 'THROTTLED'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-navy-800 text-slate-400 hover:text-white'
            }`}
          >
            2. THROTTLED (Thách thức CAPTCHA)
          </button>
          <button
            onClick={() => setSimulateBotState('BLOCKED')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
              assessment.decision === 'BLOCKED'
                ? 'bg-red-500 text-white shadow-glow-red'
                : 'bg-navy-800 text-slate-400 hover:text-white'
            }`}
          >
            3. BLOCKED (Khóa Bot)
          </button>
        </div>
      </div>
    </Card>
  );
};
