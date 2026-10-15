import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../../components/storefront/layout/StorefrontLayout';
import { StorefrontHero } from '../../components/storefront/StorefrontHero';
import { TicketTierList } from '../../components/storefront/TicketTierList';
import { OrderSummary } from '../../components/storefront/OrderSummary';
import { CheckoutForm, CheckoutOrderResult } from '../../components/storefront/CheckoutForm';
import { OrderSuccess } from '../../components/storefront/OrderSuccess';
import { StageLayoutModal } from '../../components/storefront/StageLayoutModal';
import {
  getStorefrontEventById,
  StorefrontEvent,
  StorefrontTier,
} from '../../data/storefrontCatalog';

const ORGANIZER_API_BASE = 'http://localhost:5001/api/organizer';

export const StorefrontPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<StorefrontEvent>(() =>
    getStorefrontEventById(eventId)
  );
  const [tiers, setTiers] = useState<StorefrontTier[]>(event.tiers);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [activeStep, setActiveStep] = useState<'select' | 'checkout' | 'success'>('select');
  const [orderResult, setOrderResult] = useState<CheckoutOrderResult | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);

  // Update event when route param changes
  useEffect(() => {
    const selected = getStorefrontEventById(eventId);
    setEvent(selected);
    setTiers(selected.tiers);
    setSelectedQuantities({});
    setActiveStep('select');
    setOrderResult(null);

    // Try fetching live tiers from MockOrganizer API if running
    const fetchLiveTiers = async () => {
      try {
        const res = await fetch(`${ORGANIZER_API_BASE}/events/${selected.id}/tiers`);
        if (res.ok) {
          const liveData: Array<{
            id: string;
            tierName: string;
            price: number;
            totalQuantity: number;
            availableQuantity: number;
          }> = await res.json();

          if (Array.isArray(liveData) && liveData.length > 0) {
            setTiers((prev) =>
              prev.map((staticTier) => {
                const live = liveData.find((l) => l.id === staticTier.id || l.tierName === staticTier.tierName);
                if (live) {
                  return {
                    ...staticTier,
                    availableQuantity: live.availableQuantity,
                    price: live.price,
                  };
                }
                return staticTier;
              })
            );
          }
        }
      } catch {
        // MockOrganizer offline: use catalog seed data
      }
    };

    fetchLiveTiers();
  }, [eventId]);

  const handleQuantityChange = (tierId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[tierId] || 0;
      const targetTier = tiers.find((t) => t.id === tierId);
      if (!targetTier) return prev;

      const maxLimit = Math.min(targetTier.maxPerOrder, targetTier.availableQuantity);
      const next = Math.max(0, Math.min(maxLimit, current + delta));

      if (next === 0) {
        const copy = { ...prev };
        delete copy[tierId];
        return copy;
      }
      return { ...prev, [tierId]: next };
    });
  };

  const handleProceedToCheckout = () => {
    setActiveStep('checkout');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleBackToSelection = () => {
    setActiveStep('select');
  };

  const handleCheckoutSuccess = (result: CheckoutOrderResult) => {
    setOrderResult(result);
    setActiveStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetOrder = () => {
    setSelectedQuantities({});
    setActiveStep('select');
    setOrderResult(null);
    navigate('/storefront/events');
  };

  return (
    <StorefrontLayout activeEventId={event.id}>
      {/* Hero Header */}
      <StorefrontHero
        event={event}
        onViewStageModal={() => setIsStageModalOpen(true)}
      />

      {/* Main Flow Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {activeStep === 'select' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 8 cols: Ticket Tier List */}
            <div className="lg:col-span-8 space-y-10">
              <TicketTierList
                tiers={tiers}
                selectedQuantities={selectedQuantities}
                onQuantityChange={handleQuantityChange}
              />

              {/* Event Admission Policy Section */}
              <div className="bg-[#131B26] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                  <h3 className="font-display font-bold text-base text-white">
                    Quy chế kiểm soát vào cổng của Ban Tổ Chức
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#CBD5E1]">
                  {event.admissionPolicy.map((policy, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-[#0B0F17] p-3 rounded-xl border border-white/5">
                      <span className="text-[#94A3B8] font-mono shrink-0">0{idx + 1}.</span>
                      <span className="leading-relaxed">{policy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 cols: Sticky Order Summary */}
            <div className="lg:col-span-4">
              <OrderSummary
                tiers={tiers}
                selectedQuantities={selectedQuantities}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </div>
          </div>
        )}

        {activeStep === 'checkout' && (
          <CheckoutForm
            event={event}
            tiers={tiers}
            selectedQuantities={selectedQuantities}
            onBackToSelection={handleBackToSelection}
            onCheckoutSuccess={handleCheckoutSuccess}
          />
        )}

        {activeStep === 'success' && orderResult && (
          <OrderSuccess
            orderResult={orderResult}
            onResetOrder={handleResetOrder}
          />
        )}
      </div>

      {/* Stage Layout Modal */}
      <StageLayoutModal
        event={event}
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
      />
    </StorefrontLayout>
  );
};
