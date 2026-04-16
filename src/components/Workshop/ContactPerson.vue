<script setup lang="ts">
import { ref } from 'vue'
import Input from '@/components/form/Input.vue'
import SelectDropDown from '@/components/form/SelectDropDown.vue'
import FormTextField from '@/components/ui/form/FormTextField.vue'

const firmenname = ref('')
const anrede = ref('')
const vorname = ref('')
const nachname = ref('')
const vorwahl = ref('')
const telefon = ref('')

const anredeOptions = [
  { label: 'Herr', value: 'Herr' },
  { label: 'Frau', value: 'Frau' },
]

const vorwahlOptions = [
  { label: 'Deutschland + (49)', value: '+49' },
]
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Ansprechpartner für LeasyBack
      </h2>
      <p class="text-black text-base font-normal leading-normal not-italic">
        Damit wir Sie betreuen und informieren können, teilen Sie uns bitte einen Ansprechpartner für den LeasyBack.com Kundenservice mit.
      </p>

      <div class="w-full h-px bg-green-gray mb-4"></div>

      <!-- Form Grid -->
      <div class="grid grid-cols-3 gap-x-4 gap-y-4 w-full">
        <!-- Row 1: Firmenname -->
        <div class="col-span-3">
          <FormTextField
            v-model="firmenname"
            label="Firmenname (lt. HGB/Gewerbeeintrag)"
            placeholder=""
            required
            class="w-full"
          />
        </div>

        <!-- Row 2: Anrede, Vorname, Nachname -->
        <div class="col-span-1">
          <SelectDropDown
            v-model="anrede"
            label="Anrede"
            :options="anredeOptions"
            placeholder="Herr"
            class="w-full"
          />
        </div>
        <div class="col-span-1">
          <FormTextField
            v-model="vorname"
            label="Vorname"
            placeholder=""
            required
            class="w-full"
          />
        </div>
        <div class="col-span-1">
           <FormTextField
            v-model="nachname"
            label="Nachname"
            placeholder=""
            required
            class="w-full"
          />
        </div>

        <!-- Row 3: Internat. Vorwahl, Tel. für Anfragen -->
        <div class="col-span-1">
          <SelectDropDown
            v-model="vorwahl"
            label="Internat. Vorwahl*"
            :options="vorwahlOptions"
            placeholder="Deutschland + (49)"
            class="w-full"
          />
        </div>
        <div class="col-span-2">
          <FormTextField
            v-model="telefon"
            label="Tel. für Anfragen"
            placeholder=""
            required
            class="w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>