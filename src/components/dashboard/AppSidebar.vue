<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { UserRole } from "@/types";
import { useB2BStore } from "@/stores/b2b.store";
import leasybackLogo from "@/assets/logo/leasyback-logo.svg";

const collapsed = ref(false);
const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();
const b2bStore = useB2BStore();

interface NavItem {
  label: string;
  icon: string;
  /** Route name to navigate to. */
  name: string;
  /** Extra route names that should also light this item up. */
  aliases?: string[];
}

// Per-role nav. Account and Dashboard entries differ; settings & payment are shared.
const navByRole: Record<UserRole, NavItem[]> = {
  B2C: [
    {
      label: "My Dashboard",
      icon: "mdi:view-dashboard-outline",
      name: "dashboard-b2c",
    },
    { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "My Account", icon: "mdi:account-outline", name: "b2c-account" },
    { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  B2B: [
    {
      label: "My Dashboard",
      icon: "mdi:view-dashboard-outline",
      name: "dashboard-b2b",
    },
    { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "My Account", icon: "mdi:account-outline", name: "b2b-account" },
    { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  WORKSHOP: [
    // Workshops don't have a dashboard or account view yet — only shared routes.
    { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  ADMIN: [
    { label: "Dashboard", icon: "mdi:view-dashboard-outline", name: "admin" },
    {
      label: "Kunden / Benutzer",
      icon: "mdi:account-group-outline",
      name: "admin-users",
    },
    { label: "Fahrzeuge", icon: "mdi:car-outline", name: "admin-vehicles" },
    {
      label: "Alle Aufträge",
      icon: "mdi:file-document-outline",
      name: "admin-orders",
    },
    { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
};

const roleLabels: Record<UserRole, string> = {
  B2C: "Privatkunde",
  B2B: "Firmenkunde",
  WORKSHOP: "Werkstatt",
  ADMIN: "Administrator",
};

const navItems = computed<NavItem[]>(() => {
  const role = user.value?.role as UserRole | undefined;
  return role ? navByRole[role] : [];
});

const roleLabel = computed(() => {
  const role = user.value?.role as UserRole | undefined;
  return role ? roleLabels[role] : "";
});

const userName = computed(() => {
  const fullName = [user.value?.firstName, user.value?.lastName]
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;
  if (user.value?.email) return user.value.email;
  return "";
});

const userInitials = computed(() => {
  const parts = userName.value.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : userName.value.slice(0, 2).toUpperCase();
});

const avatarLogoUrl = computed(() => {
  if (user.value?.role !== "B2B") return "";
  return b2bStore.logoUrl;
});

function isActive(name: string) {
  return route.name === name;
}
function navigateTo(name: string) {
  void router.push({ name });
}
async function handleLogout() {
  await logout();
  void router.push({ name: "login" });
}

watch(
  () => user.value?.role,
  async (role) => {
    if (role !== "B2B") return;

    try {
      await b2bStore.fetchProfile();
    } catch (error) {
      console.error("Failed to fetch B2B profile for sidebar:", error);
    }
  },
  { immediate: true },
);
</script>

<template>
  <!--
    KEY FIX: overflow-visible on the aside so the collapse toggle
    button (position absolute, -right-3) is NOT clipped.
    Height is controlled by sticky + h-screen.
    Inner scroll is handled by the <nav> having overflow-y-auto.
  -->
  <aside
    class="sticky top-0 h-screen flex flex-col py-5 rounded-[22px] shrink-0 z-50 transition-[width] duration-300 ease-out"
    :class="collapsed ? 'w-[78px] px-3' : 'w-[224px] px-4'"
    style="
      background: linear-gradient(180deg, #10393b 0%, #0d3133 100%);
      box-shadow: 0 8px 30px rgba(16, 57, 59, 0.18);
      overflow: visible;
    "
  >
    <!-- ── BRAND ── -->
    <div
      class="flex items-center gap-2.5 px-1 h-10 mb-7 shrink-0 overflow-hidden"
    >
      <!-- <div
        class="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
        style="
          background: linear-gradient(150deg, #01b990, #10393b);
          box-shadow: 0 4px 12px rgba(1, 185, 144, 0.3);
        "
      >
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
          <path d="M6 11 L11 6 L16 11 L11 16 Z" fill="white" opacity="0.95" />
        </svg>
      </div> -->
      <transition name="lb-fade">
        <div
          v-if="!collapsed"
          class="flex flex-col leading-none whitespace-nowrap overflow-hidden"
        >
          <img
            :src="leasybackLogo"
            alt="LeasyBack"
            class="h-5.5 w-auto shrink-0"
          />
          <!-- <span
            class="text-[9.5px] font-bold text-white/35 uppercase tracking-[0.1em] mt-1"
            >{{ user.value?.role === "ADMIN" ? "Admin" : "App" }}</span -->
          <!-- > -->
        </div>
      </transition>
    </div>

    <!-- ── COLLAPSE TOGGLE ──
         sits outside overflow:hidden scope because aside is overflow:visible now.
         rounded-full white pill on the right edge.
    -->
    <button
      @click="collapsed = !collapsed"
      class="absolute -right-3 top-7 z-[60] w-6 h-6 rounded-full bg-white border border-[#d8e4e3] flex items-center justify-center text-[#6f8585] hover:text-[#10393b] hover:scale-110 hover:border-[#01B990] transition-all duration-200"
      style="box-shadow: 0 2px 10px rgba(16, 57, 59, 0.15)"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        class="transition-transform duration-300"
        :class="collapsed ? '' : 'rotate-180'"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>

    <!-- ── NAV — takes all remaining vertical space, scrolls if needed ── -->
    <nav
      class="flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden min-h-0 pr-0.5"
    >
      <p
        v-if="!collapsed"
        class="text-[10px] font-bold text-white/25 uppercase tracking-[0.13em] px-3 mb-2 mt-1 shrink-0"
      >
        Menü
      </p>

      <button
        v-for="item in navItems"
        :key="item.name"
        @click="navigateTo(item.name)"
        class="group relative flex items-center gap-3 h-[44px] rounded-[13px] transition-all duration-150 shrink-0 w-full text-left"
        :class="[
          collapsed ? 'justify-center px-0' : 'px-3',
          isActive(item.name)
            ? 'bg-[#01B990] text-[#10393b] font-bold shadow-[0_6px_16px_rgba(1,185,144,0.28)]'
            : 'text-white/55 hover:bg-white/[0.07] hover:text-white',
        ]"
      >
        <span v-if="item.icon" class="flex items-center shrink-0">
          <Icon :icon="item.icon" :style="{ width: '18px', height: '18px' }" />
        </span>

        <transition name="lb-fade">
          <span
            v-if="!collapsed"
            class="text-[13.5px] whitespace-nowrap flex-1 overflow-hidden text-ellipsis"
            :class="isActive(item.name) ? 'font-bold' : 'font-medium'"
            >{{ item.label }}</span
          >
        </transition>

        <!-- active left accent bar -->
        <span
          v-if="isActive(item.name) && !collapsed"
          class="absolute -left-4 top-3 bottom-3 w-[3px] rounded-r-full bg-[#01B990]"
        ></span>

        <!-- collapsed tooltip -->
        <span
          v-if="collapsed"
          class="absolute left-[58px] whitespace-nowrap pointer-events-none bg-[#10393b] text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[70]"
          style="box-shadow: 0 4px 12px rgba(16, 57, 59, 0.25)"
          >{{ item.label }}</span
        >
      </button>
    </nav>

    <!-- ── FOOTER — always pinned at bottom ── -->
    <div
      class="shrink-0 pt-3 mt-3 overflow-hidden"
      style="border-top: 1px solid rgba(255, 255, 255, 0.08)"
    >
      <!-- Logout -->
      <button
        @click="handleLogout"
        class="group relative flex items-center gap-3 w-full rounded-[13px] mb-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white/75 transition-all"
        :class="collapsed ? 'justify-center p-2.5' : 'px-3 py-2'"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="shrink-0"
        >
          <path
            d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
          />
        </svg>
        <transition name="lb-fade">
          <span v-if="!collapsed" class="text-[13px] font-medium"
            >Ausloggen</span
          >
        </transition>
        <span
          v-if="collapsed"
          class="absolute left-[58px] whitespace-nowrap pointer-events-none bg-[#10393b] text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[70]"
          >Ausloggen</span
        >
      </button>

      <!-- User pill -->
      <div
        class="flex items-center gap-2.5 rounded-[13px] hover:bg-white/[0.06] transition-all cursor-pointer"
        :class="collapsed ? 'justify-center p-1.5' : 'p-2'"
      >
        <div
          class="w-9 h-9 rounded-[11px] text-white text-[12px] font-extrabold flex items-center justify-center shrink-0"
          style="background: linear-gradient(150deg, #01b990, #10393b)"
        >
          {{ userInitials }}
        </div>
        <transition name="lb-fade">
          <div v-if="!collapsed" class="flex-1 min-w-0 overflow-hidden">
            <div class="text-[12.5px] font-bold text-white truncate">
              {{ userName }}
            </div>
            <div class="text-[10.5px] text-white/40">{{ roleLabel }}</div>
          </div>
        </transition>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.18s ease;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}
</style>
