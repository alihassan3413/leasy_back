<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useTimeSlots } from "@/composables/useTimeSlots";

interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  startTime?: string;
  endTime?: string;
  intervalMinutes?: number;
  inputHeight?: string;
  inputRounded?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  placeholder: "Uhrzeit wählen",
  startTime: "08:00",
  endTime: "16:00",
  intervalMinutes: 30,
  inputHeight: "h-8",
  inputRounded: "rounded-full",
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const pickerRef = ref<HTMLElement | null>(null);

const { timeSlots } = useTimeSlots({
  startTime: props.startTime,
  endTime: props.endTime,
  intervalMinutes: props.intervalMinutes,
});

const displayValue = computed(() => {
  return props.modelValue || props.placeholder;
});

function selectTime(time: string) {
  emit("update:modelValue", time);
  isOpen.value = false;
}

// Close on outside click
function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

import { onMounted, onUnmounted } from "vue";

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="flex flex-col gap-1" ref="pickerRef">
    <label v-if="label" class="text-xs md:text-sm font-semibold text-black">
      {{ label }}
    </label>
    <div class="relative">
      <button
        type="button"
        :disabled="disabled"
        @click="!disabled && (isOpen = !isOpen)"
        :class="[
          'flex w-full items-center justify-between border border-gray-300 bg-white px-3 text-left text-sm outline-none transition focus:border-emerald-500',
          inputHeight,
          inputRounded,
          disabled ? 'cursor-not-allowed opacity-50' : '',
        ]"
      >
        <span :class="modelValue ? 'text-gray-800' : 'text-gray-400'">
          {{ displayValue }}
        </span>
        <Icon
          icon="mdi:chevron-down"
          class="text-gray-500 text-[20px]"
          :class="{ 'rotate-180': isOpen }"
        />
      </button>
      <div
        v-if="isOpen"
        class="absolute top-full z-[10000] left-0 right-0 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
      >
        <div
          v-for="time in timeSlots"
          :key="time"
          @click="selectTime(time)"
          class="px-4 py-2 cursor-pointer hover:bg-gray-50"
          :class="{ 'bg-emerald-50 text-emerald-700': modelValue === time }"
        >
          {{ time }}
        </div>
      </div>
    </div>
  </div>
</template>
