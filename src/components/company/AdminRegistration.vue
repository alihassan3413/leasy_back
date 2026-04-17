<script setup lang="ts">
import FormTextField from '@/components/ui/form/FormTextField.vue'
import FormSelectField from '../ui/form/FormSelectField.vue';

const anredeOptions = [
  { label: "Herr", value: "herr" },
  { label: "Frau", value: "frau" },
  { label: "Divers", value: "divers" },
];

const vorwahlOptions = [
  { label: "Deutschland + (49)", value: "de" },
  { label: "Österreich + (43)", value: "at" },
  { label: "Schweiz + (41)", value: "ch" },
];


</script>

<template>
  <div
    class="w-full bg-white rounded px-5 py-5 flex flex-col gap-4 mt-7 mb-67.5"
  >
    <h1 class="text-primary text-[20px] font-bold leading-normal not-italic">
      Admin für LeasyBack (z.B. Fuhrparkleiter, Geschäftsführer)
    </h1>
    <div class="w-full h-px bg-green-gray"></div>

    <div class="w-full flex flex-col gap-4">
      <!-- Row 1: Anrede + Vorname + Nachname -->
      <div class="grid grid-cols-3 gap-1">
        
        <FormSelectField
          name="admin.anrede"
          placeholder="Bitte wählen"
          :options="anredeOptions"
          label="Anrede"
          required
          class="w-full"
        />

        <FormTextField
          name="admin.vorname"
          
          label="Vorname"
          :required="true"
          class="w-60"
        />

        <FormTextField
          name="admin.nachname"
          label="Nachname"
          :required="true"
          class="w-60"
        />
      </div>

      <!-- Row 2: Email full width -->
      <FormTextField
        name="admin.email"
        label="E-Mail-Adresse für Anfragen"
        type="email"
        :required="true"
        class="w-full"
      />

      <!-- Row 3: Vorwahl + Telefon -->
      <div class="grid grid-cols-[240px_1fr] gap-4">
        <FormSelectField
          name="admin.vorwahl"
          placeholder="Bitte wählen"
          :options="vorwahlOptions"
          label="Vorwahl"
          required
          class="w-full"
        />

        <FormTextField
          name="admin.telefon"
          label="Tel. für Anfragen"
          type="tel"
          :required="true"
          class="w-full"
        />
      </div>
    </div>
    <div class="flex justify-end py-7 px-10">
      <slot name="submit-button" />
    </div>
  </div>
</template>
