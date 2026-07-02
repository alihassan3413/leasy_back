<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import type { AdminOrder } from "@/types";
import { adminOrdersApi } from "@/api/modules/admin-orders.api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { orderStatusOptions, orderStatusLabels } from "@/lib/status";

const props = defineProps<{
  open: boolean;
  order: AdminOrder | null;
  statusOptions?: { value: string; label: string }[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  orderStatusUpdated: [];
}>();

const activeStatusOptions = computed(() => props.statusOptions ?? orderStatusOptions);

const isLoading = ref(false);
const newStatus = ref("");
const statusOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function getStatus(s: string | null | undefined) {
  return { label: orderStatusLabels[s ?? ""] ?? s ?? "—" };
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    statusOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(
  () => props.open,
  (opened) => {
    if (!opened) {
      newStatus.value = "";
      statusOpen.value = false;
    } else if (props.order) {
      // Only prefill when the current status is itself a selectable option;
      // legacy/non-settable values (e.g. order_placed, completed) stay empty so
      // the admin must choose a valid status instead of re-sending an invalid one.
      const current = props.order.order_status;
      newStatus.value = activeStatusOptions.value.some((o) => o.value === current) ? current : "";
    }
  },
);

const isFormValid = computed(() => {
  return newStatus.value.trim() !== "";
});

const buttonActive = computed(() => {
  return isFormValid.value;
});

function close() {
  emit("update:open", false);
}

async function handleSubmit() {
  if (!props.order || !isFormValid.value) return;

  try {
    isLoading.value = true;
    await adminOrdersApi.updateOrderStatus(
      props.order.leasyback_partner,
      props.order.auftragsnummer,
      newStatus.value,
    );
    emit("orderStatusUpdated");
    close();
  } catch (error) {
    console.error("Error updating order status:", error);
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
            <h2 class="text-[24px] font-bold leading-normal text-black">Auftragsstatus ändern</h2>
            <p class="mt-1 pb-4 text-base font-light leading-normal not-italic text-[#00000080]">
              Ändern Sie den Status des ausgewählten Auftrags.
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

            <!-- Status dropdown -->
            <div ref="dropdownRef" class="relative flex flex-col gap-1">
              <label class="text-sm font-semibold text-black"> Neuer Status </label>
              <div
                class="flex h-10 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus:border-emerald-500"
                tabindex="0"
                @click="statusOpen = !statusOpen"
              >
                <span class="text-sm" :class="newStatus ? 'text-gray-800' : 'text-gray-400'">
                  {{
                    activeStatusOptions.find((s) => s.value === newStatus)?.label || "Status wählen"
                  }}
                </span>
                <Icon
                  icon="mdi:chevron-down"
                  class="text-gray-500 text-[24px] transition-transform duration-200"
                  :class="statusOpen ? 'rotate-180' : 'rotate-0'"
                />
              </div>
              <div
                v-if="statusOpen"
                class="absolute top-full z-[100] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
              >
                <div
                  v-for="status in activeStatusOptions"
                  :key="status.value"
                  class="flex h-9 cursor-pointer items-center px-4 text-sm text-gray-700 hover:bg-gray-50"
                  @click="
                    newStatus = status.value;
                    statusOpen = false;
                  "
                >
                  {{ status.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-center">
            <button
              class="h-10 px-6 rounded-full text-base font-semibold text-white transition-all duration-200 shadow-lg"
              :style="buttonActive ? 'background: #EF8450;' : 'background: #D9D9D9;'"
              :disabled="!buttonActive || isLoading"
              @click="handleSubmit"
            >
              {{ isLoading ? "Wird gespeichert..." : "Bestätigen" }}
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
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 0%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 0.5px))
      calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}
</style>
