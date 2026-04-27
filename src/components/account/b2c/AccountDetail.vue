<script setup lang="ts">
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";
import profileImage from "../../../assets/logo/B2bProfile-img.svg";

const anredeOptions = [
  { label: "Herr", value: "Herr" },
  { label: "Frau", value: "Frau" },
  { label: "Divers", value: "Divers" },
];
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
        class="text-custom-green transition-opacity hover:opacity-70"
      >
        <Icon icon="mdi:pencil-outline" class="size-6" />
      </button>
    </div>

    <form @submit.prevent="" class="space-y-8">
      <!-- Logo and Company Info Section -->
      <div class="flex justify-between gap-32 items-end">
        <!-- Square Logo Upload -->
        <div class="flex flex-col items-start gap-3">
          <div
            class="flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full"
            
          >
            <!-- <img v-if="" :src="logoUrl" class="size-full object-cover" /> -->
            <img  :src="profileImage" class="size-full object-cover" />
            <!-- <Icon v-else icon="mdi:account" class="size-16 text-green-gray" /> -->
          </div>
          <span
            class="text-base whitespace-nowrap font-normal text-custom-black"
            >Profilbild ändern</span
          >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            
          />
        </div>

        <!-- Company Info Fields -->
        <div class="flex gap-7.5 w-full">
          <FormSelectField
            name="anrede"
            label="Anrede"
            placeholder="Anrede"
            :options="anredeOptions"
            width="w-[128px]"
          />
          <FormTextField
            name=""
            label="Vorname"
            placeholder="Christin"
            class="w-full max-w-95"
          />
          <FormTextField
            name="ustIdNr"
            label="Nachname"
            placeholder="Mechtild"
            class="w-full max-w-95"
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
              placeholder="Sechzig Str"
              class="w-95"
            />
            <FormTextField
              name="address.nr"
              label="Nr."
              placeholder="45"
              class="w-44.5"
            />

            <!-- Row 2: Zusätzliche Anschrift & PLZ -->
            <FormTextField
              name="address.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              placeholder=""
              class="w-95"
            />
            <FormTextField
              name="address.plz"
              label="PLZ"
              placeholder="50733"
              class="w-44.5"
            />

            <!-- Row 3: Ort & Land -->
            <FormTextField
              name="address.ort"
              label="Ort"
              placeholder="Köln"
              class="w-95"
            />
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
                <Icon icon="mdi:map-marker" class="size-10 text-custom-green" />
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
         
        >
        Speichern
          <!-- {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }} -->
        </Button>
      </div>
    </form>
  </div>
</template>
