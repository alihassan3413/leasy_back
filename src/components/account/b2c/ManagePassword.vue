<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";
import { useB2CStore } from "@/stores/b2c.store";
import { useAuthStore } from "@/stores/auth.store";
import { changePasswordSchema } from "@/validations/password.validation";
import type { ApiError } from "@/api/client/error";

const b2cStore = useB2CStore();
const authStore = useAuthStore();
const isEditMode = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: changePasswordSchema,
  initialValues: {
    oldPassword: "",
    newPassword: "",
  },
});

const onSubmit = handleSubmit(async (values) => {
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await authStore.changePassword({
      current_password: values.oldPassword,
      new_password: values.newPassword,
    });
    successMessage.value = "Passwort erfolgreich geändert.";
    resetForm();
    isEditMode.value = false;
  } catch (err) {
    const status = (err as ApiError)?.status;
    errorMessage.value =
      status === 401 || status === 406 || status === 400
        ? "Das alte Passwort ist nicht korrekt."
        : (err as ApiError)?.message ||
          "Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.";
  }
});

const cancelEdit = () => {
  resetForm();
  errorMessage.value = "";
  successMessage.value = "";
  isEditMode.value = false;
};
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#D1DCDC] bg-white shadow-sm">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EDF2F2] px-4 py-4 sm:px-8 sm:py-5">
      <div>
        <h2 class="text-[16px] sm:text-[17px] font-bold text-[#10393B]">Passwort &amp; Anmeldung</h2>
        <p class="mt-0.5 text-[12px] sm:text-[13px] text-[#7A9699]">
          E-Mail-Adresse und Passwort Ihres Kontos
        </p>
      </div>

      <div class="flex shrink-0">
        <button
          v-if="!isEditMode"
          type="button"
          @click="isEditMode = true"
          class="flex items-center gap-1.5 rounded-lg border border-[#D1DCDC] bg-white px-3 py-2 text-sm font-semibold text-[#10393B] transition-all hover:border-custom-green hover:bg-[#F0FBF8] hover:text-custom-green"
        >
          <Icon icon="mdi:key-variant" class="size-4" />
          Passwort ändern
        </button>
        <button
          v-else
          type="button"
          @click="cancelEdit"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]"
        >
          <Icon icon="mdi:close" class="size-4" />
          Abbrechen
        </button>
      </div>
    </div>

    <!-- READ MODE -->
    <div v-if="!isEditMode" class="px-4 py-6 sm:px-8 sm:py-8">
      <p
        v-if="successMessage"
        class="mb-5 rounded-lg bg-[#F0FBF8] px-4 py-2.5 text-[13px] font-semibold text-custom-green"
      >
        {{ successMessage }}
      </p>
      <dl class="grid grid-cols-1 gap-x-6 gap-y-5 sm:gap-x-10 sm:gap-y-7 sm:grid-cols-2">
        <div>
          <dt class="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
            E-Mail-Adresse
          </dt>
          <dd class="mt-1.5 text-[14px] sm:text-[15px] font-semibold text-[#10393B] break-all">
            {{ b2cStore.profile?.email || "—" }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
            Passwort
          </dt>
          <dd class="mt-1.5 text-lg sm:text-xl tracking-[0.3em] text-[#9CB3B4]">
            ••••••••••
          </dd>
        </div>
      </dl>
    </div>

    <!-- EDIT MODE -->
    <form v-else @submit.prevent="onSubmit">
      <div class="w-full max-w-[440px] space-y-5 px-4 py-6 sm:px-8 sm:py-7">
        <div>
          <span class="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9CB3B4]">
            Angemeldet als
          </span>
          <p class="mt-1.5 text-[14px] sm:text-[15px] font-semibold text-[#10393B] break-all">
            {{ b2cStore.profile?.email }}
          </p>
        </div>

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
        <p class="text-[12px] sm:text-[13px] text-[#7A9699]">
          Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben sowie einer Zahl.
        </p>
        <p
          v-if="errorMessage"
          class="rounded-lg bg-[#FDECEC] px-4 py-2.5 text-[13px] font-semibold text-[#D14343]"
        >
          {{ errorMessage }}
        </p>
      </div>

      <div
        class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-[#EDF2F2] bg-[#F8FAFB] px-4 py-4 sm:px-8"
      >
        <button
          type="button"
          @click="cancelEdit"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-[#7A9699] transition-colors hover:text-[#10393B]"
        >
          Abbrechen
        </button>
        <Button
          type="submit"
          class="h-[38px] w-full sm:w-auto rounded-lg bg-custom-green px-6 text-sm font-semibold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert…" : "Passwort speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>