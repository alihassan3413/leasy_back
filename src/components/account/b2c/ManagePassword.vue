<script setup lang="ts">
import FormTextField from "@/components/ui/form/FormTextField.vue";
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
    <!-- Save Button -->
    <div class="flex justify-end pt-4">
      <Button
        type="submit"
        class="h-8.5 rounded-[5px] bg-custom-green text-sm font-bold text-white transition-all hover:bg-[#019d7a] w-37.5"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? "Wird gespeichert..." : "Speichern" }}
      </Button>
    </div>
  </div>
</template>
