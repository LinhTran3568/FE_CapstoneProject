import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { MarketplaceDetailPage } from '../pages/MarketplaceDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MyTicketsPage } from '../pages/MyTicketsPage';
import { VerifyTicketPage } from '../pages/VerifyTicketPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CheckoutSuccessPage } from '../pages/CheckoutSuccessPage';
import { DisputesPage } from '../pages/DisputesPage';
import { ResellerDashboardPage } from '../pages/ResellerDashboardPage';
import { CreateListingPage } from '../pages/CreateListingPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminBotDetectionPage } from '../pages/AdminBotDetectionPage';
import { AdminResaleMonitoringPage } from '../pages/AdminResaleMonitoringPage';
import { OrganizerDashboardPage } from '../pages/OrganizerDashboardPage';
import { ProtectedRoute, RoleGuard } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/marketplace/:listingId" element={<MarketplaceDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tickets/verify" element={<VerifyTicketPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Buyer Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/checkout/:listingId" element={<CheckoutPage />} />
        <Route path="/checkout/:listingId/success" element={<CheckoutSuccessPage />} />
        <Route path="/disputes" element={<DisputesPage />} />

        {/* Reseller Routes */}
        <Route element={<RoleGuard allowedRoles={['RESELLER', 'ADMIN']} />}>
          <Route path="/seller" element={<ResellerDashboardPage />} />
          <Route path="/seller/listings/new" element={<CreateListingPage />} />
        </Route>

        {/* Admin Monitoring Routes */}
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/bot-detection" element={<AdminBotDetectionPage />} />
          <Route path="/admin/resale-monitoring" element={<AdminResaleMonitoringPage />} />
        </Route>

        {/* Organizer Routes */}
        <Route element={<RoleGuard allowedRoles={['ORGANIZER', 'ADMIN']} />}>
          <Route path="/organizer" element={<OrganizerDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
};
