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
  <div class="w-full bg-white rounded-[5px] p-5">
    <h2 class="text-xl font-bold text-color-primary mb-8">Einstellungen</h2>

    <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-12 gap-y-6">
      <!-- Left: Action Buttons -->
      <div class="flex flex-col gap-4">
        <Button
          variant="primary"
          class="w-full max-w-57.5 rounded-[5px] font-bold py-2.5"
          @click="handlePaymentMethodChange"
        >
          Zahlungsmethode ändern
        </Button>
        <Button
          variant="primary"
          class="w-full max-w-57.5 rounded-[5px] font-bold py-2.5"
          @click="handleBillingAddressChange"
        >
          Rechnungsadresse ändern
        </Button>
      </div>

      <!-- Right: Current Info -->
      <div class="space-y-6 pt-2">
        <div class="flex items-start">
          <span class="w-72 shrink-0 font-bold text-custom-black"
            >Aktuelle Kontodaten</span
          >
          <span class="text-custom-black opacity-70">XXXX XXXX XXXX 1234</span>
        </div>
        <div class="flex items-start">
          <span class="w-72 shrink-0 font-bold text-custom-black"
            >Aktuelle Rechnungsadresse</span
          >
          <span class="text-custom-black opacity-70 leading-tight">
            HWT GmbH, Theodorstraße 9, XXX
          </span>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ChangePayment
      v-model:open="showChangePaymentModal"
      @submit="handlePaymentSubmit"
    />
    <ChangeBillingAdress
      v-model:open="showChangeBillingModal"
      @submit="handleBillingSubmit"
    />
  </div>
</template>
