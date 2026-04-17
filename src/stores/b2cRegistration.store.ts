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

export const useB2CRegistrationStore = defineStore('b2cRegistration', () => {
  const currentStep = ref(1)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref('')

  // IDs returned by the API after profile creation
  const addressId = ref<string | null>(null)
  const contactId = ref<string | null>(null)

  const customerData = ref<CustomerData>({
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
  })

  const vehicleData = ref<VehicleData>({
    marke: '',
    modell: '',
    fin: '',
    erstzulassungsdatum: '',
    leasingende: '',
    kennzeichenCity: '',
    kennzeichenLetters: '',
    kennzeichenNumbers: '',
  })

  const appointmentData = ref<AppointmentData>({
    stadt: '',
    datum: '',
    uhrzeit: '',
  })

  const paymentData = ref<PaymentData>({
    datum: '',
    uhrzeit: '',
  })

  function nextStep() {
    if (currentStep.value < 4) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--
  }

  function goToStep(step: number) {
    currentStep.value = step
  }

  // POST /userprofile/address-contact — requires JWT (set after auto-login in RegisterView)
  async function submitProfile(): Promise<void> {
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
      } else if (apiError.status === 0 || !apiError.status) {
        error.value = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      } else {
        error.value = apiError.message || 'Profil konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
      }
    }
  }

  function reset() {
    currentStep.value = 1
    status.value = 'idle'
    error.value = ''
    addressId.value = null
    contactId.value = null
    customerData.value = {
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
    vehicleData.value = {
      marke: '',
      modell: '',
      fin: '',
      erstzulassungsdatum: '',
      leasingende: '',
      kennzeichenCity: '',
      kennzeichenLetters: '',
      kennzeichenNumbers: '',
    }
    appointmentData.value = { stadt: '', datum: '', uhrzeit: '' }
    paymentData.value = { datum: '', uhrzeit: '' }
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
    reset,
  }
})
