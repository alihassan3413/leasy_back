<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Step1CustomerData from '@/components/registration/b2c/Step1CustomerData.vue'
import Step2VehicleData from '@/components/registration/b2c/Step2VehicleData.vue'
import Step3Appointment from '@/components/registration/b2c/Step3Appointment.vue'
import Step4PaymentMethod from '@/components/registration/b2c/Step4PaymentMethod.vue'
import Button from '@/components/ui/Button.vue'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'

const store = useB2CRegistrationStore()
const router = useRouter()

const showSuccess = ref(false)

function onNext() {
  store.nextStep()
}

function onBack() {
  store.prevStep()
}

async function onFinalSubmit() {
  store.status = 'loading'
  // TODO: wire up to real API when backend is ready
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
  <div class="flex min-h-screen w-full items-center justify-center bg-primary px-4 py-10">
    <Transition
      name="step"
      mode="out-in"
    >
      <Step1CustomerData
        v-if="store.currentStep === 1"
        key="step1"
        @next="onNext"
      />
      <Step2VehicleData
        v-else-if="store.currentStep === 2"
        key="step2"
        @next="onNext"
        @back="onBack"
      />
      <Step3Appointment
        v-else-if="store.currentStep === 3"
        key="step3"
        @next="onNext"
        @back="onBack"
      />
      <Step4PaymentMethod
        v-else-if="store.currentStep === 4"
        key="step4"
        @submit="onFinalSubmit"
        @back="onBack"
      />
    </Transition>
  </div>

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
          button-classes="rounded-[5px] px-8 py-2 text-sm font-bold bg-custom-green text-white"
          @click="onSuccessOk"
        >
          OK
        </Button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
