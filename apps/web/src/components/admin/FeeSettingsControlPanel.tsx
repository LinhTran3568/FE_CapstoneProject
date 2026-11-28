import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi, ResaleFeeConfigDto, UpdateFeeSettingsRequest } from '@ticketshield/api-client';
import {
  Percent,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface FeeSettingsControlPanelProps {
  onConfigUpdated?: (config: ResaleFeeConfigDto) => void;
}

const feeInputClass = 'w-full rounded-lg border border-[#D0D5DD] bg-white py-2 pl-3.5 pr-14 font-mono text-sm text-[#101722] focus:outline-none focus:border-[#F45135] focus:ring-1 focus:ring-[#F45135] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const unitClass = 'pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#667085]';

const formatAmount = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const selectZero = (event: React.FocusEvent<HTMLInputElement>) => {
  if (event.currentTarget.value === '0') event.currentTarget.select();
};

export const FeeSettingsControlPanel: React.FC<FeeSettingsControlPanelProps> = ({ onConfigUpdated }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Baseline values loaded from server
  const [savedConfig, setSavedConfig] = useState<ResaleFeeConfigDto | null>(null);

  // Form input states (percentages in 0-100 format for display/input)
  const [buyerFeePercent, setBuyerFeePercent] = useState('');
  const [sellerFeePercent, setSellerFeePercent] = useState('');
  const [minBuyerFee, setMinBuyerFee] = useState('');
  const [minSellerFee, setMinSellerFee] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getFeeSettings();
      if (data) {
        setSavedConfig(data);
        setBuyerFeePercent(String(Number((data.buyerFeePercentage * 100).toFixed(2))));
        setSellerFeePercent(String(Number((data.sellerFeePercentage * 100).toFixed(2))));
        setMinBuyerFee(String(data.minimumBuyerFee));
        setMinSellerFee(String(data.minimumSellerFee));
      }
    } catch (err: any) {
      console.error('Failed to load fee configuration:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Unable to load fee configuration from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isDirty = savedConfig
    ? [buyerFeePercent, sellerFeePercent, minBuyerFee, minSellerFee].includes('') ||
      Math.abs(savedConfig.buyerFeePercentage * 100 - Number(buyerFeePercent)) > 0.001 ||
      Math.abs(savedConfig.sellerFeePercentage * 100 - Number(sellerFeePercent)) > 0.001 ||
      savedConfig.minimumBuyerFee !== Number(minBuyerFee) ||
      savedConfig.minimumSellerFee !== Number(minSellerFee)
    : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation matching backend constraints
    if (Number(buyerFeePercent) < 0 || Number(buyerFeePercent) > 15) {
      setErrorMessage('Buyer service fee must be between 0% and 15%.');
      return;
    }
    if (Number(sellerFeePercent) < 0 || Number(sellerFeePercent) > 10) {
      setErrorMessage('Seller service fee must be between 0% and 10%.');
      return;
    }
    if (Number(minBuyerFee) < 0 || Number(minSellerFee) < 0) {
      setErrorMessage('Minimum fee cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      const payload: UpdateFeeSettingsRequest = {
        buyerFeePercentage: Number((Number(buyerFeePercent) / 100).toFixed(4)),
        sellerFeePercentage: Number((Number(sellerFeePercent) / 100).toFixed(4)),
        minimumBuyerFee: Number(minBuyerFee),
        minimumSellerFee: Number(minSellerFee),
      };

      await adminApi.updateFeeSettings(payload);
      await queryClient.invalidateQueries({ queryKey: ['resale-fee-config'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-fee-settings'] });
      const updatedConfig: ResaleFeeConfigDto = {
        buyerFeePercentage: payload.buyerFeePercentage,
        sellerFeePercentage: payload.sellerFeePercentage,
        minimumBuyerFee: payload.minimumBuyerFee,
        minimumSellerFee: payload.minimumSellerFee,
      };
      setSavedConfig(updatedConfig);
      onConfigUpdated?.(updatedConfig);
      setSuccessMessage('Platform resale fee configuration updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save fee settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* Alert Notices */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-950 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fee Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E5EAF0] rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
      >
        {/* Form Header */}
        <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
          <h3 className="text-sm font-bold text-[#101722] flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#F45135]" />
            <span>Service fee settings</span>
          </h3>
          <button
            type="button"
            onClick={fetchSettings}
            className="p-1.5 rounded-lg border border-[#E5EAF0] text-[#667085] hover:text-[#101722] hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reload settings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F45135]' : ''}`} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { side: 'Buyer', max: 15, rate: buyerFeePercent, setRate: setBuyerFeePercent, amount: minBuyerFee, setAmount: setMinBuyerFee },
            { side: 'Seller', max: 10, rate: sellerFeePercent, setRate: setSellerFeePercent, amount: minSellerFee, setAmount: setMinSellerFee },
          ].map(({ side, max, rate, setRate, amount, setAmount }) => (
            <div key={side} role="group" aria-labelledby={side + '-heading'}
              className="min-w-0 space-y-4 rounded-lg border border-[#E5EAF0] bg-slate-50 p-4">
              <h4 id={side + '-heading'} className="text-sm font-bold text-[#101722]">
                {side === 'Buyer' ? 'Buyer fee' : 'Seller fee'}
              </h4>
              <div className="min-w-0 space-y-1.5">
                <label htmlFor={side + '-rate'} className="block text-xs font-semibold text-[#344054]">Fee rate</label>
                <div className="relative">
                  <input id={side + '-rate'} type="number" inputMode="decimal" min="0" max={max} step="0.1" required
                    aria-describedby={side + '-rate-hint'} value={rate} onFocus={selectZero}
                    onChange={(event) => setRate(event.target.value)}
                    className={feeInputClass} />
                  <span className={unitClass}>%</span>
                </div>
                <p id={side + '-rate-hint'} className="text-xs text-[#667085]">0% to {max}%</p>
              </div>
              <div className="min-w-0 space-y-1.5">
                <label htmlFor={side + '-minimum'} className="block text-xs font-semibold text-[#344054]">Minimum fee</label>
                <div className="relative">
                  <input id={side + '-minimum'} type="text" inputMode="numeric" required
                    aria-describedby={side + '-minimum-hint'} value={formatAmount(amount)} onFocus={selectZero}
                    onChange={(event) => setAmount(event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
                    className={feeInputClass} />
                  <span className={unitClass}>VND</span>
                </div>
                <p id={side + '-minimum-hint'} className="text-xs text-[#667085]">Enter 0 for no minimum.</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions Footer */}
        <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#667085]">
            {isDirty ? (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            ) : (
              <span>No changes</span>
            )}
          </span>

          <button
            type="submit"
            disabled={!isDirty || saving}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDirty
                ? 'bg-[#F45135] hover:bg-[#e0452a] text-white shadow-2xs cursor-pointer'
                : 'bg-slate-100 text-[#667085] border border-[#E5EAF0] cursor-not-allowed opacity-60'
            }`}
            title={isDirty ? 'Save settings' : 'No changes to save'}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
