<script setup lang="ts">
const props = withDefaults(
  defineProps<{ currentStep: number; totalSteps?: number }>(),
  { totalSteps: 4 },
)
</script>

<template>
  <div class="relative flex items-center justify-between">
    <!-- Background line spanning behind circles. Per Figma: 10px tall, light gray. -->
    <div class="absolute left-2.5 right-2.5 h-[10px] rounded-full bg-[#D9D9D9]" />

    <!-- Circles -->
    <div
      v-for="step in props.totalSteps"
      :key="step"
      class="relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300"
      :class="step <= props.currentStep ? 'bg-custom-green' : 'bg-[#D9D9D9]'"
    >
      <!-- Inner white dot for the active step only -->
      <div
        v-if="step === props.currentStep"
        class="h-1.5 w-1.5 rounded-full bg-white"
      />
    </div>
  </div>
</template>
