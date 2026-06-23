<script setup lang="ts">
import { watch } from "vue";
import { useForm, useField } from "vee-validate";
import { useWorkshopStore } from "@/stores/workshop.store";
import { accountSchema } from "@/validations/workshop.validation";
import FormTextField from "@/components/ui/form/FormTextField.vue";
import Button from "@/components/ui/button/Button.vue";

const workshopStore = useWorkshopStore();

const { handleSubmit, isSubmitting, setValues, errors } = useForm({
  validationSchema: accountSchema,
  initialValues: {
    kontoinhaber: "",
    iban: "",
    bic: "",
    hasVatId: "Nein",
    vatId: "",
    hasAltBilling: "Nein",
    altBillingAddress: "",
  },
});

const { value: hasVatId } = useField<string>("hasVatId");
const { value: hasAltBilling } = useField<string>("hasAltBilling");

// Watch for store profile changes and update form
watch(
  () => workshopStore.profile,
  (newProfile) => {
    if (newProfile) {
      setValues({
        hasVatId: newProfile.has_vat_id ? "Ja" : "Nein",
        vatId: newProfile.vat_id || "",
        // Other fields (bank details) are not in the provided JSON but would be set here if they were
      });
    }
  },
  { immediate: true },
);

const onSubmit = handleSubmit(
  async (values) => {
    console.log("Submitting account credits...", values);
    if (!workshopStore.profile?.workshop_id) {
      console.error("No workshop ID found");
      return;
    }

    try {
      const payload = {
        has_vat_id: values.hasVatId === "Ja",
        vat_id: values.hasVatId === "Ja" ? values.vatId : null,
      };

      console.log("Update Payload:", payload);
      await workshopStore.updateWorkshop(
        workshopStore.profile.workshop_id,
        payload,
      );
      alert("Kontodaten erfolgreich gespeichert");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Fehler beim Speichern");
    }
  },
  (invalid) => {
    console.error("Validation failed:", invalid.errors);
  },
);
</script>

<template>
  <div class="w-full rounded-[10px] border border-[#D9E2E2] bg-white p-6 mt-5">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-color-primary">
        Kontodaten für Gutschriften
      </h2>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <!-- Left Column: Bank Details -->
        <div class="space-y-4">
          <FormTextField
            name="kontoinhaber"
            label="Kontoinhaber*"
            placeholder="Kontoinhaber"
            required
          />
          <FormTextField
            name="iban"
            label="IBAN*"
            placeholder="IBAN"
            required
          />
          <FormTextField name="bic" label="BIC*" placeholder="BIC" required />
        </div>

        <!-- Right Column: VAT Section -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-black">
              Haben Sie eine Umsatzsteuer-Identifikationsnummer
            </span>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="hasVatId"
                  type="radio"
                  value="Ja"
                  class="size-4 accent-[#EF8450]"
                />
                <span class="text-sm">Ja</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="hasVatId"
                  type="radio"
                  value="Nein"
                  class="size-4 accent-[#EF8450]"
                />
                <span class="text-sm">Nein</span>
              </label>
            </div>
          </div>

          <FormTextField
            name="vatId"
            placeholder="Umsatzsteuer-Identifikationsnr. (Ust-IdNr.)"
            :disabled="hasVatId === 'Nein'"
          />
        </div>
      </div>

      <!-- Bottom Section: Alt Billing -->
      <div class="space-y-1 pt-2 w-159.5">
        <div class="flex items-center justify-between gap-8">
          <span class="text-sm font-bold text-black">
            Wünschen Sie eine abweichende Rechnungsadressierung
          </span>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="hasAltBilling"
                type="radio"
                value="Ja"
                class="size-4 accent-[#EF8450]"
              />
              <span class="text-sm">Ja</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="hasAltBilling"
                type="radio"
                value="Nein"
                class="size-4 accent-[#EF8450]"
              />
              <span class="text-sm">Nein</span>
            </label>
          </div>
        </div>

        <FormTextField
          name="altBillingAddress"
          placeholder="Abweichende Rechnungsadresse"
          :disabled="hasAltBilling === 'Nein'"
          class=""
        />
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
    </form>
  </div>
</template>
