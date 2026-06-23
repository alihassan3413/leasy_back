<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import { useB2BStore } from "@/stores/b2b.store";
import { useAuthStore } from "@/stores/auth.store";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";
import { companySchema } from "@/validations/b2b.validation";
import type { B2BProfileUpdatePayload } from "@/types";

const b2bStore = useB2BStore();
const authStore = useAuthStore();
const isEditMode = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const logoUrl = ref<string | null>(null);
const logoFile = ref<File | null>(null);
const logoDeleted = ref(false);

onMounted(async () => {
  await b2bStore.fetchProfile();
});

const deleteLogo = async () => {
  if (!isEditMode.value) return;

  const oldLogoKey = b2bStore.profile?.logo_url;

  logoFile.value = null;
  logoUrl.value = null;
  logoDeleted.value = true;

  b2bStore.logoUrl = "";
  b2bStore.logoKey = "";

  if (fileInput.value) {
    fileInput.value.value = "";
  }

  if (oldLogoKey) {
    try {
      await b2bStore.deleteLogo(oldLogoKey);
    } catch (err) {
      console.error("Failed to delete logo:", err);
    }
  }
};

const { handleSubmit, resetForm, setFieldValue, isSubmitting } = useForm({
  validationSchema: companySchema,
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

const syncFromProfile = () => {
  const profile = b2bStore.profile;
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
  logoUrl.value = b2bStore.logoUrl || null;
};

watch(() => b2bStore.profile, syncFromProfile, { immediate: true });

watch(
  () => b2bStore.logoUrl,
  (newLogoUrl) => {
    if (!logoFile.value && !logoDeleted.value) {
      logoUrl.value = newLogoUrl || null;
    }
  },
  { immediate: true },
);

const triggerLogoUpload = () => {
  if (!isEditMode.value) return;
  fileInput.value?.click();
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
    alert("Bitte laden Sie nur JPG oder PNG Dateien hoch.");
    target.value = "";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    alert("Die Datei darf maximal 8MB groß sein.");
    target.value = "";
    return;
  }

  logoFile.value = file;
  logoDeleted.value = false;
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
  try {
    let updatedLogoKey = "";

    if (logoDeleted.value) {
      updatedLogoKey = "";
    } else if (logoFile.value) {
      updatedLogoKey = await b2bStore.uploadLogo(logoFile.value);
    } else if (b2bStore.profile?.logo_url) {
      updatedLogoKey = b2bStore.profile.logo_url;
    }

    // Determine if we need to create or update
    const profile = b2bStore.profile;

    const payload = {
      company_name: formValues.firmenname,
      vat_id: formValues.ustIdNr,
      logo_url: updatedLogoKey,
      contact_email: profile?.contact_email ?? authStore.user?.email ?? "",
      address: {
        street: formValues.address.strasse,
        number: formValues.address.nr,
        zip_code: formValues.address.plz,
        city: formValues.address.ort,
        country: profile?.address.country ?? "Germany",
      },
      contact: {
        salutation: profile?.contact.salutation ?? "herr",
        first_name: profile?.contact.first_name ?? "",
        last_name: profile?.contact.last_name ?? "",
        international_prefix:
          profile?.contact.phone_numbers.find((p) => p.is_primary_contact)
            ?.international_prefix ?? "+49",
        primary_phone_number:
          profile?.contact.phone_numbers.find((p) => p.is_primary_contact)
            ?.phone_number ?? "",
      },
    };

    if (profile) {
      // Update existing profile
      await b2bStore.updateProfile(profile.b2b, payload);
    } else {
      // Create new profile
      await b2bStore.create(payload);
    }

    logoUrl.value = b2bStore.logoUrl || null;
    logoFile.value = null;
    logoDeleted.value = false;
    isEditMode.value = false;
  } catch (err) {
    console.error("Failed to update B2B profile:", err);
  }
});

const cancelEdit = () => {
  syncFromProfile();
  logoFile.value = null;
  logoDeleted.value = false;
  if (fileInput.value) fileInput.value.value = "";
  isEditMode.value = false;
};

const formatAddressLine1 = () => {
  const a = b2bStore.profile?.address;
  if (!a) return "—";
  return [a.street, a.number].filter(Boolean).join(" ") || "—";
};

const formatAddressLine2 = () => {
  const a = b2bStore.profile?.address;
  if (!a) return "—";
  return [a.zip_code, a.city].filter(Boolean).join(" ") || "—";
};
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#D1DCDC] bg-white shadow-sm">
    <!-- Card header -->
    <div class="flex items-center justify-between border-b border-[#EDF2F2] px-8 py-5">
      <div>
        <h2 class="text-[17px] font-bold text-[#10393B]">Kontodaten</h2>
        <p class="mt-0.5 text-[13px] text-[#7A9699]">
          Unternehmensdaten und Anschrift
        </p>
      </div>

      <button
        v-if="!isEditMode"
        type="button"
        @click="isEditMode = true"
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

    <!-- ════════════════ READ MODE ════════════════ -->
    <div v-if="!isEditMode" class="px-8 py-8">
      <div class="flex flex-col gap-7 lg:flex-row lg:items-start">
        <!-- Logo preview -->
        <div class="shrink-0">
          <div
            class="flex h-[88px] w-[97px] items-center justify-center overflow-hidden rounded-xl border border-[#D1DCDC] bg-[#F8FAFB]"
          >
            <img
              v-if="logoUrl && !logoDeleted"
              :src="logoUrl"
              alt="Firmenlogo"
              class="size-full object-cover"
            />
            <Icon
              v-else
              icon="mdi:image-outline"
              class="size-10 text-[#9CB3B4]"
            />
          </div>
        </div>

        <!-- Data list -->
        <dl class="grid min-w-0 flex-1 grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Firmenname
            </dt>
            <dd class="mt-1.5 text-[15px] font-semibold text-[#10393B]">
              {{ b2bStore.profile?.company_name || "—" }}
            </dd>
          </div>

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              USt-IdNr.
            </dt>
            <dd class="mt-1.5 text-[15px] font-semibold text-[#10393B]">
              {{ b2bStore.profile?.vat_id || "—" }}
            </dd>
          </div>

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Anschrift
            </dt>
            <dd class="mt-1.5 text-[15px] font-semibold leading-relaxed text-[#10393B]">
              {{ formatAddressLine1() }}<br />
              <template v-if="b2bStore.profile?.address?.additional_address">
                {{ b2bStore.profile.address.additional_address }}<br />
              </template>
              {{ formatAddressLine2() }}
            </dd>
          </div>

          <div class="min-w-0">
            <dt class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
              Land
            </dt>
            <dd class="mt-1.5 text-[15px] font-semibold text-[#10393B]">
              {{ b2bStore.profile?.address?.country || "Deutschland" }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- ════════════════ EDIT MODE ════════════════ -->
    <form v-else @submit.prevent="onSubmit">
      <div class="space-y-7 px-8 py-7">
        <!-- Logo + company fields -->
        <div class="flex items-end gap-8">
          <div class="flex shrink-0 flex-col items-start gap-3">
            <div class="relative">
              <div
                class="flex h-[88px] w-[97px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[#D1DCDC] bg-[#F8FAFB] transition-colors hover:bg-[#EDF2F2]"
                @click="triggerLogoUpload"
              >
                <img
                  v-if="logoUrl && !logoDeleted"
                  :key="logoUrl"
                  :src="logoUrl"
                  alt="Firmenlogo"
                  class="size-full object-cover"
                  @error="logoUrl = null"
                />
                <Icon
                  v-else
                  icon="mdi:image-outline"
                  class="size-10 text-[#9CB3B4]"
                />
              </div>

              <button
                v-if="logoUrl && !logoDeleted"
                type="button"
                class="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-white text-red-500 shadow hover:bg-red-50"
                @click.stop="deleteLogo"
              >
                <Icon icon="mdi:close" class="size-3.5" />
              </button>
            </div>
            <span class="text-[13px] text-[#7A9699]">Logo hochladen</span>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png"
              class="hidden"
              @change="onFileChange"
            />
          </div>

          <div class="flex min-w-0 flex-1 gap-[30px]">
            <FormTextField
              name="firmenname"
              label="Firmenname (lt. HGB/Gewerbeeintrag)*"
              placeholder="Firmenname"
              class="min-w-0 flex-1"
            />
            <FormTextField
              name="ustIdNr"
              label="USt-IdNr."
              placeholder="USt-IdNr."
              class="min-w-0 flex-1"
            />
          </div>
        </div>

        <!-- Address divider -->
        <div class="flex items-center gap-3">
          <span class="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
            Anschrift
          </span>
          <span class="h-px flex-1 bg-[#EDF2F2]" />
        </div>
        <p class="mt-1.5! text-[13px] text-[#7A9699]">
          Adresse eingeben oder direkt auf der Karte auswählen.
        </p>

        <div class="flex flex-col gap-6 xl:flex-row">
          <div class="grid min-w-0 flex-1 grid-cols-[2fr_1fr] gap-x-[30px] gap-y-5">
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
              <span class="mb-1.5 text-sm font-semibold text-[#10393B]">Land</span>
              <span class="py-2 text-[15px] font-semibold text-[#10393B]">
                {{ b2bStore.profile?.address.country ?? "Deutschland" }}
              </span>
            </div>
          </div>

          <div
            class="h-[260px] w-full shrink-0 overflow-hidden rounded-2xl border border-[#D1DCDC] xl:w-[380px]"
          >
            <AppMapPicker
              :latitude="null"
              :longitude="null"
              :interactive="true"
              @resolved="onAddressFromMap"
            />
          </div>
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
          {{ isSubmitting ? "Wird gespeichert…" : "Änderungen speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>
