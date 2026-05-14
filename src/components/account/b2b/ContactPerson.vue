<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import { useB2BStore } from "@/stores/b2b.store";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import type { B2BProfileUpdatePayload } from "@/types";

const b2bStore = useB2BStore();
const isEditMode = ref(false);

const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];

const prefixOptions = [
  { label: "Deutschland +49", value: "+49" },
  { label: "Österreich +43", value: "+43" },
  { label: "Schweiz +41", value: "+41" },
];

const { handleSubmit, resetForm, isSubmitting } = useForm({
  initialValues: {
    anrede: "",
    vorname: "",
    nachname: "",
    email: "",
    prefix: "+49",
    phone: "",
  },
});

watch(
  () => b2bStore.profile,
  (profile) => {
    if (!profile) return;
    const primary = profile.contact.phone_numbers.find((p) => p.is_primary_contact);
    resetForm({
      values: {
        anrede: profile.contact.salutation,
        vorname: profile.contact.first_name,
        nachname: profile.contact.last_name,
        email: profile.contact_email,
        prefix: primary?.international_prefix ?? "+49",
        phone: primary?.phone_number ?? "",
      },
    });
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (formValues) => {
  const profile = b2bStore.profile;
  if (!profile) return;

  const nonPrimaryPhones = profile.contact.phone_numbers.filter((p) => !p.is_primary_contact);
  const payload: B2BProfileUpdatePayload = {
    company_name: profile.company_name,
    vat_id: profile.vat_id ?? "",
    logo_url: profile.logo_url,
    contact_email: formValues.email,
    address: {
      street: profile.address.street,
      number: profile.address.number,
      zip_code: profile.address.zip_code,
      city: profile.address.city,
      country: profile.address.country,
    },
    contact: {
      salutation: formValues.anrede,
      first_name: formValues.vorname,
      last_name: formValues.nachname,
      international_prefix: formValues.prefix,
      primary_phone_number: formValues.phone,
      phone_numbers: [
        { international_prefix: formValues.prefix, phone_number: formValues.phone, is_primary_contact: true },
        ...nonPrimaryPhones,
      ],
    },
  };

  try {
    await b2bStore.updateProfile(profile.b2b, payload);
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update contact:", err);
  }
});

function toggleEditMode() {
  if (isEditMode.value && b2bStore.profile) {
    const profile = b2bStore.profile;
    const primary = profile.contact.phone_numbers.find((p) => p.is_primary_contact);
    resetForm({
      values: {
        anrede: profile.contact.salutation,
        vorname: profile.contact.first_name,
        nachname: profile.contact.last_name,
        email: profile.contact_email,
        prefix: primary?.international_prefix ?? "+49",
        phone: primary?.phone_number ?? "",
      },
    });
  }
  isEditMode.value = !isEditMode.value;
}
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-color-primary">
        Ansprechpartner für LeasyBack (z.B. Fuhrparkleiter, Geschäftsführer)
      </h2>
      <button
        type="button"
        class="text-custom-green transition-opacity hover:opacity-70"
        @click="toggleEditMode"
      >
        <Icon
          :icon="isEditMode ? 'mdi:close' : 'mdi:pencil-outline'"
          class="size-6"
        />
      </button>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- First Row: Salutation and Name -->
      <div class="flex gap-7.5">
        <FormSelectField
          name="anrede"
          label="Anrede"
          :options="anredeOptions"
          :disabled="!isEditMode"
        />
        <div class="flex gap-7.5">
          <FormTextField
            name="vorname"
            label="Vorname"
            placeholder=""
            class="w-90"
            :disabled="!isEditMode"
          />
          <FormTextField
            name="nachname"
            label="Nachname"
            placeholder=""
            class="w-90"
            :disabled="!isEditMode"
          />
        </div>
      </div>

      <!-- Email -->
      <div class="w-252.5">
        <FormTextField
          name="email"
          label="E-Mail-Adresse für Anfragen"
          placeholder=""
          :disabled="!isEditMode"
        />
      </div>

      <!-- Phone -->
      <div class="flex gap-7.5">
        <FormSelectField
          name="prefix"
          label="Internat. Vorwahl"
          :options="prefixOptions"
          :disabled="!isEditMode"
        />
        <div class="w-187.5">
          <FormTextField
            name="phone"
            label="Tel. für Anfragen"
            placeholder=""
            :disabled="!isEditMode"
          />
        </div>
      </div>

      <div v-if="isEditMode" class="flex justify-end pt-2">
        <Button
          type="submit"
          class="h-[34px] w-[150px] rounded-[5px] bg-custom-green text-sm font-bold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>
