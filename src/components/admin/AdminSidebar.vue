<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import leasybackLogo from "@/assets/logo/leasyback-stacked.png";

const collapsed = ref(false);
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const nav = [
  {
    id: "dashboard",
    label: "Dashboard",
    name: "admin",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  },
  {
    id: "kunden",
    label: "Kunden",
    name: "admin-kunden",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  },
  {
    id: "fahrzeuge",
    label: "Fahrzeuge",
    name: "admin-fahrzeuge",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-1"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
  },
  {
    id: "auftraege",
    label: "Alle Aufträge",
    name: "admin-auftraege",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>`,
  },
];

const userName = computed(() => {
  const u = auth.user;
  if (!u) return "Administrator";
  if ((u as any).first_name && (u as any).last_name)
    return `${(u as any).first_name} ${(u as any).last_name}`;
  if ((u as any).name) return (u as any).name;
  if ((u as any).email) return (u as any).email;
  return "Administrator";
});

const userInitials = computed(() => {
  const parts = userName.value.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : userName.value.slice(0, 2).toUpperCase();
});

const userRoleLabel = computed(() => {
  const r = (auth.user as any)?.user_type ?? (auth as any).userRole ?? "Admin";
  return (
    (
      {
        ADMIN: "Administrator",
        Admin: "Administrator",
        B2B: "B2B Nutzer",
        B2C: "B2C Nutzer",
      } as any
    )[r] ?? r
  );
});

function isActive(name: string) {
  return route.name === name;
}
function navigateTo(name: string) {
  void router.push({ name });
}
async function logout() {
  await auth.logout();
  void router.push({ name: "login" });
}
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
      class="flex items-center mb-6 shrink-0 overflow-hidden px-1"
      :class="collapsed ? 'justify-center' : ''"
    >
      <img
        :src="leasybackLogo"
        alt="LeasyBack"
        class="h-auto object-contain shrink-0"
        :class="collapsed ? 'w-full' : 'w-[70%]'"
      />
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
    <nav class="flex-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden min-h-0 pr-0.5">
      <p
        v-if="!collapsed"
        class="text-[10px] font-bold text-white/25 uppercase tracking-[0.13em] px-3 mb-2 mt-1 shrink-0"
      >
        Menü
      </p>

      <button
        v-for="item in nav"
        :key="item.id"
        @click="navigateTo(item.name)"
        class="group relative flex items-center gap-3 h-[44px] rounded-[13px] transition-all duration-150 shrink-0 w-full text-left"
        :class="[
          collapsed ? 'justify-center px-0' : 'px-3',
          isActive(item.name)
            ? 'bg-[#01B990] text-[#10393b] font-bold shadow-[0_6px_16px_rgba(1,185,144,0.28)]'
            : 'text-white/55 hover:bg-white/[0.07] hover:text-white',
        ]"
      >
        <span class="flex items-center shrink-0" v-html="item.icon"></span>

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
        @click="logout"
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
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <transition name="lb-fade">
          <span v-if="!collapsed" class="text-[13px] font-medium">Abmelden</span>
        </transition>
        <span
          v-if="collapsed"
          class="absolute left-[58px] whitespace-nowrap pointer-events-none bg-[#10393b] text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[70]"
          >Abmelden</span
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
            <div class="text-[12.5px] font-bold text-white truncate">{{ userName }}</div>
            <div class="text-[10.5px] text-white/40">{{ userRoleLabel }}</div>
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
