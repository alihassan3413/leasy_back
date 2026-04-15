import { ref } from 'vue'
import { defineStore } from 'pinia'

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
  zahlungsart: string
  iban: string
  kontoinhaber: string
}

export const useB2CRegistrationStore = defineStore('b2cRegistration', () => {
  const currentStep = ref(1)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const error = ref('')

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
    zahlungsart: '',
    iban: '',
    kontoinhaber: '',
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

  function reset() {
    currentStep.value = 1
    status.value = 'idle'
    error.value = ''
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
    paymentData.value = { zahlungsart: '', iban: '', kontoinhaber: '' }
  }

  return {
    currentStep,
    status,
    error,
    customerData,
    vehicleData,
    appointmentData,
    paymentData,
    nextStep,
    prevStep,
    goToStep,
    reset,
  }
})
