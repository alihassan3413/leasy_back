<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import B2CRegistrationLayout from '@/layouts/B2CRegistrationLayout.vue'
import Step1CustomerData from '@/components/registration/b2c/Step1CustomerData.vue'
import Step2VehicleData from '@/components/registration/b2c/Step2VehicleData.vue'
import Step3Appointment from '@/components/registration/b2c/Step3Appointment.vue'
import Step4PaymentMethod from '@/components/registration/b2c/Step4PaymentMethod.vue'
import Button from '@/components/ui/Button.vue'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'

const store = useB2CRegistrationStore()
const router = useRouter()

const showSuccess = ref(false)

const stepTitles = ['Kundendaten', 'Fahrzeugdaten', 'Terminvereinbarung', 'Zahlungsmethode hinzufügen']
const stepTitle = computed(() => stepTitles[store.currentStep - 1] ?? '')

// Step 1: calls POST /userprofile/address-contact (store handles API + nextStep internally)
async function onStep1Next() {
  await store.submitProfile()
}

// Steps 2–4: local only (API endpoints not yet defined in backend)
function onNext() {
  store.nextStep()
}

function onBack() {
  store.prevStep()
}

async function onFinalSubmit() {
  // TODO: wire up vehicle / appointment / payment API calls when backend is ready
  store.status = 'loading'
  await new Promise((r) => setTimeout(r, 800))
  store.status = 'success'
  showSuccess.value = true
}

function onSuccessOk() {
  showSuccess.value = false
  store.reset()
  void router.push('/auth/login')
}
</script>

<template>
  <B2CRegistrationLayout :title="stepTitle" :current-step="store.currentStep">
    <!-- API error banner (step 1 profile creation failure) -->
    <div
      v-if="store.error && store.status === 'error'"
      class="mb-4 rounded-[5px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ store.error }}
    </div>

    <Step1CustomerData
      v-if="store.currentStep === 1"
      :loading="store.status === 'loading'"
      @next="onStep1Next"
    />
    <Step2VehicleData
      v-if="store.currentStep === 2"
      @next="onNext"
      @back="onBack"
    />
    <Step3Appointment
      v-if="store.currentStep === 3"
      @next="onNext"
      @back="onBack"
    />
    <Step4PaymentMethod
      v-if="store.currentStep === 4"
      @submit="onFinalSubmit"
      @back="onBack"
    />
  </B2CRegistrationLayout>

  <!-- Success dialog -->
  <Teleport to="body">
    <div
      v-if="showSuccess"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="w-full max-w-sm rounded-[5px] bg-[#ECECEC] p-8 text-center">
        <div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-custom-green">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h3 class="mb-2 text-xl font-bold text-custom-black">Vielen Dank!</h3>

        <p class="mb-6 text-base text-custom-black">
          Ihre Registrierung war erfolgreich. Sie können sich jetzt anmelden.
        </p>

        <Button
          button-classes="rounded-[5px] px-8 py-2 text-sm font-bold !bg-custom-green text-white"
          @click="onSuccessOk"
        >
          OK
        </Button>
      </div>
    </div>
  </Teleport>
</template>
