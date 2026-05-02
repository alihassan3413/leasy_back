<script setup lang="ts">
import { useForm } from 'vee-validate'

import Button from '@/components/ui/Button.vue'
import CalendarDateField from '@/components/ui/form/CalendarDateField.vue'
import FormSelectField from '@/components/ui/form/B2CSelectField.vue'

import { paymentMethodSchema } from '@/validations/b2c/paymentMethod.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { PaymentData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{
  submit: []
  back: []
}>()

const store = useB2CRegistrationStore()

const uhrzeitOptions = [
  { value: '10:30', label: '10:30 Uhr' },
  { value: '11:00', label: '11:00 Uhr' },
  { value: '13:30', label: '13:30 Uhr' },
  { value: '15:00', label: '15:00 Uhr' },
]

const { handleSubmit } = useForm<PaymentData>({
  validationSchema: paymentMethodSchema,
  initialValues: store.paymentData,
})

const onSubmit = handleSubmit((values) => {
  Object.assign(store.paymentData, values)

  emit('submit')
})
</script>

<template>
  <div
    class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
  >
    <h2 class="text-[20px] font-bold text-primary">
      Suchen Sie ihre Zahlungsart aus
    </h2>

    <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

    <form
      novalidate
      class="space-y-3"
      @submit.prevent="onSubmit"
    >
      <div class="max-w-85 space-y-3">
        <CalendarDateField
          name="datum"
          label="Datum"
        />

        <FormSelectField
          name="uhrzeit"
          label="Uhrzeit"
          :options="uhrzeitOptions"
        />
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
          @click="emit('back')"
        >
          Abbrechen
        </Button>

        <Button
          type="submit"
          :disabled="store.status === 'loading'"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
        >
          {{ store.status === 'loading' ? 'Wird gespeichert…' : 'Weiter' }}
        </Button>
      </div>
    </form>
  </div>
</template>