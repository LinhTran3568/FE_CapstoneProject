import React, { useCallback, useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, QrCode, RefreshCw, Ticket, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { PurchasedTicketDto } from '@ticketshield/types';
import { useMyTickets } from '../hooks/useMyTickets';

const entryPayload = (ticket: PurchasedTicketDto) =>
  (ticket.qrCodeData || ticket.ticketPassCode || '').trim();

const canShowEntryQr = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  if (status === 'PENDING_PAYMENT' || status === 'REFUNDED') return false;
  return entryPayload(ticket).length > 0;
};

const statusLabel = (ticket: PurchasedTicketDto) => {
  const status = (ticket.status || '').trim().toUpperCase();
  if (status === 'PENDING_PAYMENT') return 'Pending payment';
  if (status === 'DISPUTED') return 'Disputed';
  if (status === 'IN_ESCROW') return 'In escrow';
  if (status === 'VALID') return 'Valid';
  return ticket.status;
};

export const MyTicketsPage: React.FC = () => {
  const { data: tickets = [], isPending, isError, error, refetch, isFetching } = useMyTickets();
  const [qrTicket, setQrTicket] = useState<PurchasedTicketDto | null>(null);

  return (
    <div className="relative min-h-screen bg-[#05070A] text-[#F5F5F2] pt-28 pb-20 px-6 md:px-12 font-sans antialiased overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/images/landing/ticket-bg.jpg"
          alt=""
          className="w-full h-full object-cover opacity-25 filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070A]/90 via-[#05070A]/85 to-[#05070A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF5A36]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold font-display text-white uppercase tracking-tight">
            My Purchased Passes
          </h1>
          <p className="text-sm text-[#A3A8B3]">
            Tickets bought on TicketShield. Entry code and QR come from the organizer after payment.
          </p>
        </div>

        {isPending && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" aria-hidden="true" />
            <p className="text-xs text-[#8B929C] font-mono">Loading purchased tickets...</p>
          </div>
        )}

        {isError && (
          <div className="py-16 bg-[#0A0D12]/90 border border-rose-500/20 rounded-3xl p-8 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-white">Could not load purchased tickets</h2>
            <p className="text-xs text-[#8B929C] max-w-md mx-auto">
              {error instanceof Error
                ? error.message
                : 'Core GET /resale-listings/my-purchased-tickets failed. Sign in again or check the Gateway.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2 min-h-11 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Reload</span>
            </button>
          </div>
        )}

        {!isPending && !isError && tickets.length === 0 && (
          <div className="py-24 bg-[#090C12]/60 border border-white/10 rounded-3xl p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center">
              <Ticket className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">No paid tickets yet</h2>
              <p className="text-xs text-[#8B929C] max-w-md mx-auto">
                Buy on the marketplace. After the bank confirms, the new organizer code appears here.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center px-5 py-2.5 min-h-11 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Marketplace
            </Link>
          </div>
        )}

        {!isPending && !isError && tickets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tickets.map((ticket) => {
              const code = entryPayload(ticket);
              const showQr = canShowEntryQr(ticket);
              return (
                <div
                  key={ticket.escrowId}
                  className="bg-[#0A0D12] border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 gap-3">
                    <span className="text-xs font-mono text-[#FF5A36] font-bold">DIGITAL PASS</span>
                    <span className="text-xs font-mono text-[#A3A8B3]">{statusLabel(ticket)}</span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-xl font-bold font-display text-white">{ticket.eventName}</h2>
                    <div className="flex items-center gap-2 text-xs text-[#A3A8B3] font-mono">
                      <Ticket className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                      <span className="text-white font-semibold">{ticket.seatZone}</span>
                    </div>
                    {ticket.eventVenue ? (
                      <p className="text-xs text-[#8B929C]">{ticket.eventVenue}</p>
                    ) : null}
                    {code ? (
                      <p className="text-xs font-mono text-[#A3A8B3] break-all">{code}</p>
                    ) : (
                      <p className="text-xs text-[#8B929C]">No organizer ticket code yet.</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    {showQr ? (
                      <button
                        type="button"
                        onClick={() => setQrTicket(ticket)}
                        className="px-5 py-2.5 min-h-11 bg-[#FF5A36] hover:bg-[#FF7252] text-white font-bold font-display text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FF5A36]/25 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <QrCode className="w-4 h-4" aria-hidden="true" />
                        <span>Show Entry QR Code</span>
                      </button>
                    ) : (
                      <p className="text-xs text-[#8B929C]">
                        Entry QR appears after payment succeeds and the organizer issues a new code.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {qrTicket && (
        <EntryQrModal ticket={qrTicket} onClose={() => setQrTicket(null)} />
      )}
    </div>
  );
};

const EntryQrModal: React.FC<{ ticket: PurchasedTicketDto; onClose: () => void }> = ({
  ticket,
  onClose,
}) => {
  const titleId = useId();
  const payload = entryPayload(ticket);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[#0A0D12] border border-white/20 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-[#A3A8B3] hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="space-y-1 pr-10">
          <p className="text-xs font-mono text-[#FF5A36] font-bold uppercase tracking-wider">Entry pass</p>
          <h2 id={titleId} className="text-lg font-bold text-white">
            {ticket.eventName}
          </h2>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="p-3.5 bg-white rounded-2xl">
            <QRCodeCanvas value={payload} size={180} level="H" includeMargin={false} />
          </div>
          <p className="text-sm font-mono text-white break-all text-center">{payload}</p>
          <p className="text-xs text-[#A3A8B3] text-center">{ticket.seatZone}</p>
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
