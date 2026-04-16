<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import AppSidebar from '@/components/dashboard/AppSidebar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <!-- Top bar — dark green -->
    <header
      class="flex h-[60px] shrink-0 items-center justify-between px-8"
      style="background-color: #10393B"
    >
      <!-- Logo -->
      <span class="text-xl font-bold tracking-tight text-white">LeasyBack</span>

      <!-- Right icons -->
      <div class="flex items-center gap-5">
        <!-- Support -->
        <button class="text-white/80 transition-colors hover:text-white">
          <Icon
            icon="mdi:help-circle-outline"
            class="size-6"
          />
        </button>

        <!-- Notifications -->
        <button class="relative text-white/80 transition-colors hover:text-white">
          <Icon
            icon="mdi:bell-outline"
            class="size-6"
          />
          <span
            class="absolute -right-2 -top-2 flex size-[19px] items-center justify-center rounded-full text-[11px] font-bold text-white"
            style="background-color: #EF8450"
          >9</span>
        </button>

        <!-- Info -->
        <button class="text-white/80 transition-colors hover:text-white">
          <Icon
            icon="mdi:information-outline"
            class="size-6"
          />
        </button>
      </div>
    </header>

    <!-- Body: sidebar + main -->
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar
        :open="sidebarOpen"
        @toggle="sidebarOpen = !sidebarOpen"
      />

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto bg-white p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
