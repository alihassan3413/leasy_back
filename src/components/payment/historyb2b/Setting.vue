<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/ui/Button.vue";
import ChangePayment from "./modals/ChangePayment.vue";
import ChangeBillingAdress from "./modals/ChangeBillingAdress.vue";

const showChangePaymentModal = ref(false);
const showChangeBillingModal = ref(false);

const handlePaymentMethodChange = () => {
  showChangePaymentModal.value = true;
};

const handleBillingAddressChange = () => {
  showChangeBillingModal.value = true;
};

const handlePaymentSubmit = (data: { iban: string; kontoinhaber: string }) => {
  console.log("New payment data:", data);
  // Handle the submission logic here
};

const handleBillingSubmit = (data: any) => {
  console.log("New billing data:", data);
  // Handle the submission logic here
};
</script>

<template>
  <div class="w-full bg-white rounded-[5px] p-4 md:p-5">
    <h2 class="text-lg md:text-xl font-bold text-color-primary mb-6 md:mb-8">Einstellungen</h2>

    <div class="grid grid-cols-1 gap-y-4 md:grid-cols-[1fr_2fr] gap-x-12 gap-y-6">
      <!-- Left: Action Buttons -->
      <div class="flex flex-col gap-3 md:gap-4">
        <Button
          variant="primary"
          class="w-full max-w-full md:max-w-57.5 rounded-[5px] font-bold py-2.5"
          @click="handlePaymentMethodChange"
        >
          Zahlungsmethode ändern
        </Button>
        <Button
          variant="primary"
          class="w-full max-w-full md:max-w-57.5 rounded-[5px] font-bold py-2.5"
          @click="handleBillingAddressChange"
        >
          Rechnungsadresse ändern
        </Button>
      </div>

      <!-- Right: Current Info -->
      <div class="space-y-4 md:space-y-6 pt-0 md:pt-2">
        <div class="flex flex-col md:flex-row md:items-start gap-1 md:gap-0">
          <span class="text-sm md:text-base font-bold text-custom-black">Aktuelle Kontodaten</span>
          <span class="text-sm md:text-base text-custom-black opacity-70">XXXX XXXX XXXX 1234</span>
        </div>
        <div class="flex flex-col md:flex-row md:items-start gap-1 md:gap-0">
          <span class="text-sm md:text-base font-bold text-custom-black"
            >Aktuelle Rechnungsadresse</span
          >
          <span class="text-sm md:text-base text-custom-black opacity-70 leading-tight">
            HWT GmbH, Theodorstraße 9, XXX
          </span>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ChangePayment v-model:open="showChangePaymentModal" @submit="handlePaymentSubmit" />
    <ChangeBillingAdress v-model:open="showChangeBillingModal" @submit="handleBillingSubmit" />
  </div>
</template>
