import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { SellTicketPage } from '../pages/SellTicketPage';
import { MyListingsPage } from '../pages/MyListingsPage';
import { RevenuePreviewPage } from '../pages/RevenuePreviewPage';
import { MyTicketsPage } from '../pages/MyTicketsPage';
import { OrganizerPortalPage } from '../pages/OrganizerPortalPage';
import { PayoutAccountsPage } from '../pages/PayoutAccountsPage';
import { PrivateListingPage } from '../pages/PrivateListingPage';
import { DisputeConsolePage } from '../pages/DisputeConsolePage';
import { AdminConfigPage } from '../pages/AdminConfigPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { StorefrontDiscoveryPage } from '../pages/storefront/StorefrontDiscoveryPage';
import { StorefrontEventDetailPage } from '../pages/storefront/StorefrontEventDetailPage';
import { StorefrontTicketSelectPage } from '../pages/storefront/StorefrontTicketSelectPage';
import { StorefrontCheckoutPage } from '../pages/storefront/StorefrontCheckoutPage';
import { StorefrontPage } from '../pages/storefront/StorefrontPage';
import { StorefrontEventListPage } from '../pages/storefront/StorefrontEventListPage';
import { AdminLayout } from '../components/admin/layout/AdminLayout';
import { ProtectedRoute, GuestRoute, StaffRoute, AdminRoute, UserRoute } from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';
import { isAdminRole } from '../utils/staffRole';

const FallbackRoute: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (isAuthenticated && user && isAdminRole(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public & Customer User Pages (Admin is strictly blocked and redirected to /admin/dashboard) */}
      <Route element={<UserRoute />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/p/:shareToken" element={<PrivateListingPage />} />
        <Route path="/organizer" element={<OrganizerPortalPage />} />
        {import.meta.env.DEV && <Route path="/preview/doanh-thu" element={<RevenuePreviewPage />} />}

        {/* Organizer Public Storefront (US-7.2 - Dedicated Origin Storefront) */}
        <Route path="/storefront" element={<StorefrontDiscoveryPage />} />
        <Route path="/storefront/events" element={<StorefrontEventListPage />} />
        <Route path="/storefront/event/:eventId" element={<StorefrontEventDetailPage />} />
        <Route path="/storefront/event/:eventId/select-seat" element={<StorefrontTicketSelectPage />} />
        <Route path="/storefront/event/:eventId/checkout" element={<StorefrontCheckoutPage />} />
        {/* Support previous/short routes and aliases */}
        <Route path="/storefront/:eventId" element={<StorefrontEventDetailPage />} />
        <Route path="/events/:eventId/tickets" element={<StorefrontTicketSelectPage />} />
        <Route path="/origin" element={<Navigate to="/storefront" replace />} />

        {/* Protected User Pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payout-accounts" element={<PayoutAccountsPage />} />
          <Route path="/sell-ticket" element={<SellTicketPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      {/* Guest-only Pages (Cannot access when already authenticated) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Staff / Moderator Pages */}
      <Route element={<StaffRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/disputes/console" element={<DisputeConsolePage />} />
          <Route path="/admin/disputes" element={<DisputeConsolePage />} />
        </Route>
      </Route>

      {/* Admin Portal (US-6.4 & Complete Admin Redesign) */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/events" element={<Navigate to="/admin/config?tab=markup" replace />} />
          <Route path="/admin/transactions" element={<Navigate to="/admin/config?tab=buffer" replace />} />
          <Route path="/admin/config" element={<AdminConfigPage />} />
          <Route path="/admin/fees" element={<Navigate to="/admin/config?tab=fees" replace />} />
          <Route path="/admin/fee-settings" element={<Navigate to="/admin/config?tab=fees" replace />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  );
};
