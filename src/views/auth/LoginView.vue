<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useAuth } from '@/composables/useAuth'
import type { LoginPayload } from '@/types'

const { login, status, error } = useAuth()

// ── Validation schema ────────────────────────────────────────────────────────
const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
})

const { handleSubmit } = useForm<LoginPayload>({ validationSchema: schema })

const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: password, errorMessage: passwordError } = useField<string>('password')

// ── Submit ───────────────────────────────────────────────────────────────────
const onSubmit = handleSubmit(async (values) => {
  await login(values)
})
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-1">
      Sign in to your account
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      Don't have an account?
      <RouterLink
        to="/auth/register"
        class="
          text-indigo-600
          hover:underline
          font-medium
        "
      >
        Create one
      </RouterLink>
    </p>

    <!-- Server-level error (wrong credentials, account locked, etc.) -->
    <div
      v-if="error"
      class="
        mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm
      "
    >
      {{ error }}
    </div>

    <form
      novalidate
      class="space-y-4"
      @submit.prevent="onSubmit"
    >
      <!-- Email -->
      <div>
        <label
          for="email"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          :class="[
            `
              w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs
              outline-none transition
            `,
            'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            emailError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          ]"
          placeholder="you@company.com"
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
        <div class="flex items-center justify-between mb-1">
          <label
            for="password"
            class="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <RouterLink
            to="/auth/forgot-password"
            class="
              text-xs text-indigo-600
              hover:underline
            "
          >
            Forgot password?
          </RouterLink>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :class="[
            `
              w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs
              outline-none transition
            `,
            'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            passwordError ? 'border-red-400 bg-red-50' : `
              border-gray-300 bg-white
            `,
          ]"
          placeholder="••••••••"
        >
        <p
          v-if="passwordError"
          class="mt-1 text-xs text-red-600"
        >
          {{ passwordError }}
        </p>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="status === 'loading'"
        class="
          w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600
          px-4 py-2.5 text-sm font-semibold text-white shadow-xs
          hover:bg-indigo-700
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-indigo-600
          disabled:opacity-60 disabled:cursor-not-allowed
          transition
        "
      >
        <span
          v-if="status === 'loading'"
          class="
            size-4 animate-spin rounded-full border-2 border-white
            border-t-transparent
          "
        />
        {{ status === 'loading' ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>
