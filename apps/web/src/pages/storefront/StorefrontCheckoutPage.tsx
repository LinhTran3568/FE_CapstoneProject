import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * StorefrontCheckoutPage
 * Đã thay thế bằng luồng CheckoutModal trực tiếp tại trang chọn vé OGTicketStorePage (FE-7.2.2).
 * Tự động chuyển hướng về trang chọn vé & mở modal nhập thông tin vé.
 */
export const StorefrontCheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  return <Navigate to={`/storefront/event/${eventId || 'atsh-2026'}/select-seat`} replace />;
};
