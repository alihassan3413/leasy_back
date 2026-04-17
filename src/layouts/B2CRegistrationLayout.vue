<script setup lang="ts">
import ProgressBar from '@/components/registration/b2c/ProgressBar.vue'

defineProps<{
  title: string
  currentStep: number
  totalSteps?: number
}>()
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-primary">
    <!-- Decorative dashed paths (top-right + bottom-left for whole-page coverage) -->
    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="top: -8vw; right: -22vw; width: 70vw; height: auto; opacity: 0.65"
    />
    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="top: -18vw; right: -28vw; width: 75vw; height: auto"
    />
    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="bottom: -28vw; left: -25vw; width: 75vw; height: auto; opacity: 0.65"
    />
    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="bottom: -18vw; left: -22vw; width: 70vw; height: auto"
    />

    <!-- Content column -->
    <div class="relative z-10 mx-auto flex min-h-screen max-w-[720px] flex-col items-stretch px-6 pt-16 pb-10">
      <h1 class="text-[28px] font-bold leading-tight text-white md:text-[32px]">
        {{ title }}
      </h1>

      <ProgressBar :current-step="currentStep" :total-steps="totalSteps ?? 4" class="mt-6 mb-8" />

      <slot />
    </div>
  </div>
</template>
