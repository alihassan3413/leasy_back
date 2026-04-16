<script setup lang="ts">
import FormTextField from "@/components/ui/form/FormTextField.vue";
import FormSelectField from "@/components/ui/form/FormSelectField.vue";

const internatOptions = [
  { label: "Deutschland + (49)", value: "de" },
  { label: "Österreich + (43)", value: "at" },
  { label: "Schweiz + (41)", value: "ch" },
];
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Adressdaten (Standort der Werkstatt)
      </h2>

      <div class="w-full h-px bg-green-gray mb-4"></div>

      <div class="w-full space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormTextField
            name="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)"
            placeholder="HWT GmbH"
            required
          />
          <FormTextField
            name="email"
            label="E-Mail-Adresse"
            placeholder="info@hwt-gmbh.de"
            required
          />
        </div>

        <div class="grid grid-cols-[2fr_100px] gap-3">
          <FormTextField
            name="address.strasse"
            label="Straße (kein Postfach)"
            required
          />

          <FormTextField name="address.nr" label="Nr." required />
        </div>

        <div>
          <FormTextField
            name="address.zusaetzlicheAnschrift"
            label="Adresszusatz (z.B. Etage)"
          />
        </div>

        <div class="grid grid-cols-[100px_1fr_1fr] gap-3 items-end">
          <FormTextField name="address.plz" label="PLZ" required />

          <FormTextField name="address.ort" label="Ort" required />

          <div class="flex flex-col gap-0.5">
            <span
              class="text-sm font-bold leading-normal not-italic text-black"
            >
              Land
            </span>
            <span
              class="text-sm text-black font-normal leading-normal not-italic h-8 flex items-center"
            >
              Deutschland
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-0.5 mt-2.5">
          <span class="text-black text-sm font-bold leading-normal not-italic">
            Laden Sie Ihr Logo hoch
          </span>

          <label
            class="border border-dashed border-green-gray bg-white rounded-[5px] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-custom-turquoise transition-colors"
            @dragover.prevent
          >
            <input type="file" class="hidden" accept=".pdf,.jpg,.png" />

            <p class="text-center">
              <span
                class="text-primary text-sm font-bold leading-normal not-italic"
              >
                Datei hierher ziehen oder zum <br />
                Hochladen
                <span
                  class="text-custom-green text-sm font-bold leading-normal not-italic underline"
                >
                  durchsuchen
                </span>
              </span>
              <br />
              <span
                class="text-custom-black text-[12px] tracking-[1px] font-normal leading-normal not-italic block"
              >
                PDF, JPG oder PNG • 8MB max
              </span>
            </p>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
