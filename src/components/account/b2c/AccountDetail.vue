<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";
import Button from "@/components/ui/button/Button.vue";
import profileImage from "@/assets/logo/B2bProfile-img.svg";
import { useB2CStore } from "@/stores/b2c.store";
import type { B2CProfileUpdatePayload } from "@/types";

const b2cStore = useB2CStore();
const isEditMode = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const avatarUrl = ref<string | null>(null);
const avatarFile = ref<File | null>(null);

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

const syncFromProfile = () => {
  const profile = b2cStore.profile;
  if (!profile) return;
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
};

watch(() => b2cStore.profile, syncFromProfile, { immediate: true });

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
  if (!b2cStore.profile) return;

  const payload: B2CProfileUpdatePayload = {
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

  try {
    await b2cStore.updateProfile(payload);
    avatarFile.value = null;
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
  }
});

const cancelEdit = () => {
  syncFromProfile();
  avatarFile.value = null;
  isEditMode.value = false;
};

const formatAddressLine1 = () => {
  const a = b2cStore.profile?.address;
  if (!a) return "—";
  return [a.street, a.number].filter(Boolean).join(" ") || "—";
};

const formatAddressLine2 = () => {
  const a = b2cStore.profile?.address;
  if (!a) return "—";
  return [a.zip_code, a.city].filter(Boolean).join(" ") || "—";
};
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#D9E2E2] bg-white">
    <!-- ── Card header ─────────────────────────────────── -->
    <div class="flex items-center justify-between border-b border-[#EDF2F2] px-8 py-5">
      <div>
        <h2 class="text-lg font-bold text-[#10393B]">Kontodaten</h2>
        <p class="mt-0.5 text-[13px] text-[#6B8587]">
          Persönliche Angaben und Anschrift
        </p>
      </div>

      <button
        v-if="!isEditMode"
        type="button"
        @click="isEditMode = true"
        class="flex items-center gap-1.5 rounded-lg border border-[#D9E2E2] px-3.5 py-2 text-sm font-bold text-[#10393B] transition-colors hover:border-custom-green hover:text-custom-green"
      >
        <Icon icon="mdi:pencil-outline" class="size-4" />
        Bearbeiten
      </button>
      <button
        v-else
        type="button"
        @click="cancelEdit"
        class="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-[#6B8587] transition-colors hover:text-[#10393B]"
      >
        <Icon icon="mdi:close" class="size-4" />
        Abbrechen
      </button>
    </div>

    <!-- ════════════════ READ MODE ════════════════ -->
    <div v-if="!isEditMode" class="px-8 py-7">
      <div class="flex flex-col gap-8 md:flex-row md:items-start">
        <!-- Data list -->
        <dl class="grid flex-1 grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
              Name
            </dt>
            <dd class="mt-1 text-[15px] font-medium text-[#10393B]">
              {{
                [
                  b2cStore.profile?.contact?.salutation,
                  b2cStore.profile?.contact?.first_name,
                  b2cStore.profile?.contact?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") || "—"
              }}
            </dd>
          </div>

          <div>
            <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
              E-Mail
            </dt>
            <dd class="mt-1 text-[15px] font-medium text-[#10393B]">
              {{ b2cStore.profile?.email || "—" }}
            </dd>
          </div>

          <div>
            <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
              Anschrift
            </dt>
            <dd class="mt-1 text-[15px] font-medium leading-relaxed text-[#10393B]">
              {{ formatAddressLine1() }}<br />
              <template v-if="b2cStore.profile?.address?.additional_address">
                {{ b2cStore.profile.address.additional_address }}<br />
              </template>
              {{ formatAddressLine2() }}
            </dd>
          </div>

          <div>
            <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
              Land
            </dt>
            <dd class="mt-1 text-[15px] font-medium text-[#10393B]">
              {{ b2cStore.profile?.address?.country || "Deutschland" }}
            </dd>
          </div>
        </dl>

        <!-- Static map preview -->
        <div
          class="h-[180px] w-full shrink-0 overflow-hidden rounded-xl border border-[#D9E2E2] md:w-[300px]"
        >
          <AppMapPicker
            :latitude="values.address?.latitude ?? null"
            :longitude="values.address?.longitude ?? null"
            :interactive="false"
          />
        </div>
      </div>
    </div>

    <!-- ════════════════ EDIT MODE ════════════════ -->
    <form v-else @submit.prevent="onSubmit">
      <div class="space-y-8 px-8 py-7">
        <!-- Avatar + contact -->
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
          <div class="shrink-0">
            <button
              type="button"
              @click="triggerAvatarUpload"
              class="group relative block size-20 overflow-hidden rounded-full ring-2 ring-[#D9E2E2] ring-offset-2 transition-shadow hover:ring-custom-green"
            >
              <img
                :src="avatarUrl || profileImage"
                alt="Profilbild"
                class="size-full object-cover"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-[#10393B]/55 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Icon icon="mdi:camera-outline" class="size-6 text-white" />
              </span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileChange"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-wrap gap-x-[30px] gap-y-4">
            <FormSelectField
              name="anrede"
              label="Anrede"
              placeholder="Anrede"
              :options="anredeOptions"
              width="w-[128px]"
              class="shrink-0"
            />
            <FormTextField
              name="vorname"
              label="Vorname"
              placeholder="Vorname"
              class="min-w-[180px] flex-1"
            />
            <FormTextField
              name="nachname"
              label="Nachname"
              placeholder="Nachname"
              class="min-w-[180px] flex-1"
            />
          </div>
        </div>

        <!-- Divider with label -->
        <div class="flex items-center gap-4">
          <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
            Anschrift
          </span>
          <span class="h-px flex-1 bg-[#EDF2F2]" />
        </div>
        <p class="!mt-2 text-[13px] text-[#6B8587]">
          Adresse eingeben oder direkt auf der Karte auswählen.
        </p>

        <div class="flex flex-col gap-6 lg:flex-row">
          <div class="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-x-[30px] gap-y-4">
            <FormTextField name="address.strasse" label="Straße" placeholder="Straße" />
            <FormTextField name="address.nr" label="Nr." placeholder="Nr." />
            <FormTextField
              name="address.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              placeholder="Adresszusatz"
            />
            <FormTextField name="address.plz" label="PLZ" placeholder="PLZ" />
            <FormTextField name="address.ort" label="Ort" placeholder="Ort" />
            <div class="flex flex-col">
              <span class="mb-1.5 text-sm font-bold text-black">Land</span>
              <span class="py-2 text-[15px] font-medium text-[#10393B]">
                {{ b2cStore.profile?.address.country || "Deutschland" }}
              </span>
            </div>
          </div>

          <div
            class="h-[260px] w-full shrink-0 overflow-hidden rounded-xl border border-[#D9E2E2] lg:w-[380px]"
          >
            <AppMapPicker
              :latitude="values.address?.latitude ?? null"
              :longitude="values.address?.longitude ?? null"
              :interactive="true"
              @resolved="onAddressFromMap"
            />
          </div>
        </div>
      </div>

      <!-- Sticky-feeling action footer -->
      <div
        class="flex items-center justify-end gap-3 border-t border-[#EDF2F2] bg-[#FAFAFA] px-8 py-4"
      >
        <button
          type="button"
          @click="cancelEdit"
          class="rounded-lg px-4 py-2 text-sm font-bold text-[#6B8587] transition-colors hover:text-[#10393B]"
        >
          Abbrechen
        </button>
        <Button
          type="submit"
          class="h-[38px] rounded-lg bg-custom-green px-6 text-sm font-bold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert…" : "Änderungen speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>