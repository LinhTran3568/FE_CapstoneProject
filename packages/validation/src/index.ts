import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Địa chỉ email không hợp lệ'),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại Việt Nam không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirmPassword: z.string(),
  role: z.enum(['BUYER', 'RESELLER', 'ORGANIZER']),
  acceptTerms: z.boolean().refine((val) => val === true, 'Bạn phải đồng ý với điều khoản sử dụng'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const createListingSchema = z.object({
  ticketId: z.string().min(1, 'Vui lòng chọn vé cần bán'),
  resalePrice: z.number().min(10000, 'Giá bán phải lớn hơn 10.000 VNĐ'),
  seatInfo: z.string().min(2, 'Vui lòng nhập thông tin chỗ ngồi'),
  bankAccount: z.string().min(6, 'Vui lòng nhập số tài khoản ngân hàng nhận thanh toán'),
  bankName: z.string().min(2, 'Vui lòng chọn tên ngân hàng'),
  notes: z.string().optional(),
});

export type CreateListingFormData = z.infer<typeof createListingSchema>;

export const verifyTicketSchema = z.object({
  ticketCode: z.string().min(6, 'Mã vé / Mã tra cứu không hợp lệ'),
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện tương ứng'),
  idCardNumber: z.string().min(9, 'Số CMND/CCCD không hợp lệ'),
});

export type VerifyTicketFormData = z.infer<typeof verifyTicketSchema>;

export const checkoutSchema = z.object({
  listingId: z.string().min(1, 'Mã niêm yết không hợp lệ'),
  paymentMethod: z.enum(['MOMO', 'VNPAY', 'BANK_TRANSFER', 'CREDIT_CARD']),
  fullName: z.string().min(2, 'Vui lòng nhập họ tên nhận vé'),
  email: z.string().email('Email nhận vé không hợp lệ'),
  phoneNumber: z.string().min(10, 'Số điện thoại không hợp lệ'),
  agreeEscrowTerms: z.boolean().refine((val) => val === true, 'Bạn phải đồng ý với điều khoản bảo vệ Escrow'),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const createDisputeSchema = z.object({
  orderId: z.string().min(1, 'Mã đơn hàng không hợp lệ'),
  reason: z.enum([
    'INVALID_TICKET_AT_VENUE',
    'ALREADY_SCANNED',
    'SEAT_MISMATCH',
    'TRANSFER_FAILED',
    'OTHER',
  ]),
  description: z.string().min(20, 'Vui lòng mô tả chi tiết sự cố (tối thiểu 20 ký tự)'),
  evidenceUrls: z.array(z.string()).optional(),
});

export type CreateDisputeFormData = z.infer<typeof createDisputeSchema>;

export const adminReviewListingSchema = z.object({
  listingId: z.string(),
  action: z.enum(['APPROVE', 'FLAG', 'SUSPEND']),
  reason: z.string().min(5, 'Lý do xử lý không được để trống'),
});

export type AdminReviewListingFormData = z.infer<typeof adminReviewListingSchema>;
