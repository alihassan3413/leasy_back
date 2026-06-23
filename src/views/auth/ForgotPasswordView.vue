<script setup lang="ts">
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/form/TextInput.vue'

const emailSent = ref(false)
const submittedEmail = ref('')

const schema = yup.object({
  email: yup.string().email('Bitte gültige E-Mail eingeben').required('E-Mail ist erforderlich'),
})

const { handleSubmit } = useForm({
  validationSchema: schema,
})

const { value: email, errorMessage: emailError } = useField<string>('email')

const onSubmit = handleSubmit(async (values) => {
  // simulate API
  await new Promise((r) => setTimeout(r, 800))

  submittedEmail.value = values.email
  emailSent.value = true
})
</script>

<template>
  <div class="flex py-8 flex-col">

    <p
      class="mx-auto max-w-[292px] my-8 text-left text-lg font-bold text-primary xl:text-xl"
    >
      Passwort zurücksetzen
    </p>
    
    <form class="space-y-2" @submit.prevent="onSubmit">
      <TextInput
        v-model="email"
        label="E-Mail-Adresse"
        for-id="forgot-email"
        type="email"
        placeholder="E-Mail-Adresse"
        :error="emailError"
      />

      <p class="text-xs text-green-gray">
        Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Reset-Link.
      </p>

      <div class="pt-4">
        <Button
          type="submit"
          button-classes="w-full rounded-[5px] py-3 text-sm font-bold"
        >
          Reset-Link senden
        </Button>
      </div>

      <div class="text-center">
        <RouterLink
          to="/auth/login"
          class="text-[14px] font-bold text-custom-green underline decoration-[1.12px] underline-offset-[2.8px]"
        >
          Zurück zum Login
        </RouterLink>
      </div>
    </form>
  </div>
</template>