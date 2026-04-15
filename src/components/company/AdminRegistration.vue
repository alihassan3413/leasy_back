<script setup lang="ts">
import Input from "../form/Input.vue";

defineProps<{
  values: any
  errors: Record<string, string>
}>()


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
        <SelectDropDown
          v-model="values.anrede"
          placeholder="Bitte wählen"
          :error="errors['admin.anrede']"
          :options="anredeOptions"
          label="Anrede"
          required
          class="w-full"
        />
        <Input
          v-model="values.vorname"
          :error="errors['admin.vorname']"
          label="Vorname"
          :required="true"
          class="w-60"
        />
        <Input
          v-model="values.nachname"
          :error="errors['admin.nachname']"
          label="Nachname"
          :required="true"
          class="w-60"
        />
      </div>

      <!-- Row 2: Email full width -->
      <Input
        v-model="values.email"
        :error="errors['admin.email']"
        label="E-Mail-Adresse für Anfragen"
        type="email"
        :required="true"
        class="w-full"
      />

      <!-- Row 3: Vorwahl + Telefon -->
      <div class="grid grid-cols-[240px_1fr] gap-4">
        <SelectDropDown
          v-model="values.vorwahl"
          :error="errors['admin.vorwahl']"
          placeholder="Bitte wählen"
          :options="vorwahlOptions"
          label="Vorwahl"
          required
          class="w-full"
        />

        <Input
          v-model="values.telefon"
          :error="errors['admin.telefon']"
          label="Tel. für Anfragen"
          type="tel"
          :required="true"
          class="w-full"
        />
      </div>
    </div>
    <div class="flex justify-end py-7 px-10">
      <!-- <Button
        type="button"
        button-classes="px-8 py-2.5 rounded-[5px] text-sm font-bold leading-normal not-italic"
        class=""
      >
        Jetzt Registrieren
      </Button> -->
      <slot name="submit-button" />
    </div>
  </div>
</template>
