<script setup lang="ts">
defineProps<{ currentStep: number; totalSteps?: number }>()
</script>

<template>
  <div class="mb-6 flex items-center gap-2">
    <template v-for="step in (totalSteps ?? 4)" :key="step">
      <div
        class="h-1.5 flex-1 rounded-full transition-colors duration-300"
        :class="step <= currentStep ? 'bg-custom-green' : 'bg-green-gray/40'"
      />
    </template>
  </div>
</template>
