<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import FormTextField from '@/components/ui/form/FormTextField.vue'
import Button from '@/components/ui/Button.vue'
import { vehicleDataSchema } from '@/validations/b2c/vehicleData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { VehicleData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{ next: []; back: [] }>()

const store = useB2CRegistrationStore()

const { handleSubmit } = useForm<VehicleData>({
  validationSchema: vehicleDataSchema,
  initialValues: store.vehicleData,
})

// Kennzeichen segments need direct field access for the custom 3-input visual
const { value: kennzeichenCity, errorMessage: kennzeichenCityError } = useField<string>('kennzeichenCity')
const { value: kennzeichenLetters, errorMessage: kennzeichenLettersError } = useField<string>('kennzeichenLetters')
const { value: kennzeichenNumbers, errorMessage: kennzeichenNumbersError } = useField<string>('kennzeichenNumbers')

const onSubmit = handleSubmit((values) => {
  Object.assign(store.vehicleData, values)
  emit('next')
})
</script>

<template>
  <div class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6">
    <h2 class="text-[20px] font-bold text-primary">Fahrzeugdaten</h2>
    <div class="mt-2 mb-3 h-px w-full bg-green-gray" />

    <form novalidate @submit.prevent="onSubmit">
      <!-- Form fields: ~half card width, left-aligned (per Figma 308/670) -->
      <div class="max-w-[340px] space-y-2">
        <!-- 1. Kennzeichen -->
        <div>
          <p class="mb-1.5 text-sm font-bold text-primary">
            Kennzeichen
            <span class="ml-1 text-[10px] font-normal text-green-gray">
              *(Format: ABC DE 1234)
            </span>
          </p>

          <div class="flex items-stretch rounded-[5px] border border-green-gray">
            <!-- Germany badge -->
            <div class="flex h-[34px] w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-[5px] bg-primary py-1">
              <div class="flex flex-col overflow-hidden rounded-sm" style="width:18px;height:12px">
                <div style="flex:1;background:#000"></div>
                <div style="flex:1;background:#D00"></div>
                <div style="flex:1;background:#FFCE00"></div>
              </div>
              <span class="text-[9px] font-bold leading-none text-white">D</span>
            </div>

            <input
              v-model="kennzeichenCity"
              type="text"
              placeholder="ABC"
              maxlength="3"
              class="h-[34px] w-0 flex-1 border-x border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
              :class="kennzeichenCityError ? 'border-red-400 bg-red-50' : ''"
            >
            <input
              v-model="kennzeichenLetters"
              type="text"
              placeholder="DE"
              maxlength="2"
              class="h-[34px] w-0 flex-1 border-r border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
              :class="kennzeichenLettersError ? 'border-red-400 bg-red-50' : ''"
            >
            <input
              v-model="kennzeichenNumbers"
              type="text"
              placeholder="1234"
              maxlength="5"
              class="h-[34px] w-0 flex-1 border-r border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
              :class="kennzeichenNumbersError ? 'border-red-400 bg-red-50' : ''"
            >

            <!-- Plakette -->
            <div class="flex h-[34px] w-9 shrink-0 items-center justify-center rounded-r-[5px] bg-white">
              <div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary">
                <span class="text-[7px] font-bold leading-none text-primary">TÜV</span>
              </div>
            </div>
          </div>

          <p
            v-if="kennzeichenCityError || kennzeichenLettersError || kennzeichenNumbersError"
            class="mt-1 text-xs text-red-500"
          >
            {{ kennzeichenCityError || kennzeichenLettersError || kennzeichenNumbersError }}
          </p>
        </div>

        <!-- 2. Erstzulassungsdatum -->
        <FormTextField
          name="erstzulassungsdatum"
          label="Erstzulassungsdatum"
          help-text="*(seh. Fahrzeugschein)"
          type="date"
        />

        <!-- 3. Leasingende -->
        <FormTextField
          name="leasingende"
          label="Leasingende"
          help-text="*(seh. Leasingvertrag)"
          type="date"
        />

        <!-- 4. FIN -->
        <FormTextField
          name="fin"
          label="FIN"
          help-text="*(seh. Fahrzeugschein Mitte oben)"
          placeholder="Fahrzeugidentifikationsnummer"
        />

        <!-- 5. Marke -->
        <FormTextField name="marke" label="Marke" placeholder="z.B. BMW" />

        <!-- 6. Modell -->
        <FormTextField name="modell" label="Modell" placeholder="z.B. 3er" />
      </div>

      <!-- Buttons: right-aligned, 150px each, at bottom (per Figma) -->
      <div class="flex justify-end gap-3 pt-6">
        <Button
          type="button"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
          @click="emit('back')"
        >
          Abbrechen
        </Button>

        <Button
          type="submit"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
        >
          Weiter
        </Button>
      </div>
    </form>
  </div>
</template>
