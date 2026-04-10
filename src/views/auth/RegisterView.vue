<script setup lang="ts">
import { ref } from 'vue'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

import { useAuth } from '@/composables/useAuth'
import type { RegisterPayload, UserRole } from '@/types'

const { register, status, error } = useAuth()
const router = useRouter()

// ── Role options ─────────────────────────────────────────────────────────────
type PublicRole = Extract<UserRole, 'B2C' | 'B2B' | 'WORKSHOP'>

const ROLE_OPTIONS: { value: PublicRole; label: string }[] = [
  { value: 'B2C', label: 'Privatkunde' },
  { value: 'B2B', label: 'Firmenkunde' },
  { value: 'WORKSHOP', label: 'Werkstatt' },
]

// ── Validation schema ────────────────────────────────────────────────────────
const schema = yup.object({
  role: yup.string().required('Please select a role'),
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .matches(
      /[^a-zA-Z0-9]/,
      'Password must contain at least 1 special character',
    )
    .required('Password is required'),
})

interface RegisterFormValues {
  role: string
  email: string
  password: string
}

const { handleSubmit } = useForm<RegisterFormValues>({
  validationSchema: schema,
})

const { value: role, errorMessage: roleError } = useField<string>('role')
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } =
  useField<string>('password')

// ── Password visibility toggle ───────────────────────────────────────────────
const showPassword = ref(false)

// ── Success modal ────────────────────────────────────────────────────────────
const showSuccess = ref(false)

// ── Submit ───────────────────────────────────────────────────────────────────
const onSubmit = handleSubmit(async (values) => {
  const payload: RegisterPayload = {
    role: values.role as PublicRole,
    email: values.email,
    password: values.password,
  }

  await register(payload)

  if (status.value !== 'error') {
    showSuccess.value = true
  }
})

function onSuccessOk(): void {
  showSuccess.value = false
  void router.push('/auth/login')
}
</script>

<template>
  <div class="flex min-h-[580px] flex-col">
    <!-- Heading — top of card -->
    <p
      class="text-xl font-bold leading-snug"
      style="color: #10393b"
    >
      Sie können sich als Werkstatt, als Firmenkunde oder auch als Privatkunde
      registrieren
    </p>

    <!-- Spacer pushes form toward bottom half of card -->
    <div class="flex-1" />

    <!-- Server error -->
    <div
      v-if="error"
      class="mb-4 rounded-[5px] border p-3 text-sm"
      style="
        background-color: #fef2f2;
        border-color: #fca5a5;
        color: #b91c1c;
      "
    >
      {{ error }}
    </div>

    <form
      novalidate
      class="space-y-5"
      @submit.prevent="onSubmit"
    >
      <!-- Role dropdown -->
      <div>
        <label
          for="role"
          class="mb-1.5 block text-sm font-bold"
          style="color: #2e3e3f"
        >
          Jetzt registrieren als
        </label>
        <div class="relative">
          <select
            id="role"
            v-model="role"
            class="
              w-full appearance-none rounded-[5px] border bg-white px-3 py-2.5
              text-sm outline-none transition
            "
            :class="roleError ? 'border-red-400 bg-red-50' : ''"
            :style="{ borderColor: roleError ? undefined : '#B7C2C2' }"
          >
            <option
              value=""
              disabled
              selected
            >
              Auswählen
            </option>
            <option
              v-for="opt in ROLE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
          <!-- Chevron -->
          <svg
            class="
              pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
            "
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="#B7C2C2"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p
          v-if="roleError"
          class="mt-1 text-xs text-red-600"
        >
          {{ roleError }}
        </p>
      </div>

      <!-- Email -->
      <div>
        <label
          for="reg-email"
          class="mb-1.5 block text-sm font-bold"
          style="color: #2e3e3f"
        >
          E-Mail-Adresse
        </label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          class="
            w-full rounded-[5px] border bg-white px-3 py-2.5 text-sm
            outline-none transition
          "
          :class="emailError ? 'border-red-400 bg-red-50' : ''"
          :style="{ borderColor: emailError ? undefined : '#B7C2C2' }"
        >
        <p
          v-if="emailError"
          class="mt-1 text-xs text-red-600"
        >
          {{ emailError }}
        </p>
      </div>

      <!-- Password -->
      <div>
        <label
          for="reg-password"
          class="mb-1.5 block text-sm font-bold"
          style="color: #2e3e3f"
        >
          Passwort
        </label>
        <div class="relative">
          <input
            id="reg-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            class="
              w-full rounded-[5px] border bg-white px-3 py-2.5 pr-10 text-sm
              outline-none transition
            "
            :class="passwordError ? 'border-red-400 bg-red-50' : ''"
            :style="{ borderColor: passwordError ? undefined : '#B7C2C2' }"
          >
          <!-- Eye toggle -->
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2"
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B7C2C2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle
                cx="12"
                cy="12"
                r="3"
              />
            </svg>
            <svg
              v-else
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B7C2C2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line
                x1="1"
                y1="1"
                x2="23"
                y2="23"
              />
            </svg>
          </button>
        </div>
        <p
          class="mt-1.5 text-xs"
          style="color: #b7c2c2"
        >
          Min. 8 Zeichen, mind. 1 Großbuchstabe, mind. 1 Sonderzeichen
        </p>
        <p
          v-if="passwordError"
          class="mt-1 text-xs text-red-600"
        >
          {{ passwordError }}
        </p>
      </div>

      <!-- Submit -->
      <div class="pt-6">
        <button
          type="submit"
          :disabled="status === 'loading'"
          class="
            flex w-full items-center justify-center gap-2 rounded-[5px] px-4
            py-3 text-sm font-bold text-white transition
            disabled:cursor-not-allowed disabled:opacity-60
          "
          style="background-color: #ef8450"
          @mouseenter="
            ($event.target as HTMLElement).style.backgroundColor = '#e0743f'
          "
          @mouseleave="
            ($event.target as HTMLElement).style.backgroundColor = '#ef8450'
          "
        >
          <span
            v-if="status === 'loading'"
            class="
              size-4 animate-spin rounded-full border-2 border-white
              border-t-transparent
            "
          />
          {{ status === 'loading' ? 'Registrieren…' : 'Registrieren' }}
        </button>
      </div>
    </form>

    <!-- Login link -->
    <p
      class="mt-5 text-center text-sm font-medium"
      style="color: #2e3e3f"
    >
      Sind Sie schon Kunde bei uns?
      <RouterLink
        to="/auth/login"
        class="font-medium"
        style="color: #01b990"
      >
        Zum Login
      </RouterLink>
    </p>

    <!-- Success modal overlay -->
    <Teleport to="body">
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      >
        <div
          class="w-full max-w-sm rounded-[5px] p-8 text-center"
          style="background-color: #ececec"
        >
          <div
            class="
              mx-auto mb-4 flex size-14 items-center justify-center rounded-full
            "
            style="background-color: #01b990"
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

          <h3
            class="mb-2 text-xl font-bold"
            style="color: #2e3e3f"
          >
            Vielen Dank!
          </h3>
          <p
            class="mb-6 text-base"
            style="color: #2e3e3f"
          >
            Ihre Registrierung war erfolgreich. Sie können sich jetzt anmelden.
          </p>

          <button
            class="rounded-[5px] px-8 py-2 text-sm font-bold text-white"
            style="background-color: #01b990"
            @click="onSuccessOk"
          >
            OK
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
