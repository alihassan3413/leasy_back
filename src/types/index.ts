// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

export type UserRole = 'B2C' | 'B2B' | 'WORKSHOP' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  phone?: string
  bankData?: BankData
  companyId?: string
  workshopId?: string
}

export interface BankData {
  iban: string
  bankName: string
  accountHolder: string
}

export interface AuthTokens {
  accessToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// ─────────────────────────────────────────────
// AUTH API TYPES
// ─────────────────────────────────────────────

export type RegisterUserType =
  | 'Privatkunde'
  | 'Firmenkunde'
  | 'Werksatatt'
  | 'Admin'

export interface LoginPayload {
  user_email: string
  password: string
}

export interface RawLoginResponse {
  ok: boolean
  data: {
    token: string
    user_type: RegisterUserType | 'Werkstatt'
    user_id: string
  }
  message: string
}

export interface RegisterPayload {
  user_email: string
  password: string
  user_type: RegisterUserType
}

export interface RegisterResponse {
  ok: boolean
  data: {
    created_at: string
    user_email: string
    user_id: string
    user_type: RegisterUserType
  }
  message: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

// ─────────────────────────────────────────────
// API ERROR (standardized shape)
// ─────────────────────────────────────────────

export interface AppError {
  code: number
  message: string
  field?: string
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