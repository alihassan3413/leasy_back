<script setup lang="ts">
import { useForm } from 'vee-validate'
import FormTextField from '@/components/ui/form/FormTextField.vue'
import FormSelectField from '@/components/ui/form/FormSelectField.vue'
import Button from '@/components/ui/Button.vue'
import { customerDataSchema } from '@/validations/b2c/customerData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { CustomerData } from '@/stores/b2cRegistration.store'

defineProps<{ loading?: boolean }>()
const emit = defineEmits<{ next: [] }>()

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
  initialValues: store.customerData,
})

const onSubmit = handleSubmit((values) => {
  Object.assign(store.customerData, values)
  emit('next')
})
</script>

<template>
  <div class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6">
    <!-- Inner card header -->
    <h2 class="text-[20px] font-bold text-primary">Kundendaten</h2>
    <div class="mt-2 mb-3 h-px w-full bg-green-gray" />

    <form novalidate @submit.prevent="onSubmit" class="space-y-2">
      <!-- Row 1: Anrede / Vorname / Nachname -->
      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        <FormSelectField name="anrede" label="Anrede" :options="anredeOptions" />
        <FormTextField name="vorname" label="Vorname" placeholder="Vorname" required />
        <FormTextField name="nachname" label="Nachname" placeholder="Nachname" required />
      </div>

      <!-- Row 2: Straße (large) / Nr. (small) / Zusätzliche Anschrift -->
      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_100px_1fr]">
        <FormTextField name="strasse" label="Straße" placeholder="Straße" required />
        <FormTextField name="hausnummer" label="Nr." placeholder="Nr." required />
        <FormTextField name="zusatz" label="Zusätzliche Anschrift" placeholder="Adresszusatz" />
      </div>

      <!-- Row 3: PLZ (small) / Ort / Land (static text "Deutschland") -->
      <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-[100px_1fr_1fr]">
        <FormTextField name="plz" label="PLZ" placeholder="PLZ" required />
        <FormTextField name="ort" label="Ort" placeholder="Ort" required />
        <FormSelectField name="land" label="Land" :options="landOptions" />
      </div>

      <!-- Row 4: E-Mail full width -->
      <FormTextField
        name="email"
        label="E-Mail-Adresse für Anfragen"
        type="email"
        placeholder="E-Mail-Adresse"
        required
      />

      <!-- Buttons right-aligned -->
      <div class="flex justify-end gap-3 pt-4">
        <RouterLink to="/auth/register">
          <Button
            type="button"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
          >
            Zurück
          </Button>
        </RouterLink>

        <Button
          type="submit"
          :disabled="loading"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
        >
          {{ loading ? 'Wird gespeichert…' : 'Weiter' }}
        </Button>
      </div>
    </form>
  </div>
</template>
