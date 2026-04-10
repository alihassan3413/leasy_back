// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

export type UserRole = 'B2C' | 'B2B' | 'WORKSHOP' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone?: string
  // Bank data lives in profile, NOT in payment methods (privacy decision)
  bankData?: BankData
  companyId?: string       // only for B2B users
  workshopId?: string      // only for WORKSHOP users
}

export interface BankData {
  iban: string
  bankName: string
  accountHolder: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number        // Unix timestamp (seconds)
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// ─────────────────────────────────────────────
// AUTH PAYLOADS
// ─────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

interface BaseRegisterPayload {
  role: UserRole
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface B2CRegisterPayload extends BaseRegisterPayload {
  role: 'B2C'
}

export interface B2BRegisterPayload extends BaseRegisterPayload {
  role: 'B2B'
  companyName: string
  companyRegistrationNumber: string
}

export interface WorkshopRegisterPayload extends BaseRegisterPayload {
  role: 'WORKSHOP'
  workshopName: string
  address: string
}

// Admin accounts are provisioned internally — no public registration
export type RegisterPayload = B2CRegisterPayload | B2BRegisterPayload | WorkshopRegisterPayload

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

// ─────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────

export interface Vehicle {
  id: string
  licensePlate: string     // German format: e.g. "M-AB 1234"
  make: string             // e.g. "BMW"
  model: string            // e.g. "3er"
  year: number
  color: string
  leaseEndDate: string     // ISO date string
  status: VehicleStatus
  lessee: User             // person on the contract
  driver?: User            // person who actually drives it (can differ from lessee)
  returnProcessId?: string // set when return has started
}

export type VehicleStatus =
  | 'ACTIVE'           // lease ongoing
  | 'RETURN_PENDING'   // return process started
  | 'RETURNED'         // fully returned
  | 'INSPECTED'        // workshop has inspected it

// ─────────────────────────────────────────────
// RETURN PROCESS
// ─────────────────────────────────────────────

export interface ReturnProcess {
  id: string
  vehicleId: string
  status: ReturnStatus
  currentStep: number
  totalSteps: number
  damageReports: DamageReport[]
  appointmentId?: string
  createdAt: string
}

export type ReturnStatus = 'DRAFT' | 'SUBMITTED' | 'APPOINTMENT_BOOKED' | 'COMPLETED'

export interface DamageReport {
  id: string
  description: string
  location: string         // e.g. "front bumper"
  severity: 'MINOR' | 'MAJOR'
  photos: string[]         // URLs
}

// ─────────────────────────────────────────────
// APPOINTMENT
// ─────────────────────────────────────────────

export interface Appointment {
  id: string
  vehicleId: string
  workshopId: string
  date: string             // ISO date string
  timeSlot: string         // e.g. "09:00"
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
}

// ─────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────

export interface Invoice {
  id: string
  vehicleId: string
  amount: number
  currency: 'EUR'
  dueDate: string
  paidAt?: string
  pdfUrl: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
}

// ─────────────────────────────────────────────
// API ERROR (standardized shape)
// ─────────────────────────────────────────────

export interface AppError {
  code: number
  message: string
  field?: string
}
