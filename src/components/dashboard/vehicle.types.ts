export interface TimelineEntry {
  datetime: string;
  label: string;
  sublabel?: string;
}

export interface Offer {
  id: string;
  name: string;
  cost: number;
  saving: number;
  address?: string;
  distance?: string;
  recommended?: boolean;
  accepted?: boolean;
}

export interface OrderStatusUpdate {
  // Define properties based on API response if needed
}

export interface OrderConfirmation {
  // Define properties based on API response if needed
}

export interface Ansprechpartner {
  email: string;
  name: string;
  telefon: string;
}

export interface Auftrag {
  auftragsnummer: string;
  bemerkung: string;
  fin: string;
  hersteller: string;
  kennzeichen: string;
  modell: string;
  produktkey: string;
  vertragsnummer: string;
}

export interface Benachrichtigung {
  gutachten: any[];
  terminbestätigung: any[];
}

export interface Besichtigungsort {
  land: string;
  name: string;
  ort: string;
  plz: string;
  strasse: string;
  termin: string;
}

export interface RequestPayload {
  ansprechpartner: Ansprechpartner;
  auftrag: Auftrag;
  benachrichtigung: Benachrichtigung;
  besichtigungsort: Besichtigungsort;
}

export interface Order {
  auftragsnummer: string;
  created_at: string;
  created_by_user_id: string;
  id: string;
  leasyback_partner: string;
  order_confirmations: OrderConfirmation[];
  order_status: string;
  request_payload: RequestPayload;
  response_body: number;
  response_status: number;
  sent_at: string;
  status_updates: OrderStatusUpdate[];
}

export interface Vehicle {
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
  orders: Order[];
  // Keep existing properties for backwards compatibility
  id?: string;
  licensePlate?: string;
  brand?: string;
  leaseEnd?: string;
  returnStart?: string;
  driver?: string;
  driverFirstName?: string;
  driverLastName?: string;
  driverPhone?: string;
  usageAddress?: string;
  lastActivity?: string;
  fin?: string;
  kilometerstand?: string;
  leasinggeber?: string;
  leasingAbgabetermin?: string;
  status?: string;
  workshopName?: string;
  leasingDocuments?: string[];
  returnDocuments?: string[];
  offers?: Offer[];
  timeline?: TimelineEntry[];
  notifications?: number;
  completed?: boolean;
}
