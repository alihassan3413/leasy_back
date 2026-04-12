<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/form/TextInput.vue'
import { useAuth } from '@/composables/useAuth'

interface LoginFormValues {
  user_email: string
  password: string
}

// ── Composable (IMPORTANT) ──
const { login, status, error } = useAuth()

// ── Validation ──
const schema = yup.object({
  user_email: yup
    .string()
    .email('Bitte gültige E-Mail eingeben')
    .required('E-Mail ist erforderlich'),

  password: yup
    .string()
    .min(8, 'Mindestens 8 Zeichen')
    .required('Passwort ist erforderlich'),
})

const { handleSubmit, setErrors } = useForm<LoginFormValues>({
  validationSchema: schema,
})

const { value: email, errorMessage: emailError } = useField<string>('user_email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

// ── Submit ──
const onSubmit = handleSubmit(async (values) => {
  try {
    await login(values) // ✅ clean (mapping already handled in API)
  } catch (err) {
    const apiError = err as {
      message: string
      errors?: Record<string, string[]>
    }

    if (apiError.errors) {
      setErrors({
        user_email: apiError.errors.user_email?.[0],
        password: apiError.errors.password?.[0],
      })
    }
  }
})
</script>
<template>
  <div class="flex min-h-[580px] flex-col">

    <!-- Title -->
    <p
      class="mx-auto mt-[65px] mb-[100px] max-w-[292px] text-left text-lg font-bold text-primary xl:mt-[91px] xl:mb-[140px] xl:text-xl"
    >
      Hallo! Willkommen zurück!
    </p>

    <div class="flex-1" />

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 rounded-[5px] border border-red-300 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <!-- Form -->
    <form class="space-y-5" @submit.prevent="onSubmit">

      <TextInput
        v-model="email"
        label="E-Mail-Adresse"
        for-id="login-email"
        type="email"
        placeholder="E-Mail-Adresse"
        :error="emailError"
      />

      <div>
        <TextInput
          v-model="password"
          label="Passwort"
          for-id="login-password"
          type="password"
          placeholder="Passwort"
          :show-password-toggle="true"
          :error="passwordError"
        />

        <p class="mt-1.5 text-xs text-green-gray">
          Min. 8 Zeichen, mind. 1 Großbuchstabe, mind. 1 Sonderzeichen
        </p>

        <RouterLink
          to="/auth/forgot-password"
          class="mt-1 block text-xs text-custom-green"
        >
          Passwort vergessen?
        </RouterLink>
      </div>

      <div class="pt-6">
        <Button
          type="submit"
          :disabled="status === 'loading'"
          button-classes="w-full rounded-[5px] py-3 text-sm font-bold"
        >
          {{ status === 'loading' ? 'Einloggen…' : 'Einloggen' }}
        </Button>
      </div>
    </form>

    <p class="mt-5 text-center text-sm text-custom-black">
      Sind Sie noch kein Kunde bei uns?
      <RouterLink to="/auth/register" class="text-custom-orange">
        Hier registrieren
      </RouterLink>
    </p>
  </div>
</template>