<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import { useWorkshopStore } from "@/stores/workshop.store";
import { addressSchema } from "@/validations/workshop.validation";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";

const workshopStore = useWorkshopStore();

const { handleSubmit, isSubmitting, setValues, errors } = useForm({
  validationSchema: addressSchema,
  initialValues: {
    firmenname: "",
    ustIdNr: "",
    address: {
      strasse: "",
      nr: "",
      zusaetzlicheAnschrift: "",
      plz: "",
      ort: "",
      land: "Deutschland",
    },
  },
});

// Watch for store profile changes and update form
watch(
  () => workshopStore.profile,
  (newProfile) => {
    if (newProfile) {
      setValues({
        firmenname: newProfile.workshop_name,
        ustIdNr: newProfile.vat_id || "",
        address: {
          strasse: newProfile.address.street,
          nr: newProfile.address.number,
          zusaetzlicheAnschrift: newProfile.address.additional_address || "",
          plz: newProfile.address.zip_code,
          ort: newProfile.address.city,
          land: newProfile.address.country,
        },
      });
      if (newProfile.logo_url) {
        logoUrl.value = newProfile.logo_url;
      }
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  console.log("Submitting account detail...", values);
  if (!workshopStore.profile?.workshop_id) {
    console.error("No workshop ID found");
    return;
  }

  try {
    const payload = {
      workshop_name: values.firmenname,
      vat_id: values.ustIdNr,
      address: {
        street: values.address.strasse,
        number: values.address.nr,
        additional_address: values.address.zusaetzlicheAnschrift,
        zip_code: values.address.plz,
        city: values.address.ort,
        country: values.address.land,
      },
    };

    console.log("Update Payload:", payload);
    await workshopStore.updateWorkshop(
      workshopStore.profile.workshop_id,
      payload,
    );
    alert("Kontodaten erfolgreich aktualisiert");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Fehler beim Aktualisieren");
  }
}, (invalid) => {
  console.error("Validation failed in AccountDetail:", invalid.errors);
});

const logoUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerLogoUpload = () => {
  fileInput.value?.click();
};

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    logoUrl.value = URL.createObjectURL(file);
  }
};
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white px-10 pt-5">
    <!-- Header with Pencil Icon -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-color-primary">Kontodaten</h2>
      <button
        type="button"
        class="text-custom-green transition-opacity hover:opacity-70"
      >
        <Icon icon="mdi:pencil-outline" class="size-6" />
      </button>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-8">
      <!-- Logo and Company Info Section -->
      <div class="flex justify-between gap-8 items-end">
        <!-- Square Logo Upload -->
        <div class="flex flex-col items-start gap-3">
          <div
            class="flex w-[97px] h-[88px] cursor-pointer items-center justify-center overflow-hidden rounded-lg
            border border-[#D9E2E2] bg-custom-gray transition-colors hover:bg-[#F0F2F2]"
            @click="triggerLogoUpload"
          >
            <img v-if="logoUrl" :src="logoUrl" class="size-full object-cover" />
            <Icon
              v-else
              icon="mdi:image-outline"
              class="size-16 text-green-gray"
            />
          </div>
          <span class="text-base font-normal text-custom-black">Laden Sie ihr Logo auf</span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />
        </div>

        <!-- Company Info Fields -->
        <div class="flex gap-7.5">
          <FormTextField
            name="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)*"
            placeholder="HWT GmbH"
            class="w-95"
          />
          <FormTextField
            name="ustIdNr"
            label="USt-IdNr."
            placeholder="DE 127395564"
            class="w-95"
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
          <div class="grid flex-1 grid-cols-[2fr_1fr] gap-x-7.5 gap-y-3 lg:max-w-137.5">
            <!-- Row 1: Straße & Nr -->
            <FormTextField
              name="address.strasse"
              label="Straße"
              placeholder="Sechzig Str"
              class="w-95"
            />
            <FormTextField name="address.nr" label="Nr." placeholder="45" class="w-44.5" />

            <!-- Row 2: Zusätzliche Anschrift & PLZ -->
            <FormTextField
              name="address.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              placeholder=""
              class="w-95"
            />
            <FormTextField name="address.plz" label="PLZ" placeholder="50733" class="w-44.5" />

            <!-- Row 3: Ort & Land -->
            <FormTextField name="address.ort" label="Ort" placeholder="Köln" class="w-95" />
            <div class="flex flex-col">
              <span class="mb-1.5 text-sm font-bold text-black">Land</span>
              <span class="py-2 text-[15px] font-medium text-[#10393B]">
                Deutschland
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
                <Icon icon="mdi:map-marker" class="size-10 text-[#01B990]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end mb-7.5">
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
