<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import TextInput from '@/components/ui/form/TextInput.vue'
import Button from '@/components/ui/Button.vue'
import ProgressBar from './ProgressBar.vue'
import { vehicleDataSchema } from '@/validations/b2c/vehicleData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { VehicleData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{ next: []; back: [] }>()

const store = useB2CRegistrationStore()

const { handleSubmit } = useForm<VehicleData>({
  validationSchema: vehicleDataSchema,
  initialValues: store.vehicleData,
})

const { value: marke, errorMessage: markeError } = useField<string>('marke')
const { value: modell, errorMessage: modellError } = useField<string>('modell')
const { value: fin, errorMessage: finError } = useField<string>('fin')
const { value: erstzulassungsdatum, errorMessage: erstzulassungsdatumError } = useField<string>('erstzulassungsdatum')
const { value: leasingende, errorMessage: leasingendeError } = useField<string>('leasingende')
const { value: kennzeichenCity, errorMessage: kennzeichenCityError } = useField<string>('kennzeichenCity')
const { value: kennzeichenLetters, errorMessage: kennzeichenLettersError } = useField<string>('kennzeichenLetters')
const { value: kennzeichenNumbers, errorMessage: kennzeichenNumbersError } = useField<string>('kennzeichenNumbers')

const onSubmit = handleSubmit((values) => {
  Object.assign(store.vehicleData, values)
  emit('next')
})
</script>

<template>
  <div class="w-full max-w-[520px] rounded-[10px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
    <ProgressBar :current-step="2" />

    <h2 class="mb-6 text-xl font-bold text-primary">
      Fahrzeugdaten
    </h2>

    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-4">
        <TextInput
          v-model="marke"
          label="Marke"
          for-id="marke"
          placeholder="z.B. BMW"
          :error="markeError"
        />
        <TextInput
          v-model="modell"
          label="Modell"
          for-id="modell"
          placeholder="z.B. 3er"
          :error="modellError"
        />
      </div>

      <div>
        <TextInput
          v-model="fin"
          label="FIN"
          for-id="fin"
          placeholder="Fahrzeugidentifikationsnummer"
          :error="finError"
        />
        <p class="mt-1 text-xs text-green-gray">*(seh. Fahrzeugschein Mitte oben)</p>
      </div>

      <div>
        <TextInput
          v-model="erstzulassungsdatum"
          label="Erstzulassungsdatum"
          for-id="erstzulassungsdatum"
          type="date"
          :error="erstzulassungsdatumError"
        />
        <p class="mt-1 text-xs text-green-gray">*(seh. Fahrzeugschein)</p>
      </div>

      <div>
        <TextInput
          v-model="leasingende"
          label="Leasingende"
          for-id="leasingende"
          type="date"
          :error="leasingendeError"
        />
        <p class="mt-1 text-xs text-green-gray">*(seh. Leasingvertrag)</p>
      </div>

      <!-- Kennzeichen -->
      <div>
        <p class="mb-1.5 text-sm font-medium text-primary">Kennzeichen</p>
        <p class="mb-2 text-xs text-green-gray">*(Format: ABC DE 1234)</p>

        <div class="flex items-center gap-0 overflow-hidden rounded-[5px] border border-green-gray">
          <!-- Germany flag badge -->
          <div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center bg-primary">
            <div class="flex items-center gap-0.5">
              <span class="h-2 w-3 bg-black" />
              <span class="h-2 w-3 bg-red-600" />
              <span class="h-2 w-3 bg-yellow-400" />
            </div>
            <span class="mt-0.5 text-[9px] font-bold text-white leading-none">D</span>
          </div>

          <input
            v-model="kennzeichenCity"
            type="text"
            placeholder="ABC"
            maxlength="3"
            class="h-10 flex-1 border-x border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
            :class="kennzeichenCityError ? 'border-red-400 bg-red-50' : ''"
          >
          <input
            v-model="kennzeichenLetters"
            type="text"
            placeholder="DE"
            maxlength="2"
            class="h-10 flex-1 border-r border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
            :class="kennzeichenLettersError ? 'border-red-400 bg-red-50' : ''"
          >
          <input
            v-model="kennzeichenNumbers"
            type="text"
            placeholder="1234"
            maxlength="5"
            class="h-10 flex-1 bg-white px-2 text-center text-sm font-medium uppercase outline-none"
            :class="kennzeichenNumbersError ? 'border-red-400 bg-red-50' : ''"
          >

          <!-- Plakette -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center border-l border-green-gray bg-white">
            <div class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary">
              <span class="text-[8px] font-bold text-primary leading-none">TÜV</span>
            </div>
          </div>
        </div>

        <p v-if="kennzeichenCityError || kennzeichenLettersError || kennzeichenNumbersError" class="mt-1 text-xs text-red-500">
          {{ kennzeichenCityError || kennzeichenLettersError || kennzeichenNumbersError }}
        </p>
      </div>

      <div class="flex gap-3 pt-4">
        <Button
          type="button"
          button-classes="rounded-[5px] py-3 px-6 text-sm font-bold bg-custom-orange text-white hover:opacity-90"
          @click="emit('back')"
        >
          Zurück
        </Button>

        <Button
          type="submit"
          button-classes="flex-1 rounded-[5px] py-3 text-sm font-bold bg-custom-green text-white hover:opacity-90"
        >
          Weiter
        </Button>
      </div>
    </form>
  </div>
</template>
