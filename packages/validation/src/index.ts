import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['BUYER', 'RESELLER', 'ORGANIZER']),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms of service'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const createListingSchema = z.object({
  ticketId: z.string().min(1, 'Please select a ticket to sell'),
  resalePrice: z.number().min(10000, 'Resale price must be at least 10,000 VNĐ'),
  seatInfo: z.string().min(2, 'Please enter seat information'),
  bankAccount: z.string().min(6, 'Please enter payout bank account number'),
  bankName: z.string().min(2, 'Please select bank name'),
  notes: z.string().optional(),
});

export type CreateListingFormData = z.infer<typeof createListingSchema>;

export const verifyTicketSchema = z.object({
  ticketCode: z.string().min(6, 'Invalid ticket code or lookup reference'),
  eventId: z.string().min(1, 'Please select the corresponding event'),
  idCardNumber: z.string().min(9, 'Invalid ID/citizen card number'),
});

export type VerifyTicketFormData = z.infer<typeof verifyTicketSchema>;

export const checkoutSchema = z.object({
  listingId: z.string().min(1, 'Invalid listing ID'),
  paymentMethod: z.enum(['MOMO', 'VNPAY', 'BANK_TRANSFER', 'CREDIT_CARD']),
  fullName: z.string().min(2, 'Please enter recipient full name'),
  email: z.string().email('Invalid recipient email address'),
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  agreeEscrowTerms: z.boolean().refine((val) => val === true, 'You must agree to the Escrow protection terms'),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const createDisputeSchema = z.object({
  orderId: z.string().min(1, 'Invalid order ID'),
  reason: z.enum([
    'INVALID_TICKET_AT_VENUE',
    'ALREADY_SCANNED',
    'SEAT_MISMATCH',
    'TRANSFER_FAILED',
    'OTHER',
  ]),
  description: z.string().min(20, 'Please describe the issue in detail (at least 20 characters)'),
  evidenceUrls: z.array(z.string()).optional(),
});

export type CreateDisputeFormData = z.infer<typeof createDisputeSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP code must be exactly 6 digits'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

