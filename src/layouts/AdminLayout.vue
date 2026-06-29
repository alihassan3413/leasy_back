<script setup lang="ts">
import { ref } from "vue";
import AdminSidebar from "@/components/admin/AdminSidebar.vue";
import leasybackLogo from "@/assets/logo/leasyback-stacked.png";

const mobileNavOpen = ref(false);
</script>

<template>
  <!--
    h-screen + overflow-hidden on the root makes the sidebar's
    `sticky top-0 h-screen` actually pin correctly on desktop.
    Below `lg` the sidebar becomes an off-canvas drawer (see AdminSidebar)
    and a top bar with a hamburger is shown instead.
    The right column scrolls independently inside its own div.
  -->
  <div
    class="flex h-screen overflow-hidden font-[Manrope,sans-serif] text-[#1a2e2f] p-2 sm:p-4 gap-4"
    style="
      background:
        radial-gradient(900px 500px at 78% -5%, rgba(1, 185, 144, 0.06), transparent 55%),
        radial-gradient(700px 420px at 0% 100%, rgba(16, 57, 59, 0.045), transparent 50%),
        linear-gradient(180deg, #fbfcfb 0%, #f3f6f5 100%);
    "
  >
    <!-- Mobile drawer overlay -->
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-[70] bg-black/40 lg:hidden"
      @click="mobileNavOpen = false"
    />

    <!-- Sidebar: drawer on mobile, sticky on desktop -->
    <AdminSidebar :mobile-open="mobileNavOpen" @close="mobileNavOpen = false" />

    <!-- right side: each page controls its own scroll -->
    <div class="relative z-10 flex-1 flex flex-col min-w-0 gap-3 sm:gap-4 overflow-y-auto">
      <!-- Mobile top bar -->
      <div
        class="lg:hidden flex items-center gap-3 rounded-[16px] px-3 py-2.5 shrink-0"
        style="
          background: linear-gradient(180deg, #10393b 0%, #0d3133 100%);
          box-shadow: 0 4px 16px rgba(16, 57, 59, 0.15);
        "
      >
        <button
          @click="mobileNavOpen = true"
          class="flex items-center justify-center w-9 h-9 rounded-[11px] text-white hover:bg-white/10 transition-colors"
          aria-label="Menü öffnen"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <img :src="leasybackLogo" alt="LeasyBack" class="h-7 w-auto object-contain" />
      </div>

      <RouterView />
    </div>
  </div>
</template>
