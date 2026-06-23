<script setup lang="ts">
import { useForm } from "vee-validate";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Button from "@/components/ui/Button.vue";
import FormTextField from "@/components/ui/form/FormTextField.vue";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [data: { iban: string; kontoinhaber: string }];
}>();

const { handleSubmit, resetForm } = useForm({
  initialValues: {
    iban: "",
    ibanRepeat: "",
    kontoinhaber: "",
  },
});

function close() {
  emit("update:open", false);
}

const handleSave = handleSubmit((values) => {
  if (values.iban !== values.ibanRepeat) {
    alert("IBAN values do not match");
    return;
  }
  emit("submit", { iban: values.iban, kontoinhaber: values.kontoinhaber });
  close();
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-hidden"
      style="
        width: 1000px;
        max-width: 95vw;
        border-radius: 5px;
        border: 1px solid #ececec;
      "
      :show-close-button="false"
    >
      <div class="bg-white p-8">
        <h2 class="text-[22px] font-bold text-color-primary mb-6">
          Ein Bankkonto hinzufügen
        </h2>

        <div class="grid grid-cols-3 gap-6 mb-6">
          <FormTextField name="iban" label="IBAN" required />
          <FormTextField
            name="ibanRepeat"
            label="Bitte geben Sie ihren IBAN erneut an"
            required
          />
          <FormTextField name="kontoinhaber" label="Kontoinhaber" required />
        </div>

        <p class="text-[13px] text-custom-black leading-relaxed mb-10">
          Indem Sie fortfahren, bestätigen Sie, dass Sie berechtigt sind,
          Zahlungen von diesem Konto zu veranlassen, und stimmen unseren
          Nutzungsbedingungen zu. Zahlungen mit SEPA over mehr als ein Konto
          erfordern eine erneute Kontobestätigung, da der Kontoinhaber
          möglicherweise auf mehreren Konten gesperrt (unzulässig) sein könnte.
          Hinweis: Um Missbrauch zu vermeiden und die ordnungsgemäße Nutzung des
          Bankkontos sicherzustellen, erfolgt die Bestätigung über ein
          Testverfahren. Es gelten dieselben Daten und Limits wie in unseren
          Nutzungsbedingungen und betrieblichen Bestimmungen.
        </p>

        <div class="flex justify-end gap-6">
          <Button
            variant="primary"
            class="w-37.5 h-10 rounded-[5px] font-bold"
            @click="close"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            class="w-37.5 h-10 rounded-[5px] font-bold bg-custom-green! text-white"
            @click="handleSave"
          >
            Speichern
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
