<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import DropDown from '@/components/ui/form/DropDown.vue'
import TextInput from '@/components/ui/form/TextInput.vue'
import Button from '@/components/ui/Button.vue'
import ProgressBar from './ProgressBar.vue'
import { customerDataSchema } from '@/validations/b2c/customerData.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { CustomerData } from '@/stores/b2cRegistration.store'

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

const { value: anrede, errorMessage: anredeError } = useField<string>('anrede')
const { value: vorname, errorMessage: vornameError } = useField<string>('vorname')
const { value: nachname, errorMessage: nachnameError } = useField<string>('nachname')
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: strasse, errorMessage: strasseError } = useField<string>('strasse')
const { value: hausnummer, errorMessage: hausnummerError } = useField<string>('hausnummer')
const { value: zusatz } = useField<string>('zusatz')
const { value: plz, errorMessage: plzError } = useField<string>('plz')
const { value: ort, errorMessage: ortError } = useField<string>('ort')
const { value: land, errorMessage: landError } = useField<string>('land')

const onSubmit = handleSubmit((values) => {
  Object.assign(store.customerData, values)
  emit('next')
})
</script>

<template>
  <div class="w-full max-w-[520px] rounded-[10px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
    <ProgressBar :current-step="1" />

    <h2 class="mb-6 text-xl font-bold text-primary">
      Kundendaten
    </h2>

    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <DropDown
        v-model="anrede"
        label="Anrede"
        for-id="anrede"
        :options="anredeOptions"
        :error="anredeError"
      />

      <div class="grid grid-cols-2 gap-4">
        <TextInput
          v-model="vorname"
          label="Vorname*"
          for-id="vorname"
          placeholder="Vorname"
          :error="vornameError"
        />
        <TextInput
          v-model="nachname"
          label="Nachname*"
          for-id="nachname"
          placeholder="Nachname"
          :error="nachnameError"
        />
      </div>

      <TextInput
        v-model="email"
        label="E-Mail-Adresse für Anfragen*"
        for-id="b2c-email"
        type="email"
        placeholder="E-Mail-Adresse"
        :error="emailError"
      />

      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2">
          <TextInput
            v-model="strasse"
            label="Straße*"
            for-id="strasse"
            placeholder="Straße"
            :error="strasseError"
          />
        </div>
        <TextInput
          v-model="hausnummer"
          label="Nr.*"
          for-id="hausnummer"
          placeholder="Nr."
          :error="hausnummerError"
        />
      </div>

      <TextInput
        v-model="zusatz"
        label="Zusätzliche Anschrift"
        for-id="zusatz"
        placeholder="Adresszusatz (optional)"
      />

      <div class="grid grid-cols-2 gap-4">
        <TextInput
          v-model="plz"
          label="PLZ*"
          for-id="plz"
          placeholder="PLZ"
          :error="plzError"
        />
        <TextInput
          v-model="ort"
          label="Ort*"
          for-id="ort"
          placeholder="Ort"
          :error="ortError"
        />
      </div>

      <DropDown
        v-model="land"
        label="Land"
        for-id="land"
        :options="landOptions"
        :error="landError"
      />

      <div class="flex gap-3 pt-4">
        <RouterLink to="/auth/register">
          <Button
            type="button"
            button-classes="rounded-[5px] py-3 px-6 text-sm font-bold bg-custom-orange text-white hover:opacity-90"
          >
            Zurück
          </Button>
        </RouterLink>

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
