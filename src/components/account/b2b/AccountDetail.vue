<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import { useB2BStore } from "@/stores/b2b.store";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";
import type { B2BProfileUpdatePayload } from "@/types";

const b2bStore = useB2BStore();
const isEditMode = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const logoUrl = ref<string | null>(null);
const logoFile = ref<File | null>(null);

onMounted(async () => {
  await b2bStore.fetchProfile();
});

const { handleSubmit, resetForm, setFieldValue, isSubmitting } =
  useForm({
    initialValues: {
      firmenname: "",
      ustIdNr: "",
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
  () => b2bStore.profile,
  (profile) => {
    if (!profile) return;
    resetForm({
      values: {
        firmenname: profile.company_name,
        ustIdNr: profile.vat_id ?? "",
        address: {
          strasse: profile.address.street,
          nr: profile.address.number,
          zusaetzlicheAnschrift: profile.address.additional_address ?? "",
          plz: profile.address.zip_code,
          ort: profile.address.city,
        },
      },
    });
    logoUrl.value = profile.logo_url ?? null;
  },
  { immediate: true },
);

const triggerLogoUpload = () => {
  if (!isEditMode.value) return;
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  logoFile.value = file;
  logoUrl.value = URL.createObjectURL(file);
};

type ResolvedAddress = {
  street?: string;
  number?: string;
  zip_code?: string;
  city?: string;
};

const onAddressFromMap = (resolved: ResolvedAddress) => {
  if (!isEditMode.value) return;
  if (resolved.street) setFieldValue("address.strasse", resolved.street);
  if (resolved.number) setFieldValue("address.nr", resolved.number);
  if (resolved.zip_code) setFieldValue("address.plz", resolved.zip_code);
  if (resolved.city) setFieldValue("address.ort", resolved.city);
};

const onSubmit = handleSubmit(async (formValues) => {
  const profile = b2bStore.profile;
  if (!profile) return;

  try {
    let updatedLogoUrl = profile.logo_url ?? "";

    if (logoFile.value) {
      updatedLogoUrl = await b2bStore.uploadLogo(logoFile.value);
    }

    const primaryPhone = profile.contact.phone_numbers.find(
      (p) => p.is_primary_contact,
    );

    const payload: B2BProfileUpdatePayload = {
      company_name: formValues.firmenname,
      vat_id: formValues.ustIdNr,
      logo_url: updatedLogoUrl,
      contact_email: profile.contact_email,
      address: {
        street: formValues.address.strasse,
        number: formValues.address.nr,
        zip_code: formValues.address.plz,
        city: formValues.address.ort,
        country: profile.address.country,
      },
      contact: {
        salutation: profile.contact.salutation,
        first_name: profile.contact.first_name,
        last_name: profile.contact.last_name,
        international_prefix: primaryPhone?.international_prefix ?? "+49",
        primary_phone_number: primaryPhone?.phone_number ?? "",
        phone_numbers: profile.contact.phone_numbers,
      },
    };

    await b2bStore.updateProfile(profile.b2b, payload);

    logoUrl.value = updatedLogoUrl;
    logoFile.value = null;
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update B2B profile:", err);
  }
});

// const onSubmit = handleSubmit(async (formValues) => {
//   const profile = b2bStore.profile;
//   if (!profile) return;

//   const primaryPhone = profile.contact.phone_numbers.find((p) => p.is_primary_contact);
//   const payload: B2BProfileUpdatePayload = {
//     company_name: formValues.firmenname,
//     vat_id: formValues.ustIdNr,
//     logo_url: profile.logo_url,
//     contact_email: profile.contact_email,
//     address: {
//       street: formValues.address.strasse,
//       number: formValues.address.nr,
//       zip_code: formValues.address.plz,
//       city: formValues.address.ort,
//       country: profile.address.country,
//     },
//     contact: {
//       salutation: profile.contact.salutation,
//       first_name: profile.contact.first_name,
//       last_name: profile.contact.last_name,
//       international_prefix: primaryPhone?.international_prefix ?? "+49",
//       primary_phone_number: primaryPhone?.phone_number ?? "",
//       phone_numbers: profile.contact.phone_numbers,
//     },
//   };

//   try {
//     await b2bStore.updateProfile(profile.b2b, payload);
//     logoFile.value = null;
//     isEditMode.value = false;
//   } catch (err) {
//     console.error("Failed to update B2B profile:", err);
//   }
// });

const toggleEditMode = () => {
  if (isEditMode.value && b2bStore.profile) {
    const profile = b2bStore.profile;
    resetForm({
      values: {
        firmenname: profile.company_name,
        ustIdNr: profile.vat_id ?? "",
        address: {
          strasse: profile.address.street,
          nr: profile.address.number,
          zusaetzlicheAnschrift: profile.address.additional_address ?? "",
          plz: profile.address.zip_code,
          ort: profile.address.city,
        },
      },
    });
    logoUrl.value = profile.logo_url ?? null;
    logoFile.value = null;
  }
  isEditMode.value = !isEditMode.value;
};
</script>

<template>
  <div
    class="w-full rounded-[10px] border border-[#D9E2E2] bg-white px-10 py-6"
  >
    <!-- Header -->
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
      <!-- Logo + Company Info -->
      <div class="flex items-end gap-8">
        <!-- Logo box: explicit pixel size, won't collapse -->
        <div class="flex shrink-0 flex-col items-start gap-3">
          <div
            class="flex h-[88px] w-[97px] items-center justify-center overflow-hidden rounded-lg border border-[#D9E2E2] bg-custom-gray transition-colors"
            :class="
              isEditMode
                ? 'cursor-pointer hover:bg-[#F0F2F2]'
                : 'cursor-default'
            "
            @click="triggerLogoUpload"
          >
            <img
              v-if="logoUrl"
              :src="logoUrl"
              alt="Firmenlogo"
              class="size-full object-cover"
            />
            <Icon
              v-else
              icon="mdi:image-outline"
              class="size-16 text-green-gray"
            />
          </div>
          <span
            v-if="isEditMode"
            class="whitespace-nowrap text-base font-normal text-custom-black"
          >
            Laden Sie ihr Logo auf
          </span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />
        </div>

        <!-- Two text fields share the rest of the row -->
        <div class="flex min-w-0 flex-1 gap-[30px]">
          <FormTextField
            name="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)*"
            placeholder="Firmenname"
            class="min-w-0 flex-1"
            :disabled="!isEditMode"
          />
          <FormTextField
            name="ustIdNr"
            label="USt-IdNr."
            placeholder="USt-IdNr."
            class="min-w-0 flex-1"
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

        <div class="flex gap-6">
          <!-- Address grid: takes whatever space the map leaves -->
          <div
            class="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-x-[30px] gap-y-3"
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
                {{ b2bStore.profile?.address.country ?? "Deutschland" }}
              </span>
            </div>
          </div>

          <!-- Map: fixed pixel box so Leaflet has something to measure -->
          <div
            class="h-[260px] w-[400px] shrink-0 overflow-hidden rounded-lg border border-[#D9E2E2]"
          >
            <AppMapPicker
              :latitude="null"
              :longitude="null"
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
          {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>