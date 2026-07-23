<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { UserRole } from "@/types";
import { Icon } from "@iconify/vue";
import AppSidebar from "@/components/dashboard/AppSidebar.vue";

const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();

interface NavItem {
  label: string;
  icon: string;
  name: string;
  aliases?: string[];
}

// Settings & payment entries are commented out for now (pages hidden, routes
// disabled in routes.ts) — re-enable together.
const navByRole: Record<UserRole, NavItem[]> = {
  B2C: [
    {
      label: "Mein Dashboard",
      icon: "mdi:view-dashboard-outline",
      name: "dashboard-b2c",
    },
    // { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "Mein Konto", icon: "mdi:account-outline", name: "b2c-account" },
    // { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  B2B: [
    {
      label: "Mein Dashboard",
      icon: "mdi:view-dashboard-outline",
      name: "dashboard-b2b",
    },
    // { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "Mein Konto", icon: "mdi:account-outline", name: "b2b-account" },
    // { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  WORKSHOP: [
    // { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    // { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  ADMIN: [],
};

const navItems = computed<NavItem[]>(() => {
  const role = user.value?.role as UserRole | undefined;
  return role ? navByRole[role] : [];
});

function isActive(name: string) {
  return route.name === name;
}

function navigateTo(name: string) {
  void router.push({ name });
}

const handleLogout = () => {
  void logout();
};
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden md:m-4">
    <!-- Body: sidebar (desktop only) + main. A single RouterView is shared
         across breakpoints — previously desktop and mobile each had their own
         RouterView, which double-mounted the routed view (and anything it
         auto-opens, like the onboarding popup, whose Dialog teleports to
         <body> and so ignored the CSS `hidden` on its mobile/desktop wrapper). -->
    <div class="flex flex-1 flex-col overflow-hidden relative md:flex-row">
      <div class="hidden md:block">
        <AppSidebar />
      </div>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto bg-white overflow-hidden md:p-6">
        <RouterView />
      </main>
    </div>

    <!-- Bottom tab bar for mobile -->
    <nav
      class="flex items-center justify-around py-3 px-2 shrink-0 z-50 md:hidden"
      style="
        background: linear-gradient(180deg, #10393b 0%, #0d3133 100%);
        box-shadow: 0 -8px 30px rgba(16, 57, 59, 0.18);
      "
    >
      <button
        v-for="item in navItems"
        :key="item.name"
        @click="navigateTo(item.name)"
        class="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all"
        :class="isActive(item.name) ? 'text-[#01B990]' : 'text-white/55 hover:text-white'"
      >
        <Icon :icon="item.icon" :style="{ width: '24px', height: '24px' }" />
      </button>
      <button
        @click="handleLogout"
        class="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all text-white/55 hover:text-white"
      >
        <Icon icon="mdi:logout" :style="{ width: '24px', height: '24px' }" />
      </button>
    </nav>
  </div>
</template>
