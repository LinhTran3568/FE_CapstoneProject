import { UserRole } from '@ticketshield/types';

/**
 * Helper to check if a user has Admin role
 * Supports both string 'ADMIN' and backend Identity enum value 3 (UserRole.Admin)
 */
export const isAdminRole = (role?: UserRole | string | number | null): boolean => {
  if (role === undefined || role === null) return false;
  const normalized = String(role).trim().toUpperCase();
  return normalized === 'ADMIN' || normalized === '3';
};

/**
 * Helper to check if a user role belongs to platform staff (Admin, CSKH, Moderator)
 */
export const isStaffRole = (role?: UserRole | string | number | null): boolean => {
  if (role === undefined || role === null) return false;
  const normalized = String(role).trim().toUpperCase();
  return (
    normalized === 'ADMIN' ||
    normalized === '3' ||
    normalized === 'CSKH' ||
    normalized === 'MODERATOR' ||
    normalized === 'STAFF'
  );
};
