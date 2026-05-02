<script setup lang="ts">
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
        class="flex h-[34px] w-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-[5px] bg-primary py-1"
      >
        <div
          class="flex flex-col overflow-hidden rounded-sm"
          style="width: 18px; height: 12px"
        >
          <div style="flex: 1; background: #000" />
          <div style="flex: 1; background: #D00" />
          <div style="flex: 1; background: #FFCE00" />
        </div>

        <span class="text-[9px] font-bold leading-none text-white">
          D
        </span>
      </div>

      <input
        v-model="city"
        type="text"
        placeholder="ABC"
        maxlength="3"
        class="h-[34px] w-0 flex-1 border-x border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
        :class="cityError ? 'border-red-400 bg-red-50' : ''"
      >

      <input
        v-model="letters"
        type="text"
        placeholder="DE"
        maxlength="2"
        class="h-[34px] w-0 flex-1 border-r border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
        :class="lettersError ? 'border-red-400 bg-red-50' : ''"
      >

      <input
        v-model="numbers"
        type="text"
        placeholder="1234"
        maxlength="5"
        class="h-[34px] w-0 flex-1 border-r border-green-gray bg-white px-2 text-center text-sm font-medium uppercase outline-none"
        :class="numbersError ? 'border-red-400 bg-red-50' : ''"
      >

      <div
        class="flex h-[34px] w-9 shrink-0 items-center justify-center rounded-r-[5px] bg-white"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary"
        >
          <span class="text-[7px] font-bold leading-none text-primary">
            TÜV
          </span>
        </div>
      </div>
    </div>

    <p
      v-if="cityError || lettersError || numbersError"
      class="mt-1 text-xs text-red-500"
    >
      {{ cityError || lettersError || numbersError }}
    </p>
  </div>
</template>