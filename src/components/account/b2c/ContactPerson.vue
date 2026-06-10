<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import { useB2CStore } from "@/stores/b2c.store";
import type { B2CProfileUpdatePayload } from "@/types";

const b2cStore = useB2CStore();

// Options
const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];

const { handleSubmit, resetForm, isSubmitting } = useForm({
  initialValues: {
    anrede: "",
    vorname: "",
    nachname: "",
  },
});

watch(
  () => b2cStore.profile,
  (profile) => {
    if (profile) {
      resetForm({
        values: {
          anrede: profile.contact.salutation,
          vorname: profile.contact.first_name,
          nachname: profile.contact.last_name,
        },
      });
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  console.log("Contact form submitted:", values);

  if (!b2cStore.profile) return;

  const payload: B2CProfileUpdatePayload = {
    address_id: b2cStore.profile.address.address_id,
    contact_id: b2cStore.profile.contact.contact_id,
    address: b2cStore.profile.address,
    contact: {
      salutation: values.anrede,
      first_name: values.vorname,
      last_name: values.nachname,
    },
    phones: b2cStore.profile.phones || [],
  };

  try {
    await b2cStore.updateProfile(payload);
    await b2cStore.fetchProfile(); // Refresh profile to show updated data
  } catch (err) {
    console.error("Failed to update contact person:", err);
  }
});
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">
        Ansprechpartner für LeasyBack (z.B. Fuhrparkleiter, Geschäftsführer)
      </h2>
    </div>

    <form @submit.prevent="onSubmit" class="flex space-y-4">
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
            placeholder="Vorname"
            class="w-full max-w-90"
          />
          <FormTextField
            name="nachname"
            label="Nachname"
            placeholder="Nachname"
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
    </form>
  </div>
</template>
