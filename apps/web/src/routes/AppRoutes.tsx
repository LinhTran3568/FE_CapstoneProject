import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute, StaffRoute, AdminRoute, UserRoute } from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';
import { isAdminRole } from '../utils/staffRole';

const lazyNamed = (loader: () => Promise<any>, exportName: string) =>
  lazy(async () => ({ default: (await loader())[exportName] }));

// Pages are intentionally split by route. Loading every portal, chart, camera,
// QR and 3D dependency on the first public page made the initial bundle 1.65 MB.
const HomePage = lazyNamed(() => import('../pages/HomePage'), 'HomePage');
const LoginPage = lazyNamed(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('../pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('../pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage');
const DashboardPage = lazyNamed(() => import('../pages/DashboardPage'), 'DashboardPage');
const ProfilePage = lazyNamed(() => import('../pages/ProfilePage'), 'ProfilePage');
const MarketplacePage = lazyNamed(() => import('../pages/MarketplacePage'), 'MarketplacePage');
const SellTicketPage = lazyNamed(() => import('../pages/SellTicketPage'), 'SellTicketPage');
const MyListingsPage = lazyNamed(() => import('../pages/MyListingsPage'), 'MyListingsPage');
const RevenuePreviewPage = lazyNamed(() => import('../pages/RevenuePreviewPage'), 'RevenuePreviewPage');
const MyTicketsPage = lazyNamed(() => import('../pages/MyTicketsPage'), 'MyTicketsPage');
const OrganizerPortalPage = lazyNamed(() => import('../pages/OrganizerPortalPage'), 'OrganizerPortalPage');
const PayoutAccountsPage = lazyNamed(() => import('../pages/PayoutAccountsPage'), 'PayoutAccountsPage');
const PrivateListingPage = lazyNamed(() => import('../pages/PrivateListingPage'), 'PrivateListingPage');
const DisputeConsolePage = lazyNamed(() => import('../pages/DisputeConsolePage'), 'DisputeConsolePage');
const AdminConfigPage = lazyNamed(() => import('../pages/AdminConfigPage'), 'AdminConfigPage');
const AdminDashboardPage = lazyNamed(() => import('../pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminUsersPage = lazyNamed(() => import('../pages/AdminUsersPage'), 'AdminUsersPage');
const AdminProfilePage = lazyNamed(() => import('../pages/AdminProfilePage'), 'AdminProfilePage');
const AdminOrganizersPage = lazyNamed(() => import('../pages/AdminOrganizersPage'), 'AdminOrganizersPage');
const StorefrontDiscoveryPage = lazyNamed(() => import('../pages/storefront/StorefrontDiscoveryPage'), 'StorefrontDiscoveryPage');
const StorefrontEventDetailPage = lazyNamed(() => import('../pages/storefront/StorefrontEventDetailPage'), 'StorefrontEventDetailPage');
const StorefrontTicketSelectPage = lazyNamed(() => import('../pages/storefront/StorefrontTicketSelectPage'), 'StorefrontTicketSelectPage');
const StorefrontCheckoutPage = lazyNamed(() => import('../pages/storefront/StorefrontCheckoutPage'), 'StorefrontCheckoutPage');
const StorefrontEventListPage = lazyNamed(() => import('../pages/storefront/StorefrontEventListPage'), 'StorefrontEventListPage');
const OGTicketStorePage = lazyNamed(() => import('../pages/storefront/OGTicketStorePage'), 'OGTicketStorePage');
const AdminLayout = lazyNamed(() => import('../components/admin/layout/AdminLayout'), 'AdminLayout');

const RouteLoading: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Loading page">
    <div className="w-8 h-8 rounded-full border-2 border-[#FF5A36]/25 border-t-[#FF5A36] animate-spin" />
  </div>
);

const FallbackRoute: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  if (isAuthenticated && user && isAdminRole(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
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
        <Route path="/storefront/event/:eventId/select-seat" element={<OGTicketStorePage />} />
        <Route path="/storefront/event/:eventId/tiers" element={<OGTicketStorePage />} />
        <Route path="/storefront/event/:eventId/og-store" element={<OGTicketStorePage />} />
        <Route path="/storefront/event/:eventId/interactive-map" element={<StorefrontTicketSelectPage />} />
        <Route path="/storefront/event/:eventId/checkout" element={<StorefrontCheckoutPage />} />
        {/* Support previous/short routes and aliases */}
        <Route path="/storefront/:eventId" element={<StorefrontEventDetailPage />} />
        <Route path="/events/:eventId/tickets" element={<OGTicketStorePage />} />
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
          <Route path="/admin/profile" element={<AdminProfilePage />} />
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
          <Route path="/admin/organizers" element={<AdminOrganizersPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </Suspense>
  );
};
