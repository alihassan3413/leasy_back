<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="relative w-full sm:w-[280px]">
    <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9bb0af]">
      <Icon icon="mdi:magnify" class="size-[18px]" />
    </span>
    <input
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="placeholder ?? 'Suchen…'"
      type="text"
      class="h-10 w-full rounded-full border border-[#eaf0ef] bg-white pl-10 pr-9 text-[13px] font-medium text-[#10393b] placeholder:text-[#9bb0af] outline-none transition-colors focus:border-[#10393b]"
    />
    <button
      v-if="modelValue"
      type="button"
      @click="emit('update:modelValue', '')"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9bb0af] transition-colors hover:text-[#10393b]"
      title="Suche zurücksetzen"
    >
      <Icon icon="mdi:close-circle" class="size-[18px]" />
    </button>
  </div>
</template>
