<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import { useB2CStore } from "@/stores/b2c.store";
import type { B2CProfileUpdatePayload } from "@/types";

const b2cStore = useB2CStore();
const isEditMode = ref(false);

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

const syncFromProfile = () => {
  const profile = b2cStore.profile;
  if (!profile) return;
  resetForm({
    values: {
      anrede: profile.contact.salutation,
      vorname: profile.contact.first_name,
      nachname: profile.contact.last_name,
    },
  });
};

watch(() => b2cStore.profile, syncFromProfile, { immediate: true });

// Re-populate the form from the current profile every time edit mode opens.
// vee-validate drops field values when the inputs unmount (read mode), and the
// profile watcher only fires on a profile change — so without this the second
// edit-open would show empty fields.
const enterEditMode = () => {
  syncFromProfile();
  isEditMode.value = true;
};

const onSubmit = handleSubmit(async (values) => {
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
    await b2cStore.fetchProfile();
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update contact person:", err);
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
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EDF2F2] px-4 py-4 sm:px-8 sm:py-5"
    >
      <div>
        <h2 class="text-[16px] sm:text-[17px] font-bold text-[#10393B]">Ansprechpartner</h2>
        <p class="mt-0.5 text-[12px] sm:text-[13px] text-[#7A9699]">
          Für LeasyBack, z. B. Fuhrparkleitung oder Geschäftsführung
        </p>
      </div>

      <div class="flex shrink-0">
        <button
          v-if="!isEditMode"
          type="button"
          @click="enterEditMode"
          class="flex items-center gap-1.5 rounded-lg border border-[#D1DCDC] bg-white px-3 py-2 text-sm font-semibold text-[#10393B] transition-all hover:border-custom-green hover:bg-[#F0FBF8] hover:text-custom-green"
        >
          <Icon icon="mdi:pencil-outline" class="size-4" />
          Bearbeiten
        </button>
        <button
          v-else
          type="button"
          @click="cancelEdit"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]"
        >
          <Icon icon="mdi:close" class="size-4" />
          Abbrechen
        </button>
      </div>
    </div>

    <!-- READ MODE -->
    <div v-if="!isEditMode" class="px-4 py-5 sm:px-8 sm:py-7">
      <div class="flex items-center gap-4">
        <div
          class="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-full bg-[#EDF6F4] text-custom-green shadow-sm"
        >
          <Icon icon="mdi:account-tie-outline" class="size-4 sm:size-5" />
        </div>
        <div class="min-w-0">
          <p class="text-[14px] sm:text-[15px] font-semibold text-[#10393B] truncate">
            {{
              [
                b2cStore.profile?.contact?.salutation,
                b2cStore.profile?.contact?.first_name,
                b2cStore.profile?.contact?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Noch kein Ansprechpartner hinterlegt"
            }}
          </p>
          <p
            class="mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-[#9CB3B4]"
          >
            Ansprechpartner
          </p>
        </div>
      </div>
    </div>

    <!-- EDIT MODE -->
    <form v-else @submit.prevent="onSubmit">
      <div
        class="flex flex-col gap-y-5 sm:flex-wrap sm:flex-row sm:gap-x-[30px] px-4 py-5 sm:px-8 sm:py-7"
      >
        <FormSelectField
          name="anrede"
          label="Anrede"
          :options="anredeOptions"
          placeholder="Anrede"
          width="w-full sm:w-[128px]"
          class="shrink-0"
        />
        <FormTextField
          name="vorname"
          label="Vorname"
          placeholder="Vorname"
          class="min-w-[140px] flex-1"
        />
        <FormTextField
          name="nachname"
          label="Nachname"
          placeholder="Nachname"
          class="min-w-[140px] flex-1"
        />
      </div>

      <div
        class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-[#EDF2F2] bg-[#F8FAFB] px-4 py-4 sm:px-8"
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
          class="h-[38px] w-full sm:w-auto rounded-lg bg-custom-green px-6 text-sm font-semibold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert…" : "Speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>
