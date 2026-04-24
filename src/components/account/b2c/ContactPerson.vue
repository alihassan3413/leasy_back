<script setup lang="ts">
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";

// Options
const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];

const prefixOptions = [
  { label: "Deutschland + (49)", value: "+49" },
  { label: "Österreich + (43)", value: "+43" },
  { label: "Schweiz + (41)", value: "+41" },
];
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">
        Ansprechpartner für LeasyBack (z.B. Fuhrparkleiter, Geschäftsführer)
      </h2>
    </div>

    <div class="flex space-y-4">
      <!-- First Row: Salutation and Name -->
      <div class="flex w-full gap-7.5">
        <div class="flex w-full gap-7.5">
            <FormSelectField
              name="anrede"
              label="Anrede"
              :options="anredeOptions"
              placeholder="Anrede"
              width="w-[128px]"
            />
          <FormTextField
            name="vorname"
            label="Vorname"
            placeholder=""
            class="w-full max-w-90"
          />
          <FormTextField
            name="nachname"
            label="Nachname"
            placeholder=""
            class="w-full max-w-90"
          />
        </div>

        <!-- Save Button -->
        <div class="flex justify-end items-end">
          <Button
            type="submit"
            class="h-8.5 rounded-[5px] bg-custom-green text-sm font-bold text-white transition-all hover:bg-[#019d7a] w-37.5"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
