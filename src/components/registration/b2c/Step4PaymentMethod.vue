<script setup lang="ts">
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import DropDown from '@/components/ui/form/DropDown.vue'
import TextInput from '@/components/ui/form/TextInput.vue'
import Button from '@/components/ui/Button.vue'
import ProgressBar from './ProgressBar.vue'
import { paymentMethodSchema } from '@/validations/b2c/paymentMethod.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { PaymentData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{ submit: []; back: [] }>()

const store = useB2CRegistrationStore()

const zahlungsartOptions = [
  { value: 'sepa', label: 'SEPA-Lastschrift' },
  { value: 'kreditkarte', label: 'Kreditkarte' },
  { value: 'paypal', label: 'PayPal' },
]

const { handleSubmit } = useForm<PaymentData>({
  validationSchema: paymentMethodSchema,
  initialValues: store.paymentData,
})

const { value: zahlungsart, errorMessage: zahlungsartError } = useField<string>('zahlungsart')
const { value: iban, errorMessage: ibanError } = useField<string>('iban')
const { value: kontoinhaber, errorMessage: kontoinhaberError } = useField<string>('kontoinhaber')

const showSepaFields = computed(() => zahlungsart.value === 'sepa')

const onSubmit = handleSubmit((values) => {
  Object.assign(store.paymentData, values)
  emit('submit')
})
</script>

<template>
  <div class="w-full max-w-[520px] rounded-[10px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
    <ProgressBar :current-step="4" />

    <h2 class="mb-2 text-xl font-bold text-primary">
      Zahlungsmethode hinzufügen
    </h2>
    <p class="mb-6 text-sm text-green-gray">
      Suchen Sie ihre Zahlungsart aus
    </p>

    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <DropDown
        v-model="zahlungsart"
        label="Zahlungsart"
        for-id="zahlungsart"
        :options="zahlungsartOptions"
        :error="zahlungsartError"
      />

      <template v-if="showSepaFields">
        <TextInput
          v-model="iban"
          label="IBAN"
          for-id="iban"
          placeholder="DE00 0000 0000 0000 0000 00"
          :error="ibanError"
        />
        <TextInput
          v-model="kontoinhaber"
          label="Kontoinhaber"
          for-id="kontoinhaber"
          placeholder="Vor- und Nachname"
          :error="kontoinhaberError"
        />
      </template>

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
          :disabled="store.status === 'loading'"
          button-classes="flex-1 rounded-[5px] py-3 text-sm font-bold bg-custom-green text-white hover:opacity-90"
        >
          {{ store.status === 'loading' ? 'Wird gespeichert…' : 'Registrierung abschließen' }}
        </Button>
      </div>
    </form>
  </div>
</template>
