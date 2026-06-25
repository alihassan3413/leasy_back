<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import { useB2BStore } from "@/stores/b2b.store";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import { adminSchema } from "@/validations/b2b.validation";
import { dialingCodeOptions } from "@/config/dialingCodes";
import type { B2BProfileUpdatePayload } from "@/types";

const b2bStore = useB2BStore();
const isEditMode = ref(false);

const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];

const prefixOptions = dialingCodeOptions;

const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: adminSchema,
  initialValues: {
    anrede: "",
    vorname: "",
    nachname: "",
    email: "",
    prefix: "+49",
    phone: "",
  },
});

const syncFromProfile = () => {
  const profile = b2bStore.profile;
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
};

watch(() => b2bStore.profile, syncFromProfile, { immediate: true });

// Re-populate the form from the current profile every time edit mode opens.
// vee-validate drops field values when the inputs unmount (read mode), and the
// profile watcher only fires on a profile change — so without this the second
// edit-open would show empty fields.
const enterEditMode = () => {
  syncFromProfile();
  isEditMode.value = true;
};

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
        {
          international_prefix: formValues.prefix,
          phone_number: formValues.phone,
          is_primary_contact: true,
        },
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

const cancelEdit = () => {
  syncFromProfile();
  isEditMode.value = false;
};
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#D1DCDC] bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#EDF2F2] px-8 py-5">
      <div>
        <h2 class="text-[17px] font-bold text-[#10393B]">Ansprechpartner</h2>
        <p class="mt-0.5 text-[13px] text-[#7A9699]">
          Für LeasyBack, z. B. Fuhrparkleitung oder Geschäftsführung
        </p>
      </div>

      <button
        v-if="!isEditMode"
        type="button"
        @click="enterEditMode"
        class="flex items-center gap-1.5 rounded-lg border border-[#D1DCDC] bg-white px-3.5 py-2 text-sm font-semibold text-[#10393B] transition-all hover:border-custom-green hover:bg-[#F0FBF8] hover:text-custom-green"
      >
        <Icon icon="mdi:pencil-outline" class="size-4" />
        Bearbeiten
      </button>
      <button
        v-else
        type="button"
        @click="cancelEdit"
        class="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]"
      >
        <Icon icon="mdi:close" class="size-4" />
        Abbrechen
      </button>
    </div>

    <!-- READ MODE -->
    <div v-if="!isEditMode" class="px-8 py-7">
      <div class="flex items-start gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EDF6F4] text-custom-green shadow-sm"
        >
          <Icon icon="mdi:account-tie-outline" class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[15px] font-semibold text-[#10393B]">
            {{
              [
                b2bStore.profile?.contact?.salutation,
                b2bStore.profile?.contact?.first_name,
                b2bStore.profile?.contact?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "—"
            }}
          </p>
          <p class="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CB3B4]">
            Ansprechpartner
          </p>
          <div class="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2">
            <div>
              <span class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]"
                >E-Mail</span
              >
              <p class="mt-0.5 break-all text-[13px] font-medium text-[#10393B]">
                {{ b2bStore.profile?.contact_email || "—" }}
              </p>
            </div>
            <div>
              <span class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]"
                >Telefon</span
              >
              <p class="mt-0.5 text-[13px] font-medium text-[#10393B]">
                {{
                  (() => {
                    const p = b2bStore.profile?.contact?.phone_numbers?.find(
                      (n) => n.is_primary_contact,
                    );
                    return p ? `${p.international_prefix} ${p.phone_number}` : "—";
                  })()
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODE -->
    <form v-else @submit.prevent="onSubmit">
      <div class="space-y-5 px-8 py-7">
        <!-- Salutation + Name -->
        <div class="flex flex-wrap gap-x-[30px] gap-y-5 sm:flex-nowrap">
          <FormSelectField
            name="anrede"
            label="Anrede"
            :options="anredeOptions"
            placeholder="Anrede"
            width="w-[128px]"
            class="shrink-0"
          />
          <div class="flex min-w-0 flex-1 gap-[30px]">
            <FormTextField
              name="vorname"
              label="Vorname"
              placeholder="Vorname"
              class="min-w-0 flex-1"
            />
            <FormTextField
              name="nachname"
              label="Nachname"
              placeholder="Nachname"
              class="min-w-0 flex-1"
            />
          </div>
        </div>

        <!-- Email -->
        <FormTextField
          name="email"
          label="E-Mail-Adresse für Anfragen"
          placeholder="E-Mail-Adresse"
        />

        <!-- Phone -->
        <div class="flex flex-wrap gap-x-[30px] gap-y-5 sm:flex-nowrap">
          <FormSelectField
            name="prefix"
            label="Internat. Vorwahl"
            :options="prefixOptions"
            width="w-[180px]"
            class="shrink-0"
          />
          <FormTextField
            name="phone"
            label="Tel. für Anfragen"
            placeholder="Telefonnummer"
            class="min-w-0 flex-1"
          />
        </div>
      </div>

      <!-- Action footer -->
      <div
        class="flex items-center justify-end gap-3 border-t border-[#EDF2F2] bg-[#F8FAFB] px-8 py-4"
      >
        <button
          type="button"
          @click="cancelEdit"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]"
        >
          Abbrechen
        </button>
        <Button
          type="submit"
          class="h-[38px] rounded-lg bg-custom-green px-6 text-sm font-semibold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert…" : "Speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>
