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
  submit: [data: any];
}>();

const { values, handleSubmit, resetForm } = useForm({
  initialValues: {
    firmenname: "HWT GmbH",
    ustIdNr: "DE 23456789 1",
    strasse: "Theodorstraße",
    nr: "9",
    zusatz: "",
    plz: "42853",
    ort: "Remscheid",
    land: "Deutschland",
  },
});

function close() {
  emit("update:open", false);
}

const handleSave = handleSubmit((formValues) => {
  emit("submit", { ...formValues });
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
        <h2 class="text-base font-normal text-custom-black mb-2.5">
          Rechnungsadresse hinzufügen
        </h2>
        <p class="text-sm font-bold text-custom-black mb-8">
          Falls Sie eine von der bei der Registrierung angegebenen Adresse
          abweichende Rechnungsadresse verwenden möchten, können Sie diese hier
          festlegen.
        </p>

        <div class="grid grid-cols-2 gap-x-12 gap-y-6 mb-10">
          <!-- Row 1 -->
          <FormTextField
            name="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)"
            required
          />
          <FormTextField name="ustIdNr" label="USt-IdNr." required />

          <!-- Row 2 -->
          <FormTextField
            name="strasse"
            label="Straße (kein Postfach)"
            required
          />
          <div class="grid grid-cols-[1fr_2fr] gap-6">
            <FormTextField name="nr" label="Nr." required />
            <FormTextField name="zusatz" label="Zusätzliche Anschrift" />
          </div>

          <!-- Row 3 -->
          <div class="grid grid-cols-[1fr_3fr] gap-6">
            <FormTextField name="plz" label="PLZ" required />
            <FormTextField name="ort" label="Ort" required />
          </div>
          <div class="flex flex-col">
            <label class="text-sm font-bold text-custom-black mb-1.5 ml-1">
              Land
            </label>
            <div class="text-custom-black mt-2 font-medium">
              {{ values.land }}
            </div>
          </div>
        </div>

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
