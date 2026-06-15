<script setup lang="ts">
import { ref, watch } from "vue";
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
const isCreateMode = ref(false);

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
  if (!profile) {
    isCreateMode.value = true;
    isEditMode.value = false;
    return;
  }
  isCreateMode.value = false;
  isEditMode.value = false;
  resetForm({
    values: {
      anrede: profile.contact.salutation ?? "",
      vorname: profile.contact.first_name ?? "",
      nachname: profile.contact.last_name ?? "",
      address: {
        strasse: profile.address.street ?? "",
        nr: profile.address.number ?? "",
        zusaetzlicheAnschrift: profile.address.additional_address ?? "",
        plz: profile.address.zip_code ?? "",
        ort: profile.address.city ?? "",
        latitude: profile.address.latitude ?? null,
        longitude: profile.address.longitude ?? null,
      },
    },
  });
  avatarUrl.value = (profile.contact as any).avatar_url ?? null;
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

const saveError = ref<string | null>(null);

const onSubmit = handleSubmit(async (formValues) => {
  saveError.value = null;

  try {
    if (isCreateMode.value) {
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
      const existing = b2cStore.profile.address;
      const lat = formValues.address.latitude;
      const lng = formValues.address.longitude;

      const updatePayload: B2CProfileUpdatePayload = {
        address_id: existing.address_id,
        contact_id: b2cStore.profile.contact.contact_id,
        address: {
          street: formValues.address.strasse || existing.street || "",
          number: formValues.address.nr || existing.number || "",
          additional_address: formValues.address.zusaetzlicheAnschrift || existing.additional_address || "",
          zip_code: formValues.address.plz || existing.zip_code || "",
          city: formValues.address.ort || existing.city || "",
          country: existing.country || "Deutschland",
          ...(lat && lng ? { latitude: lat, longitude: lng } : {}),
        },
        contact: {
          salutation: formValues.anrede || b2cStore.profile.contact.salutation || "",
          first_name: formValues.vorname,
          last_name: formValues.nachname,
        },
        phones: b2cStore.profile.phones || [],
      };
      await b2cStore.updateProfile(updatePayload);
    }

    await b2cStore.fetchProfile();
    avatarFile.value = null;
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to save profile:", err);
    saveError.value = "Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.";
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
  <div class="overflow-hidden rounded-2xl border border-[#D1DCDC] bg-white shadow-sm">
    <!-- ── Card header ─────────────────────────────────── -->
    <div class="flex items-center justify-between border-b border-[#EDF2F2] px-8 py-5">
      <div>
        <h2 class="text-[17px] font-bold text-[#10393B]">Kontodaten</h2>
        <p class="mt-0.5 text-[13px] text-[#7A9699]">
          Persönliche Angaben und Anschrift
        </p>
      </div>

      <button v-if="!isEditMode" type="button" @click="isEditMode = true"
        class="flex items-center gap-1.5 rounded-lg border border-[#D1DCDC] bg-white px-3.5 py-2 text-sm font-semibold text-[#10393B] transition-all hover:border-custom-green hover:bg-[#F0FBF8] hover:text-custom-green">
        <Icon icon="mdi:pencil-outline" class="size-4" />
        {{ isCreateMode ? "Profil erstellen" : "Bearbeiten" }}
      </button>
      <button v-else type="button" @click="cancelEdit"
        class="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]">
        <Icon icon="mdi:close" class="size-4" />
        Abbrechen
      </button>
    </div>

    <!-- ════════════ NO PROFILE EMPTY STATE ════════════ -->
    <div v-if="isCreateMode && !isEditMode" class="px-8 py-12 text-center">
      <Icon icon="mdi:account-circle-outline" class="mx-auto mb-3 size-12 text-[#9CB3B4]" />
      <p class="text-[15px] font-semibold text-[#10393B]">Noch kein Profil hinterlegt</p>
      <p class="mt-1 text-[13px] text-[#7A9699]">
        Klicken Sie auf „Profil erstellen", um Ihre Daten zu hinterlegen.
      </p>
    </div>

    <!-- ════════════════ READ MODE ════════════════ -->
    <div v-else-if="!isEditMode" class="px-5 py-8 sm:px-8">
      <div class="flex flex-col gap-7 lg:flex-row lg:items-start">
        <!-- Data list -->
        <dl class="grid min-w-0 flex-1 grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Name
            </dt>
            <dd class="mt-1.5 wrap-break-word text-[15px] font-semibold text-[#10393B]">
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

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              E-Mail
            </dt>
            <dd class="mt-1.5 break-all text-[15px] font-semibold text-[#10393B]">
              {{ b2cStore.profile?.email || "—" }}
            </dd>
          </div>

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Anschrift
            </dt>
            <dd class="mt-1.5 wrap-break-word text-[15px] font-semibold leading-relaxed text-[#10393B]">
              {{ formatAddressLine1() }}<br />
              <template v-if="b2cStore.profile?.address?.additional_address">
                {{ b2cStore.profile.address.additional_address }}<br />
              </template>
              {{ formatAddressLine2() }}
            </dd>
          </div>

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Land
            </dt>
            <dd class="mt-1.5 text-[15px] font-semibold text-[#10393B]">
              {{ b2cStore.profile?.address?.country || "Deutschland" }}
            </dd>
          </div>
        </dl>

        <!-- Static map preview -->
        <div class="h-[185px] w-full shrink-0 overflow-hidden rounded-2xl border border-[#D1DCDC] lg:w-[260px]">
          <AppMapPicker :latitude="values.address?.latitude ?? null" :longitude="values.address?.longitude ?? null"
            :interactive="false" />
        </div>
      </div>
    </div>

    <!-- ════════════════ EDIT MODE ════════════════ -->
    <form v-else @submit.prevent="onSubmit">
      <div class="space-y-7 px-8 py-7">
        <!-- Avatar + contact -->
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
          <div class="shrink-0">
            <button type="button" @click="triggerAvatarUpload"
              class="group relative block size-20 overflow-hidden rounded-full ring-2 ring-[#D1DCDC] ring-offset-2 transition-all hover:ring-custom-green">
              <img :src="avatarUrl || profileImage" alt="Profilbild" class="size-full object-cover" />
              <span
                class="absolute inset-0 flex items-center justify-center bg-[#10393B]/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Icon icon="mdi:camera-outline" class="size-6 text-white" />
              </span>
            </button>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
          </div>

          <div class="flex min-w-0 flex-1 flex-wrap gap-x-[30px] gap-y-4">
            <FormSelectField name="anrede" label="Anrede" placeholder="Anrede" :options="anredeOptions"
              width="w-[128px]" class="shrink-0" />
            <FormTextField name="vorname" label="Vorname" placeholder="Vorname" class="min-w-[180px] flex-1" />
            <FormTextField name="nachname" label="Nachname" placeholder="Nachname" class="min-w-[180px] flex-1" />
          </div>
        </div>

        <!-- Divider with label -->
        <div class="flex items-center gap-3">
          <span class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
            Anschrift
          </span>
          <span class="h-px flex-1 bg-[#EDF2F2]" />
        </div>
        <p class="mt-1.5! text-[13px] text-[#7A9699]">
          {{ isCreateMode ? "Bitte geben Sie Ihre Daten ein, um Ihr Profil zu erstellen." : "Adresse eingeben oder
          direkt
          auf der Karte auswählen." }}
        </p>

        <div class="flex flex-col gap-6 lg:flex-row">
          <div class="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-x-[30px] gap-y-5">
            <FormTextField name="address.strasse" label="Straße" placeholder="Straße" />
            <FormTextField name="address.nr" label="Nr." placeholder="Nr." />
            <FormTextField name="address.zusaetzlicheAnschrift" label="Zusätzliche Anschrift"
              placeholder="Adresszusatz" />
            <FormTextField name="address.plz" label="PLZ" placeholder="PLZ" />
            <FormTextField name="address.ort" label="Ort" placeholder="Ort" />
            <div class="flex flex-col">
              <span class="mb-1.5 text-sm font-semibold text-[#10393B]">Land</span>
              <span class="py-2 text-[15px] font-semibold text-[#10393B]">
                {{ b2cStore.profile?.address?.country || "Deutschland" }}
              </span>
            </div>
          </div>

          <div class="h-[260px] w-full shrink-0 overflow-hidden rounded-2xl border border-[#D1DCDC] lg:w-[380px]">
            <AppMapPicker :latitude="values.address?.latitude ?? null" :longitude="values.address?.longitude ?? null"
              :interactive="true" @resolved="onAddressFromMap" />
          </div>
        </div>
      </div>

      <!-- Action footer -->
      <div class="flex items-center justify-end gap-3 border-t border-[#EDF2F2] bg-[#F8FAFB] px-8 py-4">
        <p v-if="saveError" class="mr-auto text-sm text-red-500">{{ saveError }}</p>
        <button type="button" @click="cancelEdit"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]">
          Abbrechen
        </button>
        <Button type="submit"
          class="h-[38px] rounded-lg bg-custom-green px-6 text-sm font-semibold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting">
          {{
            isSubmitting
              ? "Wird gespeichert…"
              : isCreateMode
                ? "Profil erstellen"
                : "Änderungen speichern"
          }}
        </Button>
      </div>
    </form>
  </div>
</template>
