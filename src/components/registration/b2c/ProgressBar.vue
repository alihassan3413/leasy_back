<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    currentStep: number
    totalSteps?: number
  }>(),
  {
    totalSteps: 4,
  },
)

const progressScale = computed(() => {
  if (props.totalSteps <= 1) return 0

  const safeCurrentStep = Math.min(
    Math.max(props.currentStep, 1),
    props.totalSteps,
  )

  return (safeCurrentStep - 1) / (props.totalSteps - 1)
})
</script>

<template>
  <div class="relative flex w-full items-center justify-between">
    <div
      class="absolute left-2.5 right-2.5 h-[10px] rounded-full bg-[#D9D9D9]"
    />

    <div
      class="absolute left-2.5 right-2.5 h-[10px] origin-left rounded-full bg-custom-green transition-transform duration-300"
      :style="{ transform: `scaleX(${progressScale})` }"
    />

    <div
      v-for="step in props.totalSteps"
      :key="step"
      class="relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300"
      :class="step <= props.currentStep ? 'bg-custom-green' : 'bg-[#D9D9D9]'"
    >
      <div
        v-if="step === props.currentStep"
        class="h-1.5 w-1.5 rounded-full bg-white"
      />
    </div>
  </div>
</template>