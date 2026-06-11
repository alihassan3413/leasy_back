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
  profileCompleted?: boolean;
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
  | "Werkstatt"
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

export interface AdminSummaryResponse {
  total_b2c_customers: number;
  total_b2b_customers: number;
  total_vehicles: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  pending_inspections: number;
}

export type AdminUserType = "B2C" | "B2B";

export interface AdminUser {
  user_id: string;
  user_email: string;
  user_type: string;
  is_active: boolean;
  profile_id: number;
  image_url: string | null;
  contact_id: string;
  salutation: string;
  first_name: string;
  last_name: string;
  address_id: string;
  street: string;
  number: string;
  additional_address: string;
  zip_code: string;
  city: string;
  country: string;
  created_at: string;
}

export interface AdminUserListResponse {
  page: number;
  limit: number;
  total: number;
  total_active: number;
  total_inactive: number;
  data: AdminUser[];
}

export interface AdminVehicleHistoryItem {
  auftragsnummer: string;
  confirmation_date: string | null;
  created_at: string;
  id: string;
  leasyback_partner: string;
  order_status: string;
  response_status: number;
  sent_at: string;
}

export interface AdminVehicle {
  vehicle_id: string;
  license_plate: string;
  first_registration_date: string;
  leasing_end_date: string;
  vin: string;
  make: string;
  model: string;
  vehicle_belongs: "B2B" | "B2C";
  b2b_id: string | null;
  b2c_user_id: string | null;
  assigned_profile_id: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string;
  user_type: string;
  company_name: string | null;
  current_order_id: string | null;
  current_auftragsnummer: string | null;
  current_order_status: string | null;
  current_order_created_at: string | null;
  order_history: AdminVehicleHistoryItem[];
  documents: unknown[];
}

export interface AdminVehicleListResponse {
  page: number;
  limit: number;
  total: number;
  total_active: number;
  total_completed: number;
  total_confirmed: number;
  total_inspected: number;
  total_delivered: number;
  data: AdminVehicle[];
}

export interface AdminOrder {
  id: string;
  vehicle_id: string;
  auftragsnummer: string;
  leasyback_partner: string;
  order_status: string;
  sent_at: string;
  created_at: string;
  response_status: number;
  license_plate: string;
  vin: string;
  make: string;
  model: string;
  user_id: string;
  user_email: string;
  user_type: string;
  b2b_id: string | null;
  company_name: string | null;
  confirmation_date: string | null;
}

export interface AdminOrderListResponse {
  page: number;
  limit: number;
  total: number;
  total_active: number;
  total_completed: number;
  total_confirmed: number;
  total_inspected: number;
  total_delivered: number;
  data: AdminOrder[];
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

export interface VehicleStatusResponse {
  vehicle_id: string;
  license_plate: string;
  first_registration_date: string;
  leasing_end_date: string;
  vin: string;
  make: string;
  model: string;
  vehicle_belongs: string;
  created_at: string;
  updated_at: string;
  orders: Array<{
    id: string;
    auftragsnummer: string;
    created_at: string;
    created_by_user_id: string;
    leasyback_partner: string;
    order_confirmations: unknown[];
    order_status: string;
    request_payload: {
      auftrag?: {
        auftragsnummer: string;
        bemerkung: string;
        fin: string;
        hersteller: string;
        kennzeichen: string;
        modell: string;
        produktkey: string;
        vertragsnummer: string;
      };
      besichtigungsort?: {
        name: string;
        strasse: string;
        plz: string;
        ort: string;
        termin: string;
        land: string;
      };
      ansprechpartner?: {
        name: string;
        email: string;
        telefon: string;
      };
      benachrichtigung?: {
        gutachten?: unknown[];
        terminbestätigung?: unknown[];
      };
    };
    response_body?: number;
    response_status?: number;
    sent_at?: string;
    status_updates: Array<{
      id: string;
      created_at: string;
      bewertung_id?: string;
    }>;
  }>;
}

export interface CreateVehiclePayload {
  license_plate: string;
  first_registration_date: string;
  leasing_end_date: string;
  vin: string;
  make: string;
  model: string;
}

export interface VehicleDocument {
  id: string;
  document_type: string;
  file_name?: string;
  created_at?: string;
  url?: string;
}

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
  street: string;
  number: string;
  additional_address?: string;
  zip_code: string;
  city: string;
  country: string;
  longitude?: number;
  latitude?: number;
}

export interface B2CProfileContact {
  salutation: string;
  first_name: string;
  last_name: string;
}

export interface B2CPhone {
  international_prefix: string;
  phone_number: string;
}

export interface B2CProfileCreatePayload {
  address: B2CProfileAddress;
  contact: B2CProfileContact;
  phones: B2CPhone[];
}

export interface B2CProfileCreateResponse {
  address_id: string;
  contact_id: string;
  status: "created";
}

export interface B2CProfileUpdatePayload extends B2CProfileCreatePayload {
  address_id: string;
  contact_id: string;
}

export interface B2CProfileUpdateResponse {
  address_id: string;
  contact_id: string;
  status: "updated";
}

export interface B2CUserProfileResponse {
  user_id: string;
  email: string;
  is_admin: boolean;
  address: B2CProfileAddress & { address_id: string };
  contact: B2CProfileContact & { contact_id: string };
  phones: B2CPhone[];
  preferences: {
    preference_id: string;
    timezone: string;
    sprache: string;
    benachrichtigungseinstellungen_push: boolean;
    benachrichtigungseinstellungen_email: boolean;
  };
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

export interface B2BLogoUploadResponse {
  key: string;
  content_type: string;
  object_url: string;
  signed_url: string;
  expires_in_seconds: number;
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

export interface B2BPhoneNumber {
  international_prefix: string;
  phone_number: string;
  is_primary_contact: boolean;
}

export interface B2BProfile {
  b2b: string;
  company_name: string;
  logo_url: string | null;
  contact_email: string;
  vat_id: string | null;
  created_at: string;
  updated_at: string;
  contact: {
    contact_id: string;
    salutation: string;
    first_name: string;
    last_name: string;
    phone_numbers: B2BPhoneNumber[];
  };
  address: {
    address_id: string;
    street: string;
    number: string;
    additional_address: string | null;
    zip_code: string;
    city: string;
    country: string;
  };
}

export interface B2BProfileUpdatePayload {
  company_name: string;
  vat_id: string;
  logo_url?: string | null;
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
    phone_numbers?: B2BPhoneNumber[];
  };
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

export interface PhoneNumber {
  international_prefix: string;
  phone_number: string;
  is_primary_contact: boolean;
}

export interface WorkshopContact {
  contact_id: string;
  salutation: string;
  first_name: string;
  last_name: string;
  phone_numbers: PhoneNumber[];
}

export interface WorkshopAddress {
  address_id: string;
  street: string;
  number: string;
  additional_address: string | null;
  zip_code: string;
  city: string;
  country: string;
}

export interface WorkshopResponse {
  workshop_id: string;
  workshop_name: string;
  logo_url: string | null;
  contact_email: string;
  has_vat_id: boolean;
  vat_id: string | null;
  packages_selected: string;
  imprint_text: string | null;
  services_offered: string[] | null;
  created_at: string;
  updated_at: string;
  contact: WorkshopContact;
  address: WorkshopAddress;
}

export interface WorkshopUpdatePayload {
  workshop_name?: string;
  logo_url?: string | null;
  contact_email?: string;
  has_vat_id?: boolean;
  vat_id?: string | null;
  address?: Partial<WorkshopAddress>;
  contact?: {
    salutation?: string;
    first_name?: string;
    last_name?: string;
    phone_numbers?: {
      international_prefix: string;
      phone_number: string;
      is_primary_contact?: boolean;
    }[];
  };
}

// ─────────────────────────────────────────────
// ORDER CREATION
// ─────────────────────────────────────────────

export interface Station {
  station_id: string;
  provider: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  bundesland: string;
  land: string;
}

export interface CreateOrderPayload {
  remarks: string;
  station_id: string;
  termin: string;
}

export interface CreateOrderResponse {
  [key: string]: unknown;
}
