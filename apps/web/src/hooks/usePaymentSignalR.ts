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

export interface UsePaymentSignalROptions {
  listingId?: string | null;
  paymentReference?: string | null;
  enabled?: boolean;
  onPaymentSuccess?: (payload: SignalRPaymentPayload) => void;
  onHoldExpired?: (payload: SignalRPaymentPayload) => void;
}

const getHubUrl = (): string => {
  const base = API_CONFIG.baseURL;
  const root = base.replace(/\/api\/v1\/?$/, '');
  return `${root}/hubs/payment`;
};

export const usePaymentSignalR = ({
  listingId,
  paymentReference,
  enabled = true,
  onPaymentSuccess,
  onHoldExpired,
}: UsePaymentSignalROptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  const onHoldExpiredRef = useRef(onHoldExpired);
  onHoldExpiredRef.current = onHoldExpired;

  useEffect(() => {
    if (!enabled || (!listingId && !paymentReference)) {
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

    // Register event listeners
    connection.on('PaymentApproved', handleSuccess);
    connection.on('PaymentCompleted', handleSuccess);
    connection.on('OrderSettled', handleSuccess);
    connection.on('HoldExpired', handleHoldExpired);

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
      connection.stop().catch(() => {});
      setIsConnected(false);
    };
  }, [enabled, listingId, paymentReference]);

  return {
    isConnected,
    connectionError,
  };
};
