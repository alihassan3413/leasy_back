<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import AppMapPicker from "@/components/ui/AppMapPicker.vue";
import profileImage from "@/assets/logo/B2bProfile-img.svg";
import { useB2CStore } from "@/stores/b2c.store";
import { b2cApi } from "@/api";
import type { B2CProfileUpdatePayload, B2CProfileCreatePayload } from "@/types";

const b2cStore = useB2CStore();
const isEditMode = ref(false);
// When there's no profile, we start in edit mode to let them create one
const isCreateMode = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const avatarUrl = ref<string | null>(null);
const avatarFile = ref<File | null>(null);

onMounted(async () => {
  await b2cStore.fetchProfile();
});

const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];

const { handleSubmit, resetForm, setFieldValue, values, isSubmitting } =
  useForm({
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
        latitude: null as number | null,
        longitude: null as number | null,
      },
    },
  });

watch(
  () => b2cStore.profile,
  (profile) => {
    if (!profile) {
      // No profile - start in view mode
      isCreateMode.value = true;
      isEditMode.value = false;
      return;
    }
    // Profile exists - normal edit mode
    isCreateMode.value = false;
    isEditMode.value = false;
    resetForm({
      values: {
        anrede: profile.contact.salutation,
        vorname: profile.contact.first_name,
        nachname: profile.contact.last_name,
        address: {
          strasse: profile.address.street,
          nr: profile.address.number,
          zusaetzlicheAnschrift: profile.address.additional_address ?? "",
          plz: profile.address.zip_code,
          ort: profile.address.city,
          latitude: profile.address.latitude,
          longitude: profile.address.longitude,
        },
      },
    });
    avatarUrl.value = profile.contact.avatar_url ?? null;
  },
  { immediate: true },
);

const triggerAvatarUpload = () => {
  if (!isEditMode.value) return;
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  avatarFile.value = file;
  avatarUrl.value = URL.createObjectURL(file);
};

type ResolvedAddress = {
  street?: string;
  number?: string;
  zip_code?: string;
  city?: string;
  latitude: number;
  longitude: number;
};

const onAddressFromMap = (resolved: ResolvedAddress) => {
  if (!isEditMode.value) return;
  if (resolved.street) setFieldValue("address.strasse", resolved.street);
  if (resolved.number) setFieldValue("address.nr", resolved.number);
  if (resolved.zip_code) setFieldValue("address.plz", resolved.zip_code);
  if (resolved.city) setFieldValue("address.ort", resolved.city);
  setFieldValue("address.latitude", resolved.latitude);
  setFieldValue("address.longitude", resolved.longitude);
};

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (isCreateMode.value) {
      // Create new profile
      const createPayload: B2CProfileCreatePayload = {
        address: {
          street: formValues.address.strasse,
          number: formValues.address.nr,
          additional_address: formValues.address.zusaetzlicheAnschrift,
          zip_code: formValues.address.plz,
          city: formValues.address.ort,
          country: "Deutschland",
          latitude: formValues.address.latitude,
          longitude: formValues.address.longitude,
        },
        contact: {
          salutation: formValues.anrede,
          first_name: formValues.vorname,
          last_name: formValues.nachname,
        },
        phones: [],
      };
      await b2cApi.createProfile(createPayload);
    } else if (b2cStore.profile) {
      // Update existing profile
      const updatePayload: B2CProfileUpdatePayload = {
        address_id: b2cStore.profile.address.address_id,
        contact_id: b2cStore.profile.contact.contact_id,
        address: {
          street: formValues.address.strasse,
          number: formValues.address.nr,
          additional_address: formValues.address.zusaetzlicheAnschrift,
          zip_code: formValues.address.plz,
          city: formValues.address.ort,
          country: b2cStore.profile.address.country,
          latitude: formValues.address.latitude,
          longitude: formValues.address.longitude,
        },
        contact: {
          salutation: formValues.anrede,
          first_name: formValues.vorname,
          last_name: formValues.nachname,
        },
        phones: b2cStore.profile.phones || [],
      };
      await b2cStore.updateProfile(updatePayload);
    }
    // Refresh profile after create/update
    await b2cStore.fetchProfile();
    avatarFile.value = null;
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to save profile:", err);
  }
});

const toggleEditMode = () => {
  if (isEditMode.value) {
    // Cancel edit
    if (b2cStore.profile) {
      const profile = b2cStore.profile;
      resetForm({
        values: {
          anrede: profile.contact.salutation,
          vorname: profile.contact.first_name,
          nachname: profile.contact.last_name,
          address: {
            strasse: profile.address.street,
            nr: profile.address.number,
            zusaetzlicheAnschrift: profile.address.additional_address ?? "",
            plz: profile.address.zip_code,
            ort: profile.address.city,
            latitude: profile.address.latitude,
            longitude: profile.address.longitude,
          },
        },
      });
      avatarUrl.value = profile.contact.avatar_url ?? null;
      avatarFile.value = null;
    } else {
      // Reset form if no profile
      resetForm();
      avatarUrl.value = null;
      avatarFile.value = null;
    }
  }
  isEditMode.value = !isEditMode.value;
};
</script>

<template>
  <div
    class="w-full rounded-[10px] border border-[#D9E2E2] bg-white px-10 py-6"
  >
    <!-- Header with Pencil / Close Icon -->
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

    <!-- No profile message -->
    <div v-if="!b2cStore.profile && !isEditMode" class="mb-6 text-center py-8">
      <p class="text-lg text-gray-600">Sie haben noch kein Profil erstellt!</p>
      <p class="text-sm text-gray-500 mt-2">
        Klicken Sie auf den Stift-Button oben, um Ihr Profil zu erstellen.
      </p>
    </div>

    <form
      @submit.prevent="onSubmit"
      class="space-y-8"
      v-if="isEditMode || b2cStore.profile"
    >
      <!-- Avatar + Contact info -->
      <div class="flex items-end gap-8">
        <!-- Avatar -->
        <div class="flex flex-col items-start gap-3 shrink-0">
          <div
            class="flex size-24 items-center justify-center overflow-hidden rounded-full"
            :class="isEditMode ? 'cursor-pointer' : 'cursor-default'"
            @click="triggerAvatarUpload"
          >
            <img
              :src="avatarUrl || profileImage"
              alt="Profilbild"
              class="size-full object-cover"
            />
          </div>
          <span
            v-if="isEditMode"
            class="whitespace-nowrap text-base font-normal text-custom-black"
          >
            Profilbild ändern
          </span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />
        </div>

        <!-- Contact fields: fill remaining row, never overflow -->
        <div class="flex flex-1 min-w-0 gap-[30px]">
          <FormSelectField
            name="anrede"
            label="Anrede"
            placeholder="Anrede"
            :options="anredeOptions"
            width="w-[128px]"
            :disabled="!isEditMode"
            class="shrink-0"
          />
          <FormTextField
            name="vorname"
            label="Vorname"
            placeholder="Vorname"
            class="flex-1 min-w-0"
            :disabled="!isEditMode"
          />
          <FormTextField
            name="nachname"
            label="Nachname"
            placeholder="Nachname"
            class="flex-1 min-w-0"
            :disabled="!isEditMode"
          />
        </div>
      </div>

      <!-- Address Section -->
      <div class="space-y-4 pt-4">
        <p class="text-xl font-bold text-custom-black">
          {{
            isCreateMode
              ? "Bitte geben Sie Ihre Daten ein, um Ihr Profil zu erstellen."
              : "Bitte geben Sie die Adresse ein oder wählen Sie diese direkt in der Karte aus."
          }}
        </p>

        <div class="flex gap-6">
          <!-- Address grid: shares the row with the map. min-w-0 so it can shrink. -->
          <div
            class="grid flex-1 min-w-0 grid-cols-[2fr_1fr] gap-x-[30px] gap-y-3"
          >
            <FormTextField
              name="address.strasse"
              label="Straße"
              placeholder="Straße"
              :disabled="!isEditMode"
            />
            <FormTextField
              name="address.nr"
              label="Nr."
              placeholder="Nr."
              :disabled="!isEditMode"
            />

            <FormTextField
              name="address.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              placeholder="Adresszusatz"
              :disabled="!isEditMode"
            />
            <FormTextField
              name="address.plz"
              label="PLZ"
              placeholder="PLZ"
              :disabled="!isEditMode"
            />

            <FormTextField
              name="address.ort"
              label="Ort"
              placeholder="Ort"
              :disabled="!isEditMode"
            />
            <div class="flex flex-col">
              <span class="mb-1.5 text-sm font-bold text-black">Land</span>
              <span class="py-2 text-[15px] font-medium text-[#10393B]">
                {{ b2cStore.profile?.address.country || "Deutschland" }}
              </span>
            </div>
          </div>

          <!-- Map: fixed width on laptop, fixed height so Leaflet can measure. -->
          <div
            class="h-[260px] w-[400px] shrink-0 overflow-hidden rounded-lg border border-[#D9E2E2]"
          >
            <AppMapPicker
              :latitude="values.address?.latitude ?? null"
              :longitude="values.address?.longitude ?? null"
              :interactive="isEditMode"
              @resolved="onAddressFromMap"
            />
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div v-if="isEditMode" class="mb-[30px] flex justify-end">
        <Button
          type="submit"
          class="h-[34px] w-[150px] rounded-[5px] bg-custom-green text-sm font-bold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{
            isSubmitting
              ? "Wird gespeichert..."
              : isCreateMode
                ? "Profil erstellen"
                : "Speichern"
          }}
        </Button>
      </div>
    </form>
  </div>
</template>
