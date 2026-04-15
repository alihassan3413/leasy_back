<script setup lang="ts"></script>

<template>
  <div class="relative min-h-screen bg-primary overflow-hidden">
    <img
      src="/src/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="left: -6vw; top: 1vw; width: 114vw; height: auto; opacity: 0.54"
    />
    <img
      src="/src/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="left: -19vw; top: -4vw; width: 105vw; height: auto"
    />
    <div
      class="relative z-10 flex items-center justify-center min-h-screen pt-16"
    >
      <div class="w-full max-w-200 flex flex-col items-start min-h-screen">
        <slot />
      </div>
    </div>

    <img
      src="/src/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="right: -10vw; bottom: -50vw; width: 114vw; height: auto"
    />
    <img
      src="/src/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="right: 0; bottom: -30vw; width: 114vw; height: auto"
    />
  </div>
</template>
