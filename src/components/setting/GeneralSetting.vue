<script setup lang="ts">
import { ref } from "vue";
import FormSelectDropDown from "@/components/form/SelectDropDown.vue";
import Switch from "@/components/ui/switch/Switch.vue";
import Button from "@/components/ui/button/Button.vue";

const timezoneOptions = [
  {
    label: "UTC + 01:00) Amsterdam, Berlin, Bern, Rom, Stockholm, Wien",
    value: "UTC+1",
  },
  { label: "UTC + 00:00) London, Lisbon, Dublin", value: "UTC+0" },
];

const languageOptions = [
  { label: "Deutsch", value: "de" },
  { label: "English", value: "en" },
];

const selectedTimezone = ref("UTC+1");
const selectedLanguage = ref("de");
const pushNotifications = ref(true);
const emailNotifications = ref(false);

const handleTimezoneChange = () => {
  console.log("Timezone change requested");
};
</script>

<template>
  <div class="w-full bg-white rounded-[10px] border border-[#D9E2E2] p-4 md:p-8">
    <h2 class="text-lg md:text-xl font-bold text-color-primary mb-4 md:mb-6">
      Allgemeine Einstellungen
    </h2>

    <div class="space-y-4 md:space-y-6">
      <!-- Timezone Section -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-end gap-3 md:gap-4">
        <div class="flex-1 w-full md:max-w-137.5">
          <FormSelectDropDown
            v-model="selectedTimezone"
            label="Zeitzone"
            :options="timezoneOptions"
            width="w-full"
          />
        </div>
        <Button
          @click="handleTimezoneChange"
          class="w-full md:w-auto bg-custom-green hover:bg-[#019d7a] text-white font-bold h-9 px-4 md:px-23 rounded-[5px]"
        >
          Zeitzone ändern
        </Button>
      </div>

      <!-- Language Section -->
      <div class="w-full md:max-w-137.5">
        <FormSelectDropDown
          v-model="selectedLanguage"
          label="Sprache"
          :options="languageOptions"
          width="w-full"
        />
      </div>

      <!-- Notification Settings -->
      <div class="pt-3 md:pt-4">
        <h3 class="text-sm md:text-base font-normal text-[#5C6F6F] mb-3 md:mb-4">
          Benachrichtigungseinstellungen
        </h3>

        <div class="space-y-3 md:space-y-4 w-full md:max-w-137.5">
          <Switch v-model="pushNotifications" label="Push" />
          <Switch v-model="emailNotifications" label="E-mail" />
        </div>
      </div>
    </div>
  </div>
</template>
