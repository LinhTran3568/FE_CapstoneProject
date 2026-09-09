import React from 'react';
import { useMyTickets } from '../hooks/useTickets';
import { DigitalTicketCard } from '../components/ticket/DigitalTicketCard';
import { Ticket } from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const { data: tickets, isLoading } = useMyTickets();

  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Ví Vé Sự Kiện Của Tôi</h1>
        <p className="text-sm text-slate-400 mt-1">Quản lý vé đã mua, mã QR động check-in cổng sự kiện và trạng thái Escrow</p>
      </div>

      {isLoading ? (
        <div className="h-64 bg-navy-800 rounded-2xl animate-pulse" />
      ) : (
        <div className="space-y-6">
          {tickets?.map((ticket) => (
            <DigitalTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};
