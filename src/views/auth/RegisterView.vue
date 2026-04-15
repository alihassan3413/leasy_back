<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import Button from '@/components/ui/Button.vue'
import DropDown from '@/components/ui/form/DropDown.vue'
import TextInput from '@/components/ui/form/TextInput.vue'
import { registerSchema } from '@/validations/auth/register.schema'
import { useAuthStore } from '@/stores/auth.store'
import type { RegisterPayload, RegisterUserType } from '@/types'

const authStore = useAuthStore()
const { status, error } = storeToRefs(authStore)
const router = useRouter()

const roleOptions: { value: RegisterUserType; label: string }[] = [
  { value: 'Privatkunde', label: 'Privatkunde' },
  { value: 'Firmenkunde', label: 'Firmenkunde' },
  { value: 'Werksatatt', label: 'Werkstatt' },
]

interface RegisterFormValues {
  role: string
  email: string
  password: string
}

const { handleSubmit, setErrors } = useForm<RegisterFormValues>({
  validationSchema: registerSchema,
})

const { value: role, errorMessage: roleError } = useField<string>('role')
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const showSuccess = ref(false)

const onSubmit = handleSubmit(async (values) => {
  // B2C (Privatkunde): redirect to the multi-step B2C registration flow
  if (values.role === 'Privatkunde') {
    void router.push('/register/b2c')
    return
  }

  const payload: RegisterPayload = {
    user_email: values.email,
    password: values.password,
    user_type: values.role as RegisterUserType,
  }

  try {
    await authStore.register(payload)
    showSuccess.value = true
  } catch (err) {
    const apiError = err as {
      message: string
      errors?: Record<string, string[]>
    }

    if (apiError.errors) {
      setErrors({
        role: apiError.errors.user_type?.[0],
        email: apiError.errors.user_email?.[0],
        password: apiError.errors.password?.[0],
      })
    }
  }
})

const onSuccessOk = (): void => {
  showSuccess.value = false
  void router.push('/auth/login')
}
</script>

<template>
  <div class="flex min-h-[580px] flex-col">
    <p
      class="mx-auto mt-[65px] mb-[100px] max-w-[292px] text-left text-lg leading-normal font-bold text-primary xl:mt-[91px] xl:mb-[140px] xl:text-xl"
    >
      Sie können sich als Werkstatt, als Firmenkunde oder auch als Privatkunde
      registrieren
    </p>

    <div class="flex-1" />

    <div
      v-if="error"
      class="mb-4 rounded-[5px] border border-red-300 bg-red-50 p-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <form
      novalidate
      class="space-y-5"
      @submit.prevent="onSubmit"
    >
      <DropDown
        v-model="role"
        label="Jetzt registrieren als"
        for-id="role"
        :options="roleOptions"
        :error="roleError"
      />

      <TextInput
        v-model="email"
        label="E-Mail-Adresse"
        for-id="reg-email"
        type="email"
        placeholder="E-Mail-Adresse"
        :error="emailError"
      />

      <div>
        <TextInput
          v-model="password"
          label="Passwort"
          for-id="reg-password"
          type="password"
          placeholder="Passwort"
          :show-password-toggle="true"
          :error="passwordError"
        />

        <p class="mt-1.5 text-xs text-green-gray">
          Min. 8 Zeichen, mind. 1 Großbuchstabe, mind. 1 Sonderzeichen
        </p>
      </div>

      <div class="pt-6">
        <Button
          type="submit"
          :disabled="status === 'loading'"
          button-classes="w-full rounded-[5px] py-3 text-sm font-bold"
        >
          {{ status === 'loading' ? 'Registrieren…' : 'Registrieren' }}
        </Button>
      </div>
    </form>

    <p class="mt-5 text-center text-sm font-medium text-custom-black">
      Sind Sie schon Kunde bei uns?
      <RouterLink
        to="/auth/login"
        class="font-medium text-custom-orange"
      >
        Zum Login
      </RouterLink>
    </p>

    <Teleport to="body">
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      >
        <div class="w-full max-w-sm rounded-[5px] bg-[#ECECEC] p-8 text-center">
          <div
            class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-custom-green"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h3 class="mb-2 text-xl font-bold text-custom-black">
            Vielen Dank!
          </h3>

          <p class="mb-6 text-base text-custom-black">
            Ihre Registrierung war erfolgreich. Sie können sich jetzt anmelden.
          </p>

          <Button
            button-classes="rounded-[5px] px-8 py-2 text-sm font-bold bg-custom-green"
            @click="onSuccessOk"
          >
            OK
          </Button>
        </div>
      </div>
    </Teleport>
  </div>
</template>