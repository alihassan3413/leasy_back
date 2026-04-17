// ─────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────

export type UserRole = "B2C" | "B2B" | "WORKSHOP" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bankData?: BankData;
  companyId?: string;
  workshopId?: string;
}

export interface BankData {
  iban: string;
  bankName: string;
  accountHolder: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─────────────────────────────────────────────
// AUTH API TYPES
// ─────────────────────────────────────────────

export type RegisterUserType =
  | "Privatkunde"
  | "Firmenkunde"
  | "Werksatatt"
  | "Admin";

export interface LoginPayload {
  user_email: string;
  password: string;
}

export interface RawLoginResponse {
  ok: boolean;
  data: {
    token: string;
    user_type: RegisterUserType | "Werkstatt";
    user_id: string;
  };
  message: string;
}

export interface RegisterPayload {
  user_email: string;
  password: string;
  user_type: RegisterUserType;
}

export interface RegisterResponse {
  ok: boolean;
  data: {
    created_at: string;
    user_email: string;
    user_id: string;
    user_type: RegisterUserType;
  };
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// ─────────────────────────────────────────────
// API ERROR (standardized shape)
// ─────────────────────────────────────────────

export interface AppError {
  code: number;
  message: string;
  field?: string;
}

// ─────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────

export interface Vehicle {
  id: string;
  licensePlate: string; // German format: e.g. "M-AB 1234"
  make: string; // e.g. "BMW"
  model: string; // e.g. "3er"
  year: number;
  color: string;
  leaseEndDate: string; // ISO date string
  status: VehicleStatus;
  lessee: User; // person on the contract
  driver?: User; // person who actually drives it (can differ from lessee)
  returnProcessId?: string; // set when return has started
}

export type VehicleStatus =
  | "ACTIVE" // lease ongoing
  | "RETURN_PENDING" // return process started
  | "RETURNED" // fully returned
  | "INSPECTED"; // workshop has inspected it

// ─────────────────────────────────────────────
// RETURN PROCESS
// ─────────────────────────────────────────────

export interface ReturnProcess {
  id: string;
  vehicleId: string;
  status: ReturnStatus;
  currentStep: number;
  totalSteps: number;
  damageReports: DamageReport[];
  appointmentId?: string;
  createdAt: string;
}

export type ReturnStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPOINTMENT_BOOKED"
  | "COMPLETED";

export interface DamageReport {
  id: string;
  description: string;
  location: string; // e.g. "front bumper"
  severity: "MINOR" | "MAJOR";
  photos: string[]; // URLs
}

// ─────────────────────────────────────────────
// APPOINTMENT
// ─────────────────────────────────────────────

export interface Appointment {
  id: string;
  vehicleId: string;
  workshopId: string;
  date: string; // ISO date string
  timeSlot: string; // e.g. "09:00"
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

// ─────────────────────────────────────────────
// B2C PROFILE API TYPES
// ─────────────────────────────────────────────

export interface B2CProfileAddress {
  street: string
  number: string
  additional_address?: string
  zip_code: string
  city: string
  country: string
  longitude?: number
  latitude?: number
}

export interface B2CProfileContact {
  salutation: string
  first_name: string
  last_name: string
}

export interface B2CPhone {
  international_prefix: string
  phone_number: string
}

export interface B2CProfileCreatePayload {
  address: B2CProfileAddress
  contact: B2CProfileContact
  phones: B2CPhone[]
}

export interface B2CProfileCreateResponse {
  address_id: string
  contact_id: string
  status: 'created'
}

// ─────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────

export interface Invoice {
  id: string;
  vehicleId: string;
  amount: number;
  currency: "EUR";
  dueDate: string;
  paidAt?: string;
  pdfUrl: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

// ─────────────────────────────────────────────
// B2B Registration
//

export interface B2BCreateComapnyPayload {
  company_name: string;
  vat_id: string;
  logo_url?: string;
  contact_email: string;

  address: {
    street: string;
    number: string;
    zip_code: string;
    city: string;
    country: string;
  };

  contact: {
    salutation: string;
    first_name: string;
    last_name: string;
    international_prefix: string;
    primary_phone_number: string;
  };
}

export interface B2BCreateResponse {
  b2b_id: string;
  contact_id: string;
  address_id: string;
  company_name: string;
  vat_id: string;
  logo_url?: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Workshop Registration
//

export interface WorkshopCreatePayload {
  workshop_name: string;
  contact_email: string;
  has_vat_id: boolean;
  vat_id: string;
  iban: string;
  bic: string;
  account_holder: string;
  packages_selected: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  address: {
    street: string;
    number: string;
    zip_code: string;
    city: string;
    country: string;
    longitude: number;
    latitude: number;
  };
  contact: {
    salutation: string;
    first_name: string;
    last_name: string;
    international_prefix: string;
    primary_phone_number: string;
    phone_numbers: {
      international_prefix: string;
      phone_number: string;
    }[];
  };
}

export interface WorkshopCreateResponse {
  workshop_id: string;
  contact_id: string;
  address_id: string;
  workshop_name: string;
  created_at: string;
  updated_at: string;
}
