<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'

import Button from '@/components/ui/Button.vue'
import FormTextField from '@/components/ui/form/FormTextField.vue'
import FormSelectField from '@/components/ui/form/B2CSelectField.vue'

import { customerDataSchema } from '@/validations/b2c/customerData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { CustomerData } from '@/stores/b2cRegistration.store'

defineProps<{ loading?: boolean }>()

const emit = defineEmits<{ next: [] }>()

const router = useRouter()
const store = useB2CRegistrationStore()

const anredeOptions = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
]

const landOptions = [
  { value: 'Deutschland', label: 'Deutschland' },
  { value: 'Österreich', label: 'Österreich' },
  { value: 'Schweiz', label: 'Schweiz' },
]

const { handleSubmit } = useForm<CustomerData>({
  validationSchema: customerDataSchema,
  initialValues: { ...store.customerData },
})

const onSubmit = handleSubmit((values) => {
  console.log('Step 1 form values:', values)

  Object.assign(store.customerData, values)

  console.log('Step 1 store after assign:', store.customerData)
  emit('next')
})

function skipOnboarding(): void {
  store.error = ''
  store.status = 'idle'
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div
    class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
  >
    <div>
      <h2 class="text-[20px] font-bold text-primary">
        Kundendaten
      </h2>

      <p class="mt-1 text-sm text-green-gray">
        Bitte ergänzen Sie Ihre Kundendaten oder füllen Sie diese später aus.
      </p>
    </div>

    <div class="mt-3 mb-4 h-px w-full bg-green-gray" />

    <form
      novalidate
      class="space-y-2"
      @submit.prevent="onSubmit"
    >
      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        <FormSelectField
          name="anrede"
          label="Anrede"
          :options="anredeOptions"
        />

        <FormTextField
          name="vorname"
          label="Vorname"
          placeholder="Vorname"
          required
        />

        <FormTextField
          name="nachname"
          label="Nachname"
          placeholder="Nachname"
          required
        />
      </div>

      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_100px_1fr]">
        <FormTextField
          name="strasse"
          label="Straße"
          placeholder="Straße"
          required
        />

        <FormTextField
          name="hausnummer"
          label="Nr."
          placeholder="Nr."
          required
        />

        <FormTextField
          name="zusatz"
          label="Zusätzliche Anschrift"
          placeholder="Adresszusatz"
        />
      </div>

      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-[100px_1fr_1fr]">
        <FormTextField
          name="plz"
          label="PLZ"
          placeholder="PLZ"
          required
        />

        <FormTextField
          name="ort"
          label="Ort"
          placeholder="Ort"
          required
        />

        <FormSelectField
          name="land"
          label="Land"
          :options="landOptions"
        />
      </div>

      <FormTextField
        name="email"
        label="E-Mail-Adresse für Anfragen"
        type="email"
        placeholder="E-Mail-Adresse"
        required
      />

      <div class="mt-6 border-t border-gray-200 pt-5">
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            button-classes="rounded-[5px] py-2 px-8 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
            @click="skipOnboarding"
          >
            Später ausfüllen
          </Button>

          <Button
            type="submit"
            :disabled="loading"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
          >
            {{ loading ? 'Wird gespeichert…' : 'Weiter' }}
          </Button>
        </div>

        <p class="mt-3 text-right text-xs text-green-gray">
          Sie können diese Angaben später im Armaturenbrett ergänzen.
        </p>
      </div>
    </form>
  </div>
</template>