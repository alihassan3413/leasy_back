<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();

const navItems = [
  { label: 'My Dashboard', icon: 'mdi:view-dashboard-outline', name: 'dashboard' },
  { label: 'Zahlungsverlauf', icon: 'mdi:receipt-text-outline', name: null },
  { label: 'My Account', icon: 'mdi:account-outline', name: 'b2c-account' },
  { label: 'Einstellungen', icon: 'mdi:cog-outline', name: 'setting' },
]

function isActive(name: string | null) {
  return name !== null && route.name === name
}

function navigateTo(name: string | null) {
  if (!name) {
    return;
  }

  void router.push({ name });
}
</script>

<template>
  <aside
    class="flex h-full shrink-0 flex-col overflow-hidden transition-all duration-200"
    :class="open ? 'w-[250px]' : 'w-[110px]'"
    style="background-color: #10393B"
  >
    <!-- User info at top -->
    <div
      class="flex shrink-0 items-center py-5"
      :class="open ? 'gap-4 px-5' : 'justify-center px-0'"
    >
      <!-- Avatar -->
      <Avatar class="size-[70px] shrink-0 border-2 border-green-gray">
        <AvatarFallback class="text-xl font-bold" style="background-color: #B7C2C2; color: #10393B">
          {{ user?.email?.[0]?.toUpperCase() ?? 'C' }}
        </AvatarFallback>
      </Avatar>

      <!-- Name + role — only when open -->
      <div
        v-if="open"
        class="min-w-0 overflow-hidden"
      >
        <p class="truncate text-[14px] font-bold uppercase text-white">
          {{ user?.email?.split('@')[0]?.toUpperCase() ?? 'CHRISTIN MECHTILD' }}
        </p>
        <p class="text-[14px]" style="color: #FAFAFA">
          Privatkunde
        </p>
      </div>
    </div>

    <!-- Nav items -->
    <nav class="flex flex-1 flex-col">
      <button
        v-for="item in navItems"
        :key="item.label"
        class="flex h-[40px] w-full items-center transition-opacity hover:opacity-80"
        :class="open ? '' : 'justify-center'"
        type="button"
        @click="navigateTo(item.name)"
      >
        <!-- Icon -->
        <div
          class="flex shrink-0 items-center justify-center"
          :class="open ? 'w-[67px]' : 'w-full'"
        >
          <Icon
            :icon="item.icon"
            :style="{ color: isActive(item.name) ? '#01B990' : '#FFFFFF', width: '22px', height: '22px' }"
          />
        </div>

        <!-- Label — only when open -->
        <span
          v-if="open"
          class="text-[18px] leading-tight"
          :style="isActive(item.name) ? 'color: #01B990' : 'color: #FAFAFA'"
        >{{ item.label }}</span>
      </button>
    </nav>

    <!-- Logout -->
    <button
      class="flex h-[40px] w-full shrink-0 items-center transition-opacity hover:opacity-80"
      :class="open ? '' : 'justify-center'"
      @click="logout"
    >
      <div
        class="flex shrink-0 items-center justify-center"
        :class="open ? 'w-[67px]' : 'w-full'"
      >
        <Icon
          icon="mdi:logout"
          :style="{ color: '#FFFFFF', width: '22px', height: '22px' }"
        />
      </div>
      <span
        v-if="open"
        class="text-[18px]"
        style="color: #FAFAFA"
      >Ausloggen</span>
    </button>

    <!-- Toggle chevron -->
    <button
      class="flex h-10 shrink-0 items-center justify-center transition-opacity hover:opacity-80"
      style="border-top: 1px solid rgba(183,194,194,0.25)"
      @click="$emit('toggle')"
    >
      <Icon
        :icon="open ? 'mdi:chevron-left' : 'mdi:chevron-right'"
        style="width: 20px; height: 20px; color: rgba(255,255,255,0.5)"
      />
    </button>
  </aside>
</template>
