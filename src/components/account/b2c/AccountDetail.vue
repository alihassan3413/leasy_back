<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import profileImage from "../../../assets/logo/B2bProfile-img.svg";
import { useB2CStore } from "@/stores/b2c.store";
import type { B2CProfileUpdatePayload } from "@/types";

const b2cStore = useB2CStore();
const isEditMode = ref(false);

onMounted(async () => {
  await b2cStore.fetchProfile();
});

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
    address: {
      strasse: "",
      nr: "",
      zusaetzlicheAnschrift: "",
      plz: "",
      ort: "",
    },
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
          address: {
            strasse: profile.address.street,
            nr: profile.address.number,
            zusaetzlicheAnschrift: profile.address.additional_address || "",
            plz: profile.address.zip_code,
            ort: profile.address.city,
          },
        },
      });
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  if (!b2cStore.profile) return;

  const payload: B2CProfileUpdatePayload = {
    address_id: b2cStore.profile.address.address_id,
    contact_id: b2cStore.profile.contact.contact_id,
    address: {
      street: values.address.strasse,
      number: values.address.nr,
      additional_address: values.address.zusaetzlicheAnschrift,
      zip_code: values.address.plz,
      city: values.address.ort,
      country: b2cStore.profile.address.country,
      longitude: b2cStore.profile.address.longitude,
      latitude: b2cStore.profile.address.latitude,
    },
    contact: {
      salutation: values.anrede,
      first_name: values.vorname,
      last_name: values.nachname,
    },
    phones: b2cStore.profile.phones || [],
  };

  try {
    await b2cStore.updateProfile(payload);
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
  }
});

const toggleEditMode = () => {
  if (isEditMode.value) {
    // If cancelling, reset form to current profile values
    if (b2cStore.profile) {
      resetForm({
        values: {
          anrede: b2cStore.profile.contact.salutation,
          vorname: b2cStore.profile.contact.first_name,
          nachname: b2cStore.profile.contact.last_name,
          address: {
            strasse: b2cStore.profile.address.street,
            nr: b2cStore.profile.address.number,
            zusaetzlicheAnschrift:
              b2cStore.profile.address.additional_address || "",
            plz: b2cStore.profile.address.zip_code,
            ort: b2cStore.profile.address.city,
          },
        },
      });
    }
  }
  isEditMode.value = !isEditMode.value;
};
</script>

<template>
  <div
    class="w-full rounded-[10px] border border-[#D9E2E2] bg-white px-10 pt-5"
  >
    <!-- Header with Pencil Icon -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-color-primary">Kontodaten</h2>
      <button
        type="button"
        @click="toggleEditMode"
        class="text-custom-green transition-opacity hover:opacity-70"
      >
        <Icon
          :icon="isEditMode ? 'mdi:close' : 'mdi:pencil-outline'"
          class="size-6"
        />
      </button>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-8">
      <!-- Logo and Company Info Section -->
      <div class="flex justify-between gap-32 items-end">
        <!-- Square Logo Upload -->
        <div class="flex flex-col items-start gap-3">
          <div
            class="flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full"
          >
            <!-- <img v-if="" :src="logoUrl" class="size-full object-cover" /> -->
            <img :src="profileImage" class="size-full object-cover" />
            <!-- <Icon v-else icon="mdi:account" class="size-16 text-green-gray" /> -->
          </div>
          <span
            v-if="isEditMode"
            class="text-base whitespace-nowrap font-normal text-custom-black"
            >Profilbild ändern</span
          >
          <input ref="fileInput" type="file" accept="image/*" class="hidden" />
        </div>

        <!-- Company Info Fields -->
        <div class="flex gap-7.5 w-full">
          <FormSelectField
            name="anrede"
            label="Anrede"
            placeholder="Anrede"
            :options="anredeOptions"
            width="w-[128px]"
            :disabled="!isEditMode"
          />
          <FormTextField
            name="vorname"
            label="Vorname"
            placeholder="Vorname"
            class="w-full max-w-95"
            :disabled="!isEditMode"
          />
          <FormTextField
            name="nachname"
            label="Nachname"
            placeholder="Nachname"
            class="w-full max-w-95"
            :disabled="!isEditMode"
          />
        </div>
      </div>

      <!-- Address Section -->
      <div class="space-y-4 pt-4">
        <p class="text-xl font-bold text-custom-black">
          Bitte geben Sie die Adresse ein oder wählen Sie diese direkt in der
          Karte aus.
        </p>

        <div class="flex justify-between gap-6">
          <!-- Address Fields -->
          <div
            class="grid flex-1 grid-cols-[2fr_1fr] gap-x-7.5 gap-y-3 lg:max-w-137.5"
          >
            <!-- Row 1: Straße & Nr -->
            <FormTextField
              name="address.strasse"
              label="Straße"
              placeholder="Straße"
              class="w-95"
              :disabled="!isEditMode"
            />
            <FormTextField
              name="address.nr"
              label="Nr."
              placeholder="Nr."
              class="w-44.5"
              :disabled="!isEditMode"
            />

            <!-- Row 2: Zusätzliche Anschrift & PLZ -->
            <FormTextField
              name="address.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              placeholder="Adresszusatz"
              class="w-95"
              :disabled="!isEditMode"
            />
            <FormTextField
              name="address.plz"
              label="PLZ"
              placeholder="PLZ"
              class="w-44.5"
              :disabled="!isEditMode"
            />

            <!-- Row 3: Ort & Land -->
            <FormTextField
              name="address.ort"
              label="Ort"
              placeholder="Ort"
              class="w-95"
              :disabled="!isEditMode"
            />
            <div class="flex flex-col">
              <span class="mb-1.5 text-sm font-bold text-black">Land</span>
              <span class="py-2 text-[15px] font-medium text-[#10393B]">
                {{ b2cStore.profile?.address.country || "Deutschland" }}
              </span>
            </div>
          </div>

          <!-- Map Placeholder -->
          <div
            class="h-52.75 max-w-101.5 flex-1 overflow-hidden rounded-lg border border-[#D9E2E2] bg-[#F9FAFA] lg:h-auto"
          >
            <div
              class="flex size-full items-center justify-center bg-[#E5E7EB] relative"
            >
              <div
                class="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Cologne,Germany&zoom=13&size=600x300&key=YOUR_API_KEY')] bg-cover bg-center opacity-40"
              ></div>
              <div class="z-10 flex flex-col items-center">
                <Icon icon="mdi:map-marker" class="size-10 text-custom-green" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div v-if="isEditMode" class="flex justify-end mb-7.5">
        <Button
          type="submit"
          class="h-8.5 rounded-[5px] bg-custom-green text-sm font-bold text-white transition-all hover:bg-[#019d7a] w-37.5"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>
