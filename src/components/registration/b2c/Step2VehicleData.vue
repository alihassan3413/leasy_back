<script setup lang="ts">
import { useForm } from 'vee-validate'

import Button from '@/components/ui/Button.vue'
import FormTextField from '@/components/ui/form/FormTextField.vue'
import FormSelectField from '@/components/ui/form/B2CSelectField.vue'
import LicensePlateField from '@/components/ui/form/LicensePlateField.vue'
import CalendarDateField from '@/components/ui/form/CalendarDateField.vue'

import { vehicleDataSchema } from '@/validations/b2c/vehicleData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { VehicleData } from '@/stores/b2cRegistration.store'
import { useVehicleStore } from '@/stores/vehicle.store'

const emit = defineEmits<{
  next: []
  back: []
}>()

const store = useB2CRegistrationStore();
const vehicleStore = useVehicleStore();

const { handleSubmit } = useForm<VehicleData>({
  validationSchema: vehicleDataSchema,
  initialValues: { ...store.vehicleData },
})

const onSubmit = handleSubmit( async(values) => {
  Object.assign(store.vehicleData, values)

  const licensePlate = [
    values.kennzeichenCity,
    values.kennzeichenLetters,
    values.kennzeichenNumbers,
  ]
  .filter(Boolean)
  .join(' ')

  try {
    await vehicleStore.addVehicle({
      license_plate: licensePlate,
      first_registration_date: values.erstzulassungsdatum,
      leasing_end_date: values.leasingende,
      vin: values.fin,
      make: values.marke,
      model: values.modell,
    })
     emit('next')
  } catch (error) {
    console.error('Error adding vehicle:', error)
  }
 
})
</script>

<template>
  <div
    class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
  >
    <h2 class="text-[20px] font-bold text-primary">
      Fahrzeugdaten
    </h2>

    <div class="mt-2 mb-3 h-px w-full bg-green-gray" />

    <form
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="max-w-85 space-y-2">
        <LicensePlateField
          city-name="kennzeichenCity"
          letters-name="kennzeichenLetters"
          numbers-name="kennzeichenNumbers"
        />

        <CalendarDateField
          name="erstzulassungsdatum"
          label="Erstzulassungsdatum"
          help-text="*(seh. Fahrzeugschein)"
        />

        <CalendarDateField
          name="leasingende"
          label="Leasingende"
          help-text="*(seh. Leasingvertrag)"
        />

        <FormTextField
          name="fin"
          label="FIN"
          help-text="*(seh. Fahrzeugschein Mitte oben)"
          placeholder="Fahrzeugidentifikationsnummer"
        />

        <FormSelectField
          name="marke"
          label="Marke"
          :options="[
            { label: 'VW', value: 'VW' },
            { label: 'BMW', value: 'BMW' },
            { label: 'Mercedes', value: 'Mercedes' },
            { label: 'Audi', value: 'Audi' },
            { label: 'Renault', value: 'Renault' },
            { label: 'Toyota', value: 'Toyota' },
            { label: 'Peugeot', value: 'Peugeot' },
            { label: 'Skoda', value: 'Skoda' },
            { label: 'Ford', value: 'Ford' },
            { label: 'Opel', value: 'Opel' },
            { label: 'Sonstige', value: 'Sonstige' },
          ]"
        />

        <FormTextField
          name="modell"
          label="Modell"
          placeholder="z.B. 3er oder Sonstige"
        />
      </div>

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