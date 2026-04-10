

<script setup lang="ts">
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useAuth } from '@/composables/useAuth'
import type { ForgotPasswordPayload } from '@/types'

const { forgotPassword, status, error } = useAuth()

// We track whether the request was sent so we can swap to the success state.
const emailSent = ref(false)
const submittedEmail = ref('')

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Email is required'),
})

const { handleSubmit } = useForm<ForgotPasswordPayload>({ validationSchema: schema })

const { value: email, errorMessage: emailError } = useField<string>('email')

const onSubmit = handleSubmit(async (values) => {
  await forgotPassword(values)
  submittedEmail.value = values.email
  emailSent.value = true
})
</script>

<template>
  <div>
    <!-- ── Success state ──────────────────────────────────────────────── -->
    <template v-if="emailSent">
      <div class="text-center py-2">
        <!-- Checkmark icon -->
        <div
          class="
            mx-auto mb-4 flex size-12 items-center justify-center rounded-full
            bg-green-100
          "
        >
          <svg
            class="size-6  text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Check your inbox
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          We sent a password reset link to<br>
          <span class="font-medium text-gray-700">{{ submittedEmail }}</span>
        </p>
        <p class="text-xs text-gray-400">
          Didn't get it? Check your spam folder or
          <button
            class="
              text-indigo-600
              hover:underline
            "
            @click="emailSent = false"
          >
            try again
          </button>.
        </p>
      </div>
    </template>

    <!-- ── Request form ───────────────────────────────────────────────── -->
    <template v-else>
      <h2 class="text-xl font-semibold text-gray-900 mb-1">
        Reset your password
      </h2>
      <p class="text-sm text-gray-500 mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <!-- Server-level error -->
      <div
        v-if="error"
        class="
          mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700
          text-sm
        "
      >
        {{ error }}
      </div>

      <form
        novalidate
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <div>
          <label
            for="forgot-email"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="forgot-email"
            v-model="email"
            type="email"
            autocomplete="email"
            :class="[
              `
                w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs
                outline-none transition
              `,
              'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              emailError ? 'border-red-400 bg-red-50' : `
                border-gray-300 bg-white
              `,
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

        <button
          type="submit"
          :disabled="status === 'loading'"
          class="
            w-full flex justify-center items-center gap-2 rounded-lg
            bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs
            hover:bg-indigo-700
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-indigo-600
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
          {{ status === 'loading' ? 'Sending…' : 'Send reset link' }}
        </button>

        <div class="text-center">
          <RouterLink
            to="/auth/login"
            class="
              text-sm text-indigo-600
              hover:underline
            "
          >
            Back to sign in
          </RouterLink>
        </div>
      </form>
    </template>
  </div>
</template>
