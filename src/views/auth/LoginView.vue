<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'

import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/form/TextInput.vue'
import { useAuthStore } from '@/stores/auth.store'
import { loginSchema } from '@/validations/auth/login.schema'
import type { LoginPayload } from '@/types'

interface LoginFormValues {
  email: string
  password: string
}

const authStore = useAuthStore()
const { status, error } = storeToRefs(authStore)
const router = useRouter()

const { handleSubmit, setErrors } = useForm<LoginFormValues>({
  validationSchema: loginSchema,
})

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {  
  const payload: LoginPayload = {
    user_email: values.email,
    password: values.password,
  }

  try {
    await authStore.login(payload)
    void router.push('/')
  } catch (err) {
    const apiError = err as {
      message: string
      errors?: Record<string, string[]>
    }

    if (apiError.errors) {
      setErrors({
        email: apiError.errors.user_email?.[0],
        password: apiError.errors.password?.[0],
      })
    }
  }
})
</script>

<template>
  <!-- for the medium screen  -->
  <div class=" hidden md:flex min-h-[580px] flex-col">
    <p
      class="mx-auto mt-[65px] mb-[100px] max-w-[292px] text-left text-lg font-bold text-primary xl:mt-[91px] xl:mb-[140px] xl:text-xl"
    >
      Hallo! Willkommen zurück!
    </p>

    <div class="flex-1" />

    <div
      v-if="error"
      class="mb-4 rounded-[5px] border border-red-300 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

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
          class=" font-bold text-[14px] text-light-green underline leading-normal  not-italic decoration-solid"
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

  <!-- ── Mobile (below md) ─────────────────────────── -->
  <div class="flex md:hidden  flex-col">
    <div class="mx-auto flex flex-col items-center ">
      <img src="/src/assets/logo/leasyback_logo_mobile.svg" alt="">
    <p
      class="     text-base  font-bold text-black leading-normal not-italic"
    >
      Hallo! Willkommen zurück!
    </p>
    <p class=" mt-px text-black text-[8px] font-bold not-italic leading-normal">Sind Sie ein Werkstett? Melden Sie sich hier mit ihren Zugangsdaten an</p>
    </div>



    <div
      v-if="error"
      class="mb-4 rounded-[5px] border border-red-300 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <form class="space-y-5 mt-20" @submit.prevent="onSubmit">
      <TextInput
        v-model="email"
        label="E-Mail-Adresse"
        for-id="login-email-mobile"
        type="email"
        placeholder="E-Mail-Adresse"
        :error="emailError"
      />

      <div>
        <TextInput
          v-model="password"
          label="Passwort"
          for-id="login-password-mobile"
          type="password"
          placeholder="Passwort"
          :show-password-toggle="true"
          :error="passwordError"
        />

        <RouterLink
          to="/auth/forgot-password"
          class="font-bold text-[14px] text-light-green underline leading-normal not-italic decoration-solid"
        >
          Passwort vergessen?
        </RouterLink>
      </div>

      <div class="pt-20">
        <Button
          type="submit"
          :disabled="status === 'loading'"
          button-classes="w-full rounded-[5px] py-3 text-sm font-bold"
        >
          {{ status === 'loading' ? 'Einloggen…' : 'Einloggen' }}
        </Button>
      </div>
    </form>

    <!-- Mobile only bottom link -->
    <p class="mt-4 text-center text-[10px] text-black  font-normal leading-normal not-italic">
      Sind Sie ein Firmenkunde?
      <RouterLink to="/auth/register" class="text-juicy-ornge text-[10px]  leading-normal not-italic font-normal">
      Zum Firmenkunden-Registration
      </RouterLink>
    </p>

  </div>

</template>