import React from 'react';
import { EventMarkupControlPanel } from '../components/admin/EventMarkupControlPanel';

export const AdminEventsPage: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5EAF0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#101722] tracking-tight">
            Event Price Ceilings
          </h1>
        </div>
      </div>

      <EventMarkupControlPanel />
    </div>
  );
};

