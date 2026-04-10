<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useAuth } from '@/composables/useAuth'
import type { RegisterPayload, UserRole } from '@/types'

const { register, status, error } = useAuth()

// ── Role selection ────────────────────────────────────────────────────────────
// Admin accounts are provisioned internally — they are not shown here.
type PublicRole = Extract<UserRole, 'B2C' | 'B2B' | 'WORKSHOP'>

const ROLE_OPTIONS: { value: PublicRole; label: string; description: string }[] = [
  { value: 'B2C', label: 'Private person', description: 'I lease a vehicle personally' },
  { value: 'B2B', label: 'Company', description: 'I manage vehicles for my business' },
  { value: 'WORKSHOP', label: 'Workshop', description: 'I inspect returned vehicles' },
]

const selectedRole = ref<PublicRole>('B2C')

// ── Validation schema (role-aware) ────────────────────────────────────────────
const schema = computed(() =>
  yup.object({
    firstName: yup.string().trim().required('First name is required'),
    lastName: yup.string().trim().required('Last name is required'),
    email: yup.string().email('Enter a valid email address').required('Email is required'),
    phone: yup.string().optional(),
    password: yup
      .string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Passwords do not match')
      .required('Please confirm your password'),
    // B2B-specific
    companyName: yup.string().when([], {
      is: () => selectedRole.value === 'B2B',
      then: (s) => s.trim().required('Company name is required'),
      otherwise: (s) => s.optional(),
    }),
    companyRegistrationNumber: yup.string().when([], {
      is: () => selectedRole.value === 'B2B',
      then: (s) => s.trim().required('Registration number is required'),
      otherwise: (s) => s.optional(),
    }),
    // Workshop-specific
    workshopName: yup.string().when([], {
      is: () => selectedRole.value === 'WORKSHOP',
      then: (s) => s.trim().required('Workshop name is required'),
      otherwise: (s) => s.optional(),
    }),
    address: yup.string().when([], {
      is: () => selectedRole.value === 'WORKSHOP',
      then: (s) => s.trim().required('Address is required'),
      otherwise: (s) => s.optional(),
    }),
  }),
)

// ── Form ──────────────────────────────────────────────────────────────────────
// Explicit generic gives `handleSubmit` a typed `values` — without it,
// vee-validate infers `any` from the dynamic computed schema.
interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  companyName?: string
  companyRegistrationNumber?: string
  workshopName?: string
  address?: string
}

const { handleSubmit, resetForm } = useForm<RegisterFormValues>({ validationSchema: schema })

const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName')
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName')
const { value: email, errorMessage: emailError } = useField<string>('email')
const { value: phone } = useField<string>('phone')
const { value: password, errorMessage: passwordError } = useField<string>('password')
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField<string>('confirmPassword')
const { value: companyName, errorMessage: companyNameError } = useField<string>('companyName')
const { value: companyRegistrationNumber, errorMessage: companyRegError } = useField<string>('companyRegistrationNumber')
const { value: workshopName, errorMessage: workshopNameError } = useField<string>('workshopName')
const { value: address, errorMessage: addressError } = useField<string>('address')

// Reset role-specific fields when the role changes so stale values don't
// bleed into the payload or trigger phantom validation errors.
function selectRole(role: PublicRole): void {
  selectedRole.value = role
  resetForm({
    values: {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    },
  })
}

// ── Styling helper ────────────────────────────────────────────────────────────
function inputClass(hasError: boolean): string {
  const base = 'w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-xs outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
  return hasError ? `${base} border-red-400 bg-red-50` : `${base} border-gray-300 bg-white`
}

// ── Submit ────────────────────────────────────────────────────────────────────
const onSubmit = handleSubmit(async (values) => {
  const base = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone || undefined,
    password: values.password,
  }

  let payload: RegisterPayload

  if (selectedRole.value === 'B2B') {
    payload = {
      ...base,
      role: 'B2B',
      companyName: values.companyName as string,
      companyRegistrationNumber: values.companyRegistrationNumber as string,
    }
  } else if (selectedRole.value === 'WORKSHOP') {
    payload = {
      ...base,
      role: 'WORKSHOP',
      workshopName: values.workshopName as string,
      address: values.address as string,
    }
  } else {
    payload = { ...base, role: 'B2C' }
  }

  await register(payload)
})
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-1">
      Create your account
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      Already have an account?
      <RouterLink
        to="/auth/login"
        class="
          text-indigo-600
          hover:underline
          font-medium
        "
      >
        Sign in
      </RouterLink>
    </p>

    <!-- Server-level error -->
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
      class="space-y-5"
      @submit.prevent="onSubmit"
    >
      <!-- ── Role selector ────────────────────────────────────────────── -->
      <fieldset>
        <legend class="block text-sm font-medium text-gray-700 mb-2">
          I am a…
        </legend>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in ROLE_OPTIONS"
            :key="option.value"
            type="button"
            :class="[
              `
                flex flex-col items-start rounded-lg border p-3 text-left
                transition
              `,
              selectedRole === option.value
                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                : `
                  border-gray-200
                  hover:border-gray-300
                `,
            ]"
            @click="selectRole(option.value)"
          >
            <span class="text-xs font-semibold text-gray-900">{{ option.label }}</span>
            <span class="text-xs text-gray-500 mt-0.5">{{ option.description }}</span>
          </button>
        </div>
      </fieldset>

      <!-- ── Common fields ────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label
            for="firstName"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            First name
          </label>
          <input
            id="firstName"
            v-model="firstName"
            type="text"
            autocomplete="given-name"
            :class="inputClass(!!firstNameError)"
            placeholder="Jane"
          >
          <p
            v-if="firstNameError"
            class="mt-1 text-xs text-red-600"
          >
            {{ firstNameError }}
          </p>
        </div>
        <div>
          <label
            for="lastName"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Last name
          </label>
          <input
            id="lastName"
            v-model="lastName"
            type="text"
            autocomplete="family-name"
            :class="inputClass(!!lastNameError)"
            placeholder="Doe"
          >
          <p
            v-if="lastNameError"
            class="mt-1 text-xs text-red-600"
          >
            {{ lastNameError }}
          </p>
        </div>
      </div>

      <div>
        <label
          for="reg-email"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :class="inputClass(!!emailError)"
          placeholder="you@company.com"
        >
        <p
          v-if="emailError"
          class="mt-1 text-xs text-red-600"
        >
          {{ emailError }}
        </p>
      </div>

      <div>
        <label
          for="phone"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Phone <span class="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="phone"
          v-model="phone"
          type="tel"
          autocomplete="tel"
          :class="inputClass(false)"
          placeholder="+49 170 0000000"
        >
      </div>

      <!-- ── B2B fields ────────────────────────────────────────────────── -->
      <template v-if="selectedRole === 'B2B'">
        <div>
          <label
            for="companyName"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Company name
          </label>
          <input
            id="companyName"
            v-model="companyName"
            type="text"
            :class="inputClass(!!companyNameError)"
            placeholder="Acme GmbH"
          >
          <p
            v-if="companyNameError"
            class="mt-1 text-xs text-red-600"
          >
            {{ companyNameError }}
          </p>
        </div>
        <div>
          <label
            for="companyReg"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Company registration number
          </label>
          <input
            id="companyReg"
            v-model="companyRegistrationNumber"
            type="text"
            :class="inputClass(!!companyRegError)"
            placeholder="HRB 123456"
          >
          <p
            v-if="companyRegError"
            class="mt-1 text-xs text-red-600"
          >
            {{ companyRegError }}
          </p>
        </div>
      </template>

      <!-- ── Workshop fields ───────────────────────────────────────────── -->
      <template v-if="selectedRole === 'WORKSHOP'">
        <div>
          <label
            for="workshopName"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Workshop name
          </label>
          <input
            id="workshopName"
            v-model="workshopName"
            type="text"
            :class="inputClass(!!workshopNameError)"
            placeholder="Müller KFZ GmbH"
          >
          <p
            v-if="workshopNameError"
            class="mt-1 text-xs text-red-600"
          >
            {{ workshopNameError }}
          </p>
        </div>
        <div>
          <label
            for="address"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <input
            id="address"
            v-model="address"
            type="text"
            :class="inputClass(!!addressError)"
            placeholder="Musterstraße 1, 80331 München"
          >
          <p
            v-if="addressError"
            class="mt-1 text-xs text-red-600"
          >
            {{ addressError }}
          </p>
        </div>
      </template>

      <!-- ── Password ──────────────────────────────────────────────────── -->
      <div>
        <label
          for="reg-password"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="reg-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          :class="inputClass(!!passwordError)"
          placeholder="Min. 8 characters"
        >
        <p
          v-if="passwordError"
          class="mt-1 text-xs text-red-600"
        >
          {{ passwordError }}
        </p>
      </div>

      <div>
        <label
          for="confirmPassword"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          :class="inputClass(!!confirmPasswordError)"
          placeholder="••••••••"
        >
        <p
          v-if="confirmPasswordError"
          class="mt-1 text-xs text-red-600"
        >
          {{ confirmPasswordError }}
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
        {{ status === 'loading' ? 'Creating account…' : 'Create account' }}
      </button>
    </form>
  </div>
</template>
