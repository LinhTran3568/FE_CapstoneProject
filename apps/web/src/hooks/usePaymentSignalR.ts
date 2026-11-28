import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_CONFIG, TOKEN_STORAGE_KEY } from '@ticketshield/api-client';

export interface SignalRPaymentPayload {
  listingId?: string;
  escrowId?: string;
  paymentReference?: string;
  escrowStatus?: string;
  listingStatus?: string;
  totalBuyerPaid?: number;
  newTicketCode?: string;
  qrCodeData?: string;
}

export interface SignalRPayoutPayload {
  escrowId: string;
  listingId?: string;
  sellerId: string;
  amount: number;
  netSellerPayout?: number;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  bankReference?: string;
  status: string;
  processedAt?: string;
}

export interface UsePaymentSignalROptions {
  listingId?: string | null;
  paymentReference?: string | null;
  sellerId?: string | null;
  enabled?: boolean;
  onPaymentSuccess?: (payload: SignalRPaymentPayload) => void;
  onHoldExpired?: (payload: SignalRPaymentPayload) => void;
  onPayoutCompleted?: (payload: SignalRPayoutPayload) => void;
}

const getHubUrl = (): string => {
  const base = API_CONFIG.baseURL;
  const root = base.replace(/\/api\/v1\/?$/, '');
  return `${root}/hubs/payment`;
};

export const usePaymentSignalR = ({
  listingId,
  paymentReference,
  sellerId,
  enabled = true,
  onPaymentSuccess,
  onHoldExpired,
  onPayoutCompleted,
}: UsePaymentSignalROptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  const onHoldExpiredRef = useRef(onHoldExpired);
  onHoldExpiredRef.current = onHoldExpired;

  const onPayoutCompletedRef = useRef(onPayoutCompleted);
  onPayoutCompletedRef.current = onPayoutCompleted;

  useEffect(() => {
    if (!enabled || (!listingId && !paymentReference && !sellerId)) {
      setIsConnected(false);
      return undefined;
    }

    const hubUrl = getHubUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.None)
      .build();

    const handleSuccess = (data: SignalRPaymentPayload) => {
      if (onPaymentSuccessRef.current) {
        onPaymentSuccessRef.current(data);
      }
    };

    const handleHoldExpired = (data: SignalRPaymentPayload) => {
      if (onHoldExpiredRef.current) {
        onHoldExpiredRef.current(data);
      }
    };

    const handlePayout = (data: SignalRPayoutPayload) => {
      if (onPayoutCompletedRef.current) {
        onPayoutCompletedRef.current(data);
      }
    };

    // Register event listeners
    connection.on('PaymentApproved', handleSuccess);
    connection.on('PaymentCompleted', handleSuccess);
    connection.on('OrderSettled', handleSuccess);
    connection.on('HoldExpired', handleHoldExpired);
    connection.on('PayoutCompleted', handlePayout);

    let isSubscribed = true;

    async function startConnection() {
      try {
        await connection.start();
        if (!isSubscribed) {
          await connection.stop();
          return;
        }

        setIsConnected(true);
        setConnectionError(null);

        // Join specific groups for targeted push notifications
        if (listingId) {
          await connection.invoke('JoinListing', listingId).catch(() => {});
        }
        if (paymentReference) {
          await connection.invoke('JoinPayment', paymentReference).catch(() => {});
        }
        if (sellerId) {
          await connection.invoke('JoinSeller', sellerId).catch(() => {});
        }
      } catch (err: any) {
        if (isSubscribed) {
          setIsConnected(false);
          setConnectionError(err?.message || 'Unable to connect to realtime payment notification server');
        }
      }
    }

    startConnection();

    return () => {
      isSubscribed = false;
      if (listingId && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveListing', listingId).catch(() => {});
      }
      if (paymentReference && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeavePayment', paymentReference).catch(() => {});
      }
      if (sellerId && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveSeller', sellerId).catch(() => {});
      }
      connection.stop().catch(() => {});
      setIsConnected(false);
    };
  }, [enabled, listingId, paymentReference, sellerId]);

  return {
    isConnected,
    connectionError,
  };
};

export const useSellerPayoutSignalR = ({
  sellerId,
  enabled = true,
  onPayoutCompleted,
  onPaymentSuccess,
  onHoldExpired,
}: {
  sellerId?: string | null;
  enabled?: boolean;
  onPayoutCompleted?: (payload: SignalRPayoutPayload) => void;
  onPaymentSuccess?: (payload: SignalRPaymentPayload) => void;
  onHoldExpired?: (payload: SignalRPaymentPayload) => void;
}) => {
  return usePaymentSignalR({
    sellerId,
    enabled,
    onPayoutCompleted,
    onPaymentSuccess,
    onHoldExpired,
  });
};
