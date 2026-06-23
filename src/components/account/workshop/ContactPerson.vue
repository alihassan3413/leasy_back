<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import { useWorkshopStore } from "@/stores/workshop.store";
import { contactSchema } from "@/validations/workshop.validation";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";

const workshopStore = useWorkshopStore();

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

const { setValues } = useForm({
  validationSchema: contactSchema,
  initialValues: {
    anrede: "Herr",
    vorname: "",
    nachname: "",
    email: "",
    prefix: "+49",
    phone: "",
  },
});

// Watch for store profile changes and update form
watch(
  () => workshopStore.profile,
  (newProfile) => {
    if (newProfile) {
      const primaryPhone =
        newProfile.contact.phone_numbers.find((p) => p.is_primary_contact) ||
        newProfile.contact.phone_numbers[0];

      setValues({
        anrede:
          newProfile.contact.salutation === "Mr"
            ? "Herr"
            : newProfile.contact.salutation === "Ms"
              ? "Frau"
              : "Divers",
        vorname: newProfile.contact.first_name,
        nachname: newProfile.contact.last_name,
        email: newProfile.contact_email,
        prefix: primaryPhone?.international_prefix || "+49",
        phone: primaryPhone?.phone_number || "",
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">
        Ansprechpartner für LeasyBack (z.B. Fuhrparkleiter, Geschäftsführer)
      </h2>
    </div>

    <div class="space-y-4">
      <!-- First Row: Salutation and Name -->
      <div class="flex gap-7.5">
        <div class="">
          <FormSelectField
            name="anrede"
            label="Anrede"
            :options="anredeOptions"
          />
        </div>
        <div class="flex gap-7.5">
          <FormTextField name="vorname" label="Vorname" placeholder="" class="w-90" />
          <FormTextField name="nachname" label="Nachname" placeholder="" class="w-90" />
        </div>
      </div>

      <!-- Second Row: Email -->
      <div class="w-252.5">
        <FormTextField
          name="email"
          label="E-Mail-Adresse für Anfragen"
          placeholder=""
          class=""
        />
      </div>

      <!-- Third Row: Prefix and Phone -->
      <div class="flex gap-7.5">
        <div class="">
          <FormSelectField
            name="prefix"
            label="Internat. Vorwahl"
            :options="prefixOptions"
          />
        </div>
        <div class="w-187.5">
          <FormTextField
            name="phone"
            label="Tel. für Anfragen"
            placeholder=""
          />
        </div>
      </div>
    </div>
  </div>
</template>
