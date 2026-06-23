<script setup lang="ts">
import { ref } from "vue";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Icon } from "@iconify/vue";
import Button from "@/components/ui/Button.vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [method: string];
}>();

const currentStep = ref(1); // 1: Selection List, 2: Card Form
const selectedMethod = ref("");
const cardForm = ref({
  number: "",
  expiry: "",
  cvv: "",
  country: "Deutschland",
});

const paymentMethods = [
  {
    id: "kreditkarte",
    label: "Kreditkarte /Debitkarte",
    subtext: "Keine suzätzliche Kosten",
    icon: "ph:credit-card",
  },
  {
    id: "paypal",
    label: "Paypal",
    subtext: "Keine suzätzliche Kosten",
    icon: "logos:paypal",
  },
  {
    id: "mastercard",
    label: "Mastercard",
    subtext: "Keine suzätzliche Kosten",
    icon: "logos:mastercard",
  },
  {
    id: "visa",
    label: "Visa Karte",
    subtext: "Keine suzätzliche Kosten",
    icon: "logos:visa",
  },
];

function close() {
  emit("update:open", false);
  // Reset state when closing
  setTimeout(() => {
    currentStep.value = 1;
    selectedMethod.value = "";
  }, 300);
}

function handleSelect(id: string) {
  selectedMethod.value = id;
  if (id === "kreditkarte") {
    // Go to card form step
    currentStep.value = 2;
  }
}

function handleSave() {
  const data =
    selectedMethod.value === "kreditkarte"
      ? { method: selectedMethod.value, ...cardForm.value }
      : { method: selectedMethod.value };
  emit("submit", data as any);
  close();
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-hidden"
      style="
        width: 540px;
        max-width: 95vw;
        border-radius: 8px;
        border: 1px solid #ececec;
      "
      :show-close-button="false"
    >
      <div class="bg-white p-8">
        <h2 class="text-[24px] font-bold text-color-primary mb-8">
          Zahlungsart auswählen
        </h2>

        <!-- Step 1: Selection List -->
        <div
          v-if="currentStep === 1"
          class="flex flex-col border-t border-[#F3F4F6]"
        >
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="flex items-center justify-between py-4 border-b border-[#F3F4F6] cursor-pointer hover:bg-gray-50/50 transition-colors"
            @click="handleSelect(method.id)"
          >
            <div class="flex items-center gap-6">
              <div class="w-12 flex justify-center">
                <Icon
                  v-if="method.id === 'kreditkarte'"
                  :icon="method.icon"
                  class="text-3xl text-custom-black"
                />
                <Icon v-else :icon="method.icon" class="text-3xl" />
              </div>
              <div class="flex flex-col">
                <span class="text-[17px] font-medium text-custom-black">{{
                  method.label
                }}</span>
                <span class="text-[13px] text-custom-black opacity-60">{{
                  method.subtext
                }}</span>
              </div>
            </div>

            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              :class="
                selectedMethod === method.id
                  ? 'border-custom-orange'
                  : 'border-[#D1D5DB]'
              "
            >
              <div
                v-if="selectedMethod === method.id"
                class="w-2.5 h-2.5 rounded-full bg-custom-orange"
              ></div>
            </div>
          </div>
        </div>

        <!-- Step 2: Card Form -->
        <div v-else-if="currentStep === 2" class="space-y-6">
          <!-- Show Selected Method Header -->
          <div
            class="flex items-center justify-between py-4 border-b border-[#F3F4F6]"
          >
            <div class="flex items-center gap-6">
              <div class="w-12 flex justify-center">
                <Icon
                  icon="ph:credit-card"
                  class="text-3xl text-custom-black"
                />
              </div>
              <div class="flex flex-col">
                <span class="text-[17px] font-medium text-custom-black"
                  >Kreditkarte /Debitkarte</span
                >
                <span class="text-[13px] text-custom-black opacity-60"
                  >Keine suzätzliche Kosten</span
                >
              </div>
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 border-custom-orange flex items-center justify-center"
            >
              <div class="w-2.5 h-2.5 rounded-full bg-custom-orange"></div>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="space-y-4 pt-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[15px] text-custom-black">Kartennummer</label>
              <div class="relative">
                <input
                  v-model="cardForm.number"
                  type="text"
                  placeholder="1234 1234 1234 1234"
                  class="w-full h-10 px-3 pr-24 rounded-[5px] border border-[#B7C2C2] bg-[#F9FAFA] outline-none focus:border-custom-green transition-colors"
                />
                <div
                  class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"
                >
                  <Icon
                    icon="ph:credit-card"
                    class="text-xl text-custom-black"
                  />
                  <Icon icon="logos:mastercard" class="text-xl" />
                  <Icon icon="logos:visa" class="text-xl" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="flex flex-col gap-1.5">
                <label class="text-[15px] text-custom-black">Ablaufdatum</label>
                <input
                  v-model="cardForm.expiry"
                  type="text"
                  placeholder="12 / 2030"
                  class="w-full h-10 px-3 rounded-[5px] border border-[#B7C2C2] bg-[#F9FAFA] outline-none focus:border-custom-green transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[15px] text-custom-black"
                  >Sicherheitscode / CVV</label
                >
                <div class="relative">
                  <input
                    v-model="cardForm.cvv"
                    type="text"
                    placeholder="123"
                    class="w-full h-10 px-3 rounded-[5px] border border-[#B7C2C2] bg-[#F9FAFA] outline-none focus:border-custom-green transition-colors"
                  />
                  <Icon
                    icon="ph:credit-card"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-custom-black opacity-30"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[15px] text-custom-black">Land</label>
              <div class="relative">
                <select
                  v-model="cardForm.country"
                  class="w-full h-10 px-3 rounded-[5px] border border-[#B7C2C2] bg-[#F9FAFA] outline-none appearance-none focus:border-custom-green transition-colors cursor-pointer"
                >
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Schweiz">Schweiz</option>
                </select>
                <Icon
                  icon="ph:caret-down-bold"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-custom-black pointer-events-none"
                />
              </div>
            </div>
          </div>

          <!-- Rest of the methods (hidden/disabled style as per design) -->
          <div
            class="flex flex-col border-t border-[#F3F4F6] opacity-50 pointer-events-none"
          >
            <div
              v-for="method in paymentMethods.slice(1)"
              :key="method.id"
              class="flex items-center justify-between py-4 border-b border-[#F3F4F6]"
            >
              <div class="flex items-center gap-6">
                <div class="w-12 flex justify-center">
                  <Icon :icon="method.icon" class="text-3xl" />
                </div>
                <div class="flex flex-col">
                  <span class="text-[17px] font-medium text-custom-black">{{
                    method.label
                  }}</span>
                  <span class="text-[13px] text-custom-black opacity-60">{{
                    method.subtext
                  }}</span>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 border-[#D1D5DB]"></div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end mt-10">
          <Button
            v-if="currentStep === 2"
            variant="primary"
            class="w-[220px] h-11 rounded-[8px] font-bold bg-custom-orange hover:bg-[#e67e45]"
            @click="handleSave"
          >
            Bestätigen
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
