import { UserRole } from '@ticketshield/types';

/**
 * Helper to check if a user role belongs to platform staff (Admin, CSKH, Moderator)
 */
export const isStaffRole = (role?: UserRole | string | number | null): boolean => {
  if (role === undefined || role === null) return false;
  const normalized = String(role).trim().toUpperCase();
  return (
    normalized === 'ADMIN' ||
    normalized === 'CSKH' ||
    normalized === 'MODERATOR' ||
    normalized === 'STAFF' ||
    normalized === '1' ||
    normalized === '2'
  );
};
