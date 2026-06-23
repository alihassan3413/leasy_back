<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import B2CRegistrationLayout from "@/layouts/B2CRegistrationLayout.vue";
import Step1CustomerData from "@/components/registration/b2c/Step1CustomerData.vue";
import Step2VehicleData from "@/components/registration/b2c/Step2VehicleData.vue";
import Step3Appointment from "@/components/registration/b2c/Step3Appointment.vue";
import Step4PaymentMethod from "@/components/registration/b2c/Step4PaymentMethod.vue";
import AppModal from "@/components/ui/AppModal.vue";

import { useB2CRegistrationStore } from "@/stores/b2cRegistration.store";

const store = useB2CRegistrationStore();
const router = useRouter();

const showSuccess = ref(false);

const stepTitles = ["Kundendaten", "Fahrzeugdaten", "Terminvereinbarung"];

const stepTitle = computed(() => stepTitles[store.currentStep - 1] ?? "");

async function onStep1Next(): Promise<void> {
  await store.submitProfile();
}

function onNext(): void {
  // If we're on step 3 and next is called, show success modal instead of going to step 4
  if (store.currentStep === 3) {
    store.status = "success";
    showSuccess.value = true;
  } else {
    store.nextStep();
  }
}

function onBack(): void {
  store.prevStep();
}

async function onSuccessOk(): Promise<void> {
  showSuccess.value = false;

  await router.push({ name: "dashboard-b2c" });

  store.reset();
}
</script>

<template>
  <B2CRegistrationLayout :title="stepTitle" :current-step="store.currentStep">
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

    <!-- Step4PaymentMethod is hidden for now -->
    <!-- <Step4PaymentMethod
      v-if="store.currentStep === 4"
      @submit="onFinalSubmit"
      @back="onBack"
    /> -->
  </B2CRegistrationLayout>

  <AppModal
    :open="showSuccess"
    title="Vielen Dank!"
    message="Ihre Registrierung war erfolgreich. Sie werden zum Dashboard weitergeleitet."
    icon="material-symbols:check-circle-outline"
    confirm-text="OK"
    @confirm="onSuccessOk"
    @close="onSuccessOk"
  />
</template>
