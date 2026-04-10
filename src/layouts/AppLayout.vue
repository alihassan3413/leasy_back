<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { fullName, userRole, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Top navigation -->
    <header
      class="
        bg-white border-b border-gray-200 h-16 flex items-center px-6 shrink-0
      "
    >
      <span class="font-bold text-gray-900 text-lg tracking-tight mr-auto">Leasyback</span>

      <div class="flex items-center gap-4 text-sm text-gray-600">
        <span>{{ fullName }}</span>
        <span
          class="
            text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5
            rounded-full uppercase
          "
        >
          {{ userRole }}
        </span>
        <button
          class="
            text-red-500
            hover:text-red-700
            transition-colors
          "
          @click="logout"
        >
          Sign out
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 p-6">
      <RouterView />
    </main>
  </div>
</template>
