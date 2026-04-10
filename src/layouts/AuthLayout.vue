<script setup lang="ts">
// Intentionally empty — layout is purely structural.
// Swap the markup here when Figma designs are ready.
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12"
  >
    <div class="w-full max-w-md">
      <!-- Brand mark -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
          Leasyback
        </h1>
      </div>

      <!-- Auth card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <RouterView />
      </div>
    </div>
  </div>
</template>
