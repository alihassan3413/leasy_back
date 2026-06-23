<script setup lang="ts">
import { useField } from "vee-validate";
import FormTextField from "@/components/ui/form/FormTextField.vue";

const { value: hasUstIdNr } = useField<string>("account.hasUstIdNr");
const { value: wantsAbweichendeAdresse } = useField<string>("account.wantsAbweichendeAdresse");
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Kontodaten für Gutschriften
      </h2>

      <div class="w-full h-px bg-green-gray mb-4"></div>

      <div class="w-full space-y-6 mt-4">
        <div class="w-full">
          <!-- Row 1: UST-ID Question + Radio Buttons -->
          <div class="flex items-center justify-between w-full mb-0.5">
            <label
              class="text-sm font-bold text-black leading-normal not-italic"
            >
              Haben Sie eine Umsatzsteuer-Identifikationsnr. (“Ust-IdNr.)
            </label>
            <div class="flex items-center gap-6">
              <div
                class="flex items-center gap-2 cursor-pointer"
                @click="hasUstIdNr = 'ja'"
              >
                <div
                  class="size-4 rounded-full border-2 flex items-center justify-center transition-colors"
                  :class="
                    hasUstIdNr === 'ja'
                      ? 'border-custom-orange'
                      : 'border-black'
                  "
                >
                  <div
                    v-if="hasUstIdNr === 'ja'"
                    class="size-2 rounded-full bg-custom-orange"
                  ></div>
                </div>
                <span class="text-sm font-bold text-black">Ja</span>
              </div>
              <div
                class="flex items-center gap-2 cursor-pointer"
                @click="hasUstIdNr = 'nein'"
              >
                <div
                  class="size-4 rounded-full border-2 flex items-center justify-center transition-colors"
                  :class="
                    hasUstIdNr === 'nein' ? 'border-black' : 'border-black'
                  "
                >
                  <div
                    v-if="hasUstIdNr === 'nein'"
                    class="size-2 rounded-full bg-custom-orange"
                  ></div>
                </div>
                <span class="text-sm font-bold text-black">Nein</span>
              </div>
            </div>
          </div>

          <!-- Row 2: UST-ID Input -->
          <FormTextField
            v-if="hasUstIdNr === 'ja'"
            name="account.ustIdNr"
            placeholder="Umsatzsteuer-Identifikationsnr. (“Ust-IdNr.)"
            class="w-full"
          />
        </div>

        <!-- Row 3: Kontoinhaber -->
        <div class="w-full">
          <FormTextField
            name="account.kontoinhaber"
            label="Kontoinhaber"
            required
            class="w-full"
          />
        </div>

        <!-- Row 4: IBAN & BIC (Grid) -->
        <div class="grid grid-cols-2 gap-4 w-full">
          <FormTextField name="account.iban" label="IBAN" required class="w-full" />
          <FormTextField name="account.bic" label="BIC" required class="w-full" />
        </div>

        <!-- Row 6: Abweichende Adresse Input -->
        <div class="w-full">
          <!-- Row 5: Rechnungsadressierung Question + Radio Buttons -->
          <div class="flex items-center justify-between w-full mb-0.5">
            <label
              class="text-sm font-bold text-black leading-normal not-italic"
            >
              Wünschen Sie eine abweichende Rechnungsadressierung
            </label>
            <div class="flex items-center gap-6">
              <div
                class="flex items-center gap-2 cursor-pointer"
                @click="wantsAbweichendeAdresse = 'ja'"
              >
                <div
                  class="size-4 rounded-full border-2 flex items-center justify-center transition-colors"
                  :class="
                    wantsAbweichendeAdresse === 'ja'
                      ? 'border-custom-orange'
                      : 'border-black'
                  "
                >
                  <div
                    v-if="wantsAbweichendeAdresse === 'ja'"
                    class="size-2 rounded-full bg-custom-orange"
                  ></div>
                </div>
                <span class="text-sm font-bold text-black">Ja</span>
              </div>
              <div
                class="flex items-center gap-2 cursor-pointer"
                @click="wantsAbweichendeAdresse = 'nein'"
              >
                <div
                  class="size-4 rounded-full border-2 flex items-center justify-center transition-colors"
                  :class="
                    wantsAbweichendeAdresse === 'nein'
                      ? 'border-black'
                      : 'border-black'
                  "
                >
                  <div
                    v-if="wantsAbweichendeAdresse === 'nein'"
                    class="size-2 rounded-full bg-custom-orange"
                  ></div>
                </div>
                <span class="text-sm font-bold text-black">Nein</span>
              </div>
            </div>
          </div>

          <!-- Row 6: Abweichende Adresse Input -->
          <FormTextField
            v-if="wantsAbweichendeAdresse === 'ja'"
            name="account.abweichendeAdresse"
            placeholder=""
            required
            class="w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>