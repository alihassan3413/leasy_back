<script setup lang="ts">
import { useField } from "vee-validate";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const { value: impressum, errorMessage, meta } = useField<string>("legal.impressum");

const placeholder = `Impressumsangaben\n\n• Name, Anschrift, Kontaktdaten\n• Handelsregisternr. (falls vorhanden)\n• Name des / der Vertretungsberechtigten\nBitte nennen Sie Vor- und Familiennamen aller Geschäftsführer, Vertretungsberechtigter oder Alleininhaber.`;
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2
        class="text-primary text-[20px] font-bold leading-normal not-italic underline decoration-green-gray underline-offset-8 decoration-1 w-full pb-4"
      >
        Impressumsdaten
      </h2>

      <p
        class="text-black text-[15px] font-normal leading-normal not-italic mt-4 mb-8"
      >
        Als Werkstatt müssen Sie auf Ihrer Homepage bei LeasyBack.com
        zusätzliche Impressumsangaben machen. Geben Sie nur Ihre Daten an, die
        vorhanden sind, da Sie für deren Richtigkeit verantwortlich sind.
        Unvollständige Angaben können zu kostenpflichtigen Abmahnungen durch
        Mitbewerber oder Verbraucherschutzverbände führen.
      </p>

      <div class="w-full flex flex-col gap-2">
        <Label
          for="impressum"
          class="text-sm font-bold text-black leading-normal not-italic"
        >
          Impressum<span class="text-custom-orange">*</span>
        </Label>
        <Textarea
          id="impressum"
          v-model="impressum"
          :placeholder="placeholder"
          class="w-full min-h-55 border-green-gray rounded-[5px] text-sm font-normal text-black placeholder:text-green-gray/50 p-4"
        />
        <span v-if="meta.touched && errorMessage" class="text-red-500 text-xs mt-1">
          {{ errorMessage }}
        </span>
      </div>
    </div>
  </div>
</template>
