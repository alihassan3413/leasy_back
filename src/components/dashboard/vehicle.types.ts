export interface TimelineEntry {
  datetime: string
  label: string
  sublabel?: string
}

export interface Offer {
  id: string
  name: string
  cost: number
  saving: number
  address?: string
  distance?: string
  recommended?: boolean
  accepted?: boolean
}

export interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  leaseEnd: string
  returnStart: string
  driver: string
  driverFirstName: string
  driverLastName: string
  driverPhone: string
  usageAddress: string
  lastActivity: string
  fin: string
  kilometerstand: string
  leasinggeber: string
  leasingAbgabetermin: string
  status: string
  workshopName: string
  leasingDocuments: string[]
  returnDocuments: string[]
  offers: Offer[]
  timeline: TimelineEntry[]
  notifications?: number
  completed?: boolean
}
