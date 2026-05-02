<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useField, useForm } from "vee-validate";

import Button from "@/components/ui/Button.vue";
import TextInput from "@/components/ui/form/TextInput.vue";
import { useAuthStore } from "@/stores/auth.store";
import { loginSchema } from "@/validations/auth/login.schema";
import type { LoginPayload } from "@/types";

interface LoginFormValues {
  email: string;
  password: string;
}

const authStore = useAuthStore();
const { status, error } = storeToRefs(authStore);
const router = useRouter();

const { handleSubmit, setErrors } = useForm<LoginFormValues>({
  validationSchema: loginSchema,
});

const { value: email, errorMessage: emailError } = useField<string>("email");
const { value: password, errorMessage: passwordError } =
  useField<string>("password");

const onSubmit = handleSubmit(async (values) => {
  const payload: LoginPayload = {
    user_email: values.email,
    password: values.password,
  };
  try {
    await authStore.login(payload);
      router.push({ name: "dashboard" });
  } catch (err) {
    const apiError = err as {
      message: string;
      errors?: Record<string, string[]>;
    };

    if (apiError.errors) {
      setErrors({
        email: apiError.errors.user_email?.[0],
        password: apiError.errors.password?.[0],
      });
    }
  }
});
</script>

<template>
  <div class="flex min-h-145 flex-col">
    <p
      class="mx-auto mt-16.25 mb-25 max-w-73 text-left text-lg font-bold text-primary xl:mt-22.75 xl:mb-35 xl:text-xl"
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
          class="mt-1 block text-[14px] font-bold text-custom-green underline decoration-[1.12px] underline-offset-[2.8px]"
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
          {{ status === "loading" ? "Einloggen…" : "Einloggen" }}
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
