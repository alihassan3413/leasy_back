<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useField } from 'vee-validate'

interface Props {
  cityName: string
  lettersName: string
  numbersName: string
}

const props = defineProps<Props>()

const {
  value: city,
  errorMessage: cityError,
} = useField<string>(props.cityName)

const {
  value: letters,
  errorMessage: lettersError,
} = useField<string>(props.lettersName)

const {
  value: numbers,
  errorMessage: numbersError,
} = useField<string>(props.numbersName)
</script>

<template>
  <div>
    <p class="mb-1.5 text-sm font-bold text-primary">
      Kennzeichen

      <span class="ml-1 text-[10px] font-normal text-green-gray">
        *(Format: ABC DE 1234)
      </span>
    </p>

    <div class="flex items-stretch rounded-[5px] border border-green-gray">
      <div
        class="flex h-11 w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-[5px] py-1"
        style="background:#001f6a"
      >
        <Icon icon="tabler:circle-dotted" class="size-6 text-[#FECD00]" />
        <span class="text-[12px] font-bold text-white leading-none">D</span>
      </div>

      <input v-model="city" type="text" placeholder="ABC" maxlength="3"
        class="h-11 w-0 flex-1 border-x border-green-gray bg-transparent px-2 text-black text-center text-base font-extrabold uppercase outline-none"
        >
      <div class="p-1 border flex flex-col gap-1">
        <Icon icon="cib:circle" class="w-3 h-3 text-black" />
        <Icon icon="mdi:badge-outline" class="w-3.5 h-3.5 text-black" />
      </div>

      <input v-model="letters" type="text" placeholder="DE" maxlength="2"
        class="h-11 w-0 flex-1 border-r border-green-gray bg-transparent px-2 text-black text-center text-base font-extrabold uppercase outline-none"
        >

      <input v-model="numbers" type="text" placeholder="1234" maxlength="5"
        class="h-11 w-0 flex-1 border-r border-green-gray bg-transparent px-2 text-black text-center text-base font-extrabold uppercase outline-none"
       >


    </div>

    <p v-if="cityError || lettersError || numbersError" class="mt-1 text-xs text-red-500">
      {{ cityError || lettersError || numbersError }}
    </p>
  </div>
</template>