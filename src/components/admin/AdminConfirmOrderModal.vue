<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import type { AdminOrder } from "@/types";
import { adminOrdersApi } from "@/api/modules/admin-orders.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "vue3-toastify";
import { orderStatusLabels } from "@/lib/status";

const props = defineProps<{
  open: boolean;
  order: AdminOrder | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  orderConfirmed: [];
}>();

const isLoading = ref(false);

function getStatus(s: string | null | undefined) {
  return { label: orderStatusLabels[s ?? ""] ?? s ?? "—" };
}

function close() {
  emit("update:open", false);
}

async function handleSubmit() {
  if (!props.order) return;

  try {
    isLoading.value = true;
    await adminOrdersApi.confirmOrder(props.order.auftragsnummer);
    toast.success("Auftrag erfolgreich bestätigt!");
    emit("orderConfirmed");
    close();
  } catch (error) {
    console.error("Error confirming order:", error);
    toast.error("Auftrag konnte nicht bestätigt werden!");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 620px; max-width: calc(100vw - 2rem)"
      :show-close-button="false"
    >
      <div class="relative">
        <button
          @click="close"
          class="absolute -right-1 -top-1 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600"
        >
          <Icon icon="mdi:close" class="size-8" />
        </button>

        <div
          class="bg-white border border-[#C6C6CD] p-6 inverted-corner inverted-corner-top-right overflow-y-auto"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-2 pt-2 mb-2">
            <h2 class="text-[24px] font-bold leading-normal text-black">Auftrag bestätigen</h2>
            <p class="mt-1 pb-4 text-base font-light leading-normal not-italic text-[#00000080]">
              Möchten Sie den ausgewählten Auftrag wirklich bestätigen?
            </p>
          </div>

          <div class="grid grid-cols-1 gap-y-4">
            <!-- Order info -->
            <div v-if="order" class="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Auftragsnummer</span>
                <span class="text-sm font-semibold text-gray-800">{{ order.auftragsnummer }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Kennzeichen</span>
                <span class="text-sm font-semibold text-gray-800">{{ order.license_plate }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Aktueller Status</span>
                <span class="text-sm font-semibold text-gray-800">{{
                  getStatus(order.order_status).label
                }}</span>
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-center">
            <button
              class="h-10 px-6 rounded-full text-base font-semibold text-white transition-all duration-200 shadow-lg"
              style="background: #ef8450"
              :disabled="isLoading"
              @click="handleSubmit"
            >
              {{ isLoading ? "Wird bestätigt..." : "Bestätigen" }}
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.inverted-corner {
  --r: 38px;
  --s: 32px;
  --x: 0px;
  --y: 0px;
  border-radius: var(--r);
}

.inverted-corner-top-right {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}
</style>
