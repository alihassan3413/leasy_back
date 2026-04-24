<script setup lang="ts">
import { useForm } from "vee-validate";
import { passwordSchema } from "@/validations/workshop.validation";
import FormTextField from "@/components/ui/form/FormTextField.vue";

const { resetForm } = useForm({
  validationSchema: passwordSchema,
  initialValues: {
    email: "",
    oldPassword: "",
    newPassword: "",
  },
});
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">Passwort verwalten</h2>
    </div>

    <div class="space-y-6">
      <div class="flex flex-col gap-6">
        <!-- Fields -->
        <div class="space-y-4 w-full">
          <FormTextField
            name="email"
            label="E-Mail-Adresse"
            placeholder="E-Mail-Adresse"
            type="email"
            class="w-full"
            required
          />

          <FormTextField
            name="oldPassword"
            label="Altes Passwort"
            placeholder="Altes Passwort"
            type="password"
            required
          />

          <FormTextField
            name="newPassword"
            label="Neues Passwort"
            placeholder="Neues Passwort"
            type="password"
            required
          />
        </div>
      </div>
    </div>
  </div>
</template>
