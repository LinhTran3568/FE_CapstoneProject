import React from 'react';

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {/* Countdown Bar Skeleton */}
      <div className="h-10 rounded-xl bg-[#151C2B] border border-[#293548] px-3.5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-zinc-800" />
          <div className="w-28 h-3 rounded bg-zinc-800" />
        </div>
        <div className="w-16 h-5 rounded-full bg-zinc-800" />
      </div>

      {/* Main 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column: QR Panel Skeleton */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111827] border border-[#293548] p-4 flex flex-col items-center justify-between min-h-[290px]">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="w-24 h-3 rounded bg-zinc-800" />
            <div className="w-12 h-3.5 rounded-full bg-zinc-800" />
          </div>

          <div className="w-44 h-44 rounded-2xl bg-zinc-800 flex items-center justify-center my-auto" />
        </div>

        {/* Right Column: Bank Details Skeleton */}
        <div className="lg:col-span-7 space-y-2.5">
          {/* Transfer Reference Skeleton */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-2">
            <div className="w-40 h-3 rounded bg-zinc-800" />
            <div className="h-10 rounded-lg bg-zinc-800/80" />
          </div>

          {/* Account Details Box Skeleton */}
          <div className="rounded-xl border border-[#293548] bg-[#111827] p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#293548]/60">
              <div className="space-y-1">
                <div className="w-16 h-2.5 rounded bg-zinc-800" />
                <div className="w-24 h-3.5 rounded bg-zinc-800" />
              </div>
              <div className="space-y-1">
                <div className="w-20 h-2.5 rounded bg-zinc-800" />
                <div className="w-28 h-3.5 rounded bg-zinc-800" />
              </div>
            </div>

            <div className="h-11 rounded-lg bg-zinc-800" />
            <div className="h-11 rounded-lg bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
};
