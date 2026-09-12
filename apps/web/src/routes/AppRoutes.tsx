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
import { MyTicketsPage } from '../pages/MyTicketsPage';
import { OrganizerPortalPage } from '../pages/OrganizerPortalPage';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/organizer" element={<OrganizerPortalPage />} />

      {/* Guest-only Pages (Cannot access when already authenticated) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Pages (Requires authenticated session) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sell-ticket" element={<SellTicketPage />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
