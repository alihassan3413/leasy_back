<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import type { UserRole } from "@/types";

const isHovered = ref(false);
const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();

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
    { label: "My Dashboard", icon: "mdi:view-dashboard-outline", name: "dashboard-b2c" },
    { label: "Zahlungsverlauf", icon: "fa6-solid:list-check", name: "payment" },
    { label: "My Account", icon: "mdi:account-outline", name: "b2c-account" },
    { label: "Einstellungen", icon: "mdi:cog-outline", name: "setting" },
  ],
  B2B: [
    { label: "My Dashboard", icon: "mdi:view-dashboard-outline", name: "dashboard-b2b" },
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
    { label: "Admin Panel", icon: "mdi:shield-crown-outline", name: "admin" },
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

const displayName = computed(() => {
  // Prefer a real name from the profile; fall back to email local part.
  const fullName = [user.value?.firstName, user.value?.lastName]
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName.toUpperCase();
  return user.value?.email?.split("@")[0]?.toUpperCase() ?? "";
});

const avatarInitial = computed(
  () =>
    user.value?.firstName?.[0]?.toUpperCase() ??
    user.value?.email?.[0]?.toUpperCase() ??
    "?",
);

function isActive(item: NavItem): boolean {
  if (route.name === item.name) return true;
  return item.aliases?.includes(route.name as string) ?? false;
}

function navigateTo(name: string) {
  void router.push({ name });
}
</script>

<template>
  <aside
    class="absolute left-0 top-0 z-50 mt-4 flex h-[500px] shrink-0 flex-col overflow-hidden transition-all duration-500 ease-in-out"
    :class="isHovered ? 'w-[250px]' : 'w-[110px]'"
    style="background-color: #10393b"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- User info at top -->
    <div
      class="flex shrink-0 items-center py-5"
      :class="isHovered ? 'gap-4 px-5' : 'justify-center px-0'"
    >
      <Avatar class="size-[70px] shrink-0 border-2 border-green-gray">
        <AvatarFallback
          class="text-xl font-bold"
          style="background-color: #b7c2c2; color: #10393b"
        >
          {{ avatarInitial }}
        </AvatarFallback>
      </Avatar>

      <div v-if="isHovered" class="min-w-0 overflow-hidden">
        <p class="truncate text-[14px] font-bold uppercase text-white">
          {{ displayName }}
        </p>
        <p class="text-[14px]" style="color: #fafafa">
          {{ roleLabel }}
        </p>
      </div>
    </div>

    <!-- Nav items -->
    <nav class="flex flex-1 flex-col">
      <button
        v-for="item in navItems"
        :key="item.name"
        type="button"
        class="flex h-[40px] w-full items-center transition-opacity hover:opacity-80"
        :class="isHovered ? '' : 'justify-center'"
        @click="navigateTo(item.name)"
      >
        <div
          class="flex shrink-0 items-center justify-center transition-all duration-500 ease-in-out"
          :class="isHovered ? 'w-[67px]' : 'w-full'"
        >
          <Icon
            :icon="item.icon"
            :style="{
              color: isActive(item) ? '#01B990' : '#FFFFFF',
              width: '22px',
              height: '22px',
            }"
          />
        </div>

        <span
          v-if="isHovered"
          class="text-[18px] leading-tight transition-all duration-500 ease-in-out"
          :style="isActive(item) ? 'color: #01B990' : 'color: #FAFAFA'"
        >
          {{ item.label }}
        </span>
      </button>

      <!-- Logout -->
      <button
        type="button"
        class="flex h-[40px] w-full shrink-0 items-center transition-opacity hover:opacity-80"
        :class="isHovered ? '' : 'justify-center'"
        @click="logout"
      >
        <div
          class="flex shrink-0 items-center justify-center transition-all duration-500 ease-in-out"
          :class="isHovered ? 'w-[67px]' : 'w-full'"
        >
          <Icon
            icon="mdi:logout"
            :style="{ color: '#FFFFFF', width: '22px', height: '22px' }"
          />
        </div>
        <span
          v-if="isHovered"
          class="text-[18px] transition-all duration-500 ease-in-out"
          style="color: #fafafa"
        >
          Ausloggen
        </span>
      </button>
    </nav>
  </aside>
</template>