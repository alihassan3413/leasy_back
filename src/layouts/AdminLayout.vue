<script setup lang="ts">
import AdminSidebar from "@/components/admin/AdminSidebar.vue";
</script>

<template>
  <!--
    h-screen + overflow-hidden on the root makes the sidebar's
    `sticky top-0 h-screen` actually pin correctly.
    The right column scrolls independently inside its own div.
  -->
  <div
    class="flex h-screen overflow-hidden font-[Manrope,sans-serif] text-[#1a2e2f] p-4 gap-4"
    style="
      background:
        radial-gradient(900px 500px at 78% -5%, rgba(1, 185, 144, 0.06), transparent 55%),
        radial-gradient(700px 420px at 0% 100%, rgba(16, 57, 59, 0.045), transparent 50%),
        linear-gradient(180deg, #fbfcfb 0%, #f3f6f5 100%);
    "
  >
    <!-- sidebar stays fixed on the left, never scrolls -->
    <AdminSidebar />

    <!-- right side: each page controls its own scroll -->
    <div class="relative z-10 flex-1 flex flex-col min-w-0 gap-4 overflow-y-auto">
      <RouterView />
    </div>
  </div>
</template>
