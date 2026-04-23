<script setup lang="ts">
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";

const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
];

const vorwahlOptions = [
  { label: "Deutschland + (49)", value: "de" },
  { label: "Österreich + (43)", value: "at" },
  { label: "Schweiz + (41)", value: "ch" },
];
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Ansprechpartner für LeasyBack
      </h2>
      <p
        class="text-black text-base font-normal leading-normal not-italic mt-1"
      >
        Damit wir Sie betreuen und informieren können, teilen Sie uns bitte
        einen Ansprechpartner für den LeasyBack.com Kundenservice mit.
      </p>

      <div class="w-full h-px bg-green-gray mb-4"></div>

      <!-- Form Grid -->
      <div class="grid grid-cols-3 gap-x-4 gap-y-4 w-full">
        <!-- Row 1: Firmenname -->
        <div class="col-span-3">
          <FormTextField
            name="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)"
            placeholder=""
            required
            class="w-full"
          />
        </div>

        <!-- Row 2: Anrede, Vorname, Nachname -->
        <div class="col-span-1">
          <FormSelectField
            name="contact.anrede"
            label="Anrede"
            :options="anredeOptions"
            placeholder="Herr"
            required
          />
        </div>
        <div class="col-span-1">
          <FormTextField
            name="contact.vorname"
            label="Vorname"
            placeholder=""
            required
          />
        </div>
        <div class="col-span-1">
          <FormTextField
            name="contact.nachname"
            label="Nachname"
            placeholder=""
            required
          />
        </div>

        <!-- Row 3: Internat. Vorwahl, Tel. für Anfragen -->
        <div class="col-span-1">
          <FormSelectField
            name="contact.vorwahl"
            label="Internat. Vorwahl*"
            :options="vorwahlOptions"
            placeholder="Deutschland + (49)"
            required
          />
        </div>
        <div class="col-span-2">
          <FormTextField
            name="contact.telefon"
            label="Tel. für Anfragen"
            placeholder=""
            required
          />
        </div>
      </div>
    </div>
  </div>
</template>
