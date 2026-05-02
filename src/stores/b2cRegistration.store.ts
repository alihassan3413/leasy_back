import { ref } from 'vue'
import { defineStore } from 'pinia'
import { b2cApi } from '@/api'
import { normalizeApiError } from '@/api/client/error'
import type { B2CProfileCreatePayload } from '@/types'

export interface CustomerData {
  anrede: string
  vorname: string
  nachname: string
  email: string
  strasse: string
  hausnummer: string
  zusatz: string
  plz: string
  ort: string
  land: string
}

export interface VehicleData {
  marke: string
  modell: string
  fin: string
  erstzulassungsdatum: string
  leasingende: string
  kennzeichenCity: string
  kennzeichenLetters: string
  kennzeichenNumbers: string
}

export interface AppointmentData {
  stadt: string
  datum: string
  uhrzeit: string
}

export interface PaymentData {
  datum: string
  uhrzeit: string
}

function getDefaultCustomerData(): CustomerData {
  return {
    anrede: '',
    vorname: '',
    nachname: '',
    email: '',
    strasse: '',
    hausnummer: '',
    zusatz: '',
    plz: '',
    ort: '',
    land: 'Deutschland',
  }
}

function getDefaultVehicleData(): VehicleData {
  return {
    marke: '',
    modell: '',
    fin: '',
    erstzulassungsdatum: '',
    leasingende: '',
    kennzeichenCity: '',
    kennzeichenLetters: '',
    kennzeichenNumbers: '',
  }
}

function getDefaultAppointmentData(): AppointmentData {
  return {
    stadt: '',
    datum: '',
    uhrzeit: '',
  }
}

function getDefaultPaymentData(): PaymentData {
  return {
    datum: '',
    uhrzeit: '',
  }
}

export const useB2CRegistrationStore = defineStore('b2cRegistration', () => {
  const currentStep = ref(1)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref('')

  const addressId = ref<string | null>(null)
  const contactId = ref<string | null>(null)

  const customerData = ref<CustomerData>(getDefaultCustomerData())
  const vehicleData = ref<VehicleData>(getDefaultVehicleData())
  const appointmentData = ref<AppointmentData>(getDefaultAppointmentData())
  const paymentData = ref<PaymentData>(getDefaultPaymentData())

  function nextStep(): void {
    if (currentStep.value < 4) {
      currentStep.value += 1
    }
  }

  function prevStep(): void {
    if (currentStep.value > 1) {
      currentStep.value -= 1
    }
  }

  function goToStep(step: number): void {
    currentStep.value = step
  }

  async function submitProfile(): Promise<void> {
    if (addressId.value && contactId.value) {
      nextStep()
      return
    }

    status.value = 'loading'
    error.value = ''

    const payload: B2CProfileCreatePayload = {
      address: {
        street: customerData.value.strasse,
        number: customerData.value.hausnummer,
        additional_address: customerData.value.zusatz || undefined,
        zip_code: customerData.value.plz,
        city: customerData.value.ort,
        country: customerData.value.land,
      },
      contact: {
        salutation: customerData.value.anrede,
        first_name: customerData.value.vorname,
        last_name: customerData.value.nachname,
      },
      phones: [],
    }

    try {
      const response = await b2cApi.createProfile(payload)

      addressId.value = response.address_id
      contactId.value = response.contact_id
      status.value = 'success'

      nextStep()
    } catch (err) {
      const apiError = normalizeApiError(err)

      status.value = 'error'

      if (apiError.status === 401) {
        error.value = 'Sitzung abgelaufen. Bitte registrieren Sie sich erneut.'
      } else if (apiError.status === 422) {
        error.value = apiError.message || 'Bitte überprüfen Sie Ihre Eingaben.'
      } else if (apiError.status === 500) {
        error.value = 'Diese E-Mail-Adresse wurde bereits verwendet.'
      } else if (apiError.status === 0 || !apiError.status) {
        error.value = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      } else {
        error.value =
          apiError.message ||
          'Profil konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
      }
    }
  }

  function resetStatus(): void {
    status.value = 'idle'
    error.value = ''
  }

  function resetRegistrationData(): void {
    status.value = 'idle'
    error.value = ''
    addressId.value = null
    contactId.value = null
    customerData.value = getDefaultCustomerData()
    vehicleData.value = getDefaultVehicleData()
    appointmentData.value = getDefaultAppointmentData()
    paymentData.value = getDefaultPaymentData()
  }

  function reset(): void {
    currentStep.value = 1
    resetRegistrationData()
  }

  function resetProgress(): void {
    currentStep.value = 1
    status.value = 'idle'
    error.value = ''
  }

  return {
    currentStep,
    status,
    error,
    addressId,
    contactId,
    customerData,
    vehicleData,
    appointmentData,
    paymentData,
    nextStep,
    prevStep,
    goToStep,
    submitProfile,
    resetStatus,
    resetRegistrationData,
    reset,
    resetProgress,
  }
})