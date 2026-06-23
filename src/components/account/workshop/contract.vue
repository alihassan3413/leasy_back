<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useWorkshopStore } from "@/stores/workshop.store";

const workshopStore = useWorkshopStore();

const features = [
  "Planbare Aufträge",
  "Kein Kundenkontakt nötig",
  "Faire Preisgestaltung",
  "Geringer Verwaltungsaufwand",
];
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">
        Ihr abgeschlossener Vertrag
      </h2>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Left Column: Current Status & Features -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-color-primary">
          {{ workshopStore.profile?.packages_selected || "Partner" }}
        </h3>
        <ul class="space-y-3">
          <li
            v-for="feature in features"
            :key="feature"
            class="flex items-center gap-3"
          >
            <div
              class="flex size-5 items-center justify-center rounded-[3px] bg-custom-green"
            >
              <Icon icon="mdi:check" class="size-3.5 text-white" />
            </div>
            <span class="text-[15px] font-medium text-color-primary">{{
              feature
            }}</span>
          </li>
        </ul>
      </div>

      <!-- Right Column: Upgrade Section -->
      <div class="flex flex-col justify-between items-end">
        <div class="space-y-4">
          <h3 class="text-xl font-bold text-color-primary">
            Vertrag aktualisieren
          </h3>
          <p class="text-[15px] text-color-primary">
            Möchten Sie auf Premium aktualisieren?
          </p>
          <button
            type="button"
            class="mt-2 w-full rounded-[5px] bg-[#EF8450] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 w-auto"
          >
            Jetzt auf Premium Partner upgraden
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
