<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { Icon } from "@iconify/vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";
import { useB2CStore } from "@/stores/b2c.store";

const b2cStore = useB2CStore();
const isEditMode = ref(false);

const { handleSubmit, resetForm, isSubmitting } = useForm({
  initialValues: {
    oldPassword: "",
    newPassword: "",
  },
});

const onSubmit = handleSubmit(async (values) => {
  // TODO: wire to store action, e.g. await b2cStore.changePassword(values)
  console.log("Password change submitted:", values);
  resetForm();
  isEditMode.value = false;
});

const cancelEdit = () => {
  resetForm();
  isEditMode.value = false;
};
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#D9E2E2] bg-white">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#EDF2F2] px-8 py-5">
      <div>
        <h2 class="text-lg font-bold text-[#10393B]">Passwort &amp; Anmeldung</h2>
        <p class="mt-0.5 text-[13px] text-[#6B8587]">
          E-Mail-Adresse und Passwort Ihres Kontos
        </p>
      </div>

      <button
        v-if="!isEditMode"
        type="button"
        @click="isEditMode = true"
        class="flex items-center gap-1.5 rounded-lg border border-[#D9E2E2] px-3.5 py-2 text-sm font-bold text-[#10393B] transition-colors hover:border-custom-green hover:text-custom-green"
      >
        <Icon icon="mdi:lock-reset" class="size-4" />
        Passwort ändern
      </button>
      <button
        v-else
        type="button"
        @click="cancelEdit"
        class="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-[#6B8587] transition-colors hover:text-[#10393B]"
      >
        <Icon icon="mdi:close" class="size-4" />
        Abbrechen
      </button>
    </div>

    <!-- READ MODE -->
    <div v-if="!isEditMode" class="px-8 py-7">
      <dl class="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
            E-Mail-Adresse
          </dt>
          <dd class="mt-1 text-[15px] font-medium text-[#10393B]">
            {{ b2cStore.profile?.email || "—" }}
          </dd>
        </div>
        <div>
          <dt class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
            Passwort
          </dt>
          <dd class="mt-1 text-[15px] font-medium tracking-[0.25em] text-[#10393B]">
            ••••••••••
          </dd>
        </div>
      </dl>
    </div>

    <!-- EDIT MODE -->
    <form v-else @submit.prevent="onSubmit">
      <div class="max-w-[440px] space-y-4 px-8 py-7">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CB3B4]">
            Angemeldet als
          </span>
          <p class="mt-1 text-[15px] font-medium text-[#10393B]">
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
        <p class="text-[13px] text-[#6B8587]">
          Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben sowie einer Zahl.
        </p>
      </div>

      <div
        class="flex items-center justify-end gap-3 border-t border-[#EDF2F2] bg-[#FAFAFA] px-8 py-4"
      >
        <button
          type="button"
          @click="cancelEdit"
          class="rounded-lg px-4 py-2 text-sm font-bold text-[#6B8587] transition-colors hover:text-[#10393B]"
        >
          Abbrechen
        </button>
        <Button
          type="submit"
          class="h-[38px] rounded-lg bg-custom-green px-6 text-sm font-bold text-white transition-all hover:bg-[#019d7a]"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "Wird gespeichert…" : "Passwort speichern" }}
        </Button>
      </div>
    </form>
  </div>
</template>