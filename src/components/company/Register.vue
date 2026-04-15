<script setup lang="ts">
import Input from '../form/Input.vue';

defineProps<{
  values: any,
  errors: Record<string , string >
}>()


</script>
<template>
  <div class="w-full bg-white rounded mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h1 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Registrierung
      </h1>
      <div class="w-full h-px bg-green-gray"></div>
      <div>
          <!-- Row 1 -->
          <div class="grid grid-cols-2 gap-4">
            <Input
              v-model="values.firmenname"
              label="Firmenname (lt. HGB/Gewerbeeintrag)"
              placeholder="HWT Gmbh"
              :required="true"
              :error="errors['company.firmenname']"
              class="w-full"
            />
            <Input
              v-model="values.ustIdNr"
              label="USt-IdNr."
              placeholder=""
              :required="true"
              :error="errors['company.ustIdNr']"
              class="w-full"
            />
          </div>
          <!-- Row 2 -->
          <div class="grid grid-cols-[1fr_100px_1fr] gap-3">
            <Input v-model="values.strasse" label="Straße" :required="true" class="" :error="errors['company.strasse']" />
            <Input v-model="values.nr" label="Nr." :required="true" class="w-23.75" :error="errors['company.nr']" />
            <Input
              v-model="values.zusaetzlicheAnschrift"
              label="Zusätzliche Anschrift"
              :required="true"
              :error="errors['company.zusaetzlicheAnschrift']"
            />
          </div>
          <!-- Row 3 -->
          <div class="grid grid-cols-[100px_1fr_1fr] gap-3 items-end">
            <Input v-model="values.plz" label="PLZ" :required="true" class="w-23.75" :error="errors['company.plz']" />
            <Input v-model="values.ort" label="Ort" :required="true" :error="errors['company.ort']" />
            <div class="flex flex-col  gap-0.5">
              <span class="text-sm font-bold leading-normal not-italic text-black">Land</span>
              <span class="text-sm text-black font-normal leading-normal not-italic h-8 flex items-center"
                >Deutschland</span
              >
            </div>
          </div>
          <!-- Logo Upload -->
          <div class="flex flex-col  gap-0.5 mt-2.5">
            <span class="text-black text-sm font-bold leading-normal not-italic"
              >Laden Sie Ihr Logo hoch</span
            >
            <label
              class=" border border-dashed border-green-gray bg-white rounded-[5px] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-custom-turquoise transition-colors"
              @dragover.prevent
            >
              <input type="file" class="hidden" accept=".pdf,.jpg,.png" />
              <p class="text-center ">
                <span class=" text-primary text-sm font-bold leading-normal not-italic">
                  Datei hierher ziehen oder zum <br> Hochladen
                  <span class=" text-custom-green text-sm font-bold leading-normal not-italic underline  ">durchsuchen</span>
                </span>
                <br />
                <span class=" text-custom-black text-[12px] tracking-[1px] font-normal leading-normal not-italic block"
                  >PDF, JPG oder PNG • 8MB max</span
                >
              </p>
            </label>
          </div>
      </div>
    </div>
  </div>
</template>
