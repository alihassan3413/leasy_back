<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const isHovered = ref(false)
const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();

const navItems = [
  { label: 'My Dashboard', icon: 'mdi:view-dashboard-outline', name: 'dashboard' },
  { label: 'Zahlungsverlauf', icon: 'fa6-solid:list-check', name: 'payment' },
  { label: 'My Account', icon: 'mdi:account-outline', name: 'b2c-account' },
  { label: 'Einstellungen', icon: 'mdi:cog-outline', name: 'setting' },
]

function isActive(name: string | null) {
  if (!name) return false

  if (name === 'dashboard') {
    return route.name === 'dashboard' || route.name === 'dashboard-b2b'
  }
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
  <aside class=" flex  h-[500px] shrink-0 flex-col overflow-hidden mt-4 absolute left-0 top-0 z-50 transition-all duration-500 ease-in-out"
    :class="isHovered ? 'w-[250px]' : 'w-[110px]'" style="background-color: #10393B" @mouseenter="isHovered = true"
    @mouseleave="isHovered = false">
    <!-- User info at top -->
    <div class="flex shrink-0 items-center py-5" :class="isHovered ? 'gap-4 px-5' : 'justify-center px-0'">
      <!-- Avatar -->
      <Avatar class="size-[70px] shrink-0 border-2 border-green-gray">
        <AvatarFallback class="text-xl font-bold" style="background-color: #B7C2C2; color: #10393B">
          {{ user?.email?.[0]?.toUpperCase() ?? 'C' }}
        </AvatarFallback>
      </Avatar>

      <!-- Name + role — only when open -->
      <div v-if="isHovered" class="min-w-0 overflow-hidden">
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
    <div v-for="item in navItems" :key="item.label" >
        <button 
        class="flex h-[40px] w-full items-center transition-opacity hover:opacity-80"
        :class="isHovered ? '' : 'justify-center'" type="button" @click=" navigateTo(item.name)">
        <!-- Icon -->
        <div class="flex shrink-0 items-center justify-center transition-all duration-500 ease-in-out"
          :class="isHovered ? 'w-[67px]' : 'w-full'">
          <Icon :icon="item.icon"
            :style="{ color: isActive(item.name) ? '#01B990' : '#FFFFFF', width: '22px', height: '22px' }" />
        </div>

        <!-- Label — only when open -->
        <span v-if="isHovered" class="text-[18px] leading-tight transition-all duration-500 ease-in-out"
          :style="isActive(item.name) ? 'color: #01B990' : 'color: #FAFAFA'">{{ item.label }}</span>
          <div>
          
          </div>
      </button>
      
    </div>
    
      <!-- Logout -->
      <button class="flex h-[40px] w-full shrink-0 items-center transition-opacity hover:opacity-80 "
        :class="isHovered ? '' : 'justify-center'" @click="logout">
        <div class="flex shrink-0 items-center justify-center transition-all duration-500 ease-in-out"
          :class="isHovered ? 'w-16.75' : 'w-full'">
          <Icon icon="mdi:logout" :style="{ color: '#FFFFFF', width: '22px', height: '22px' }" />
        </div>
        <span v-if="isHovered" class="text-[18px] text-white transition-all duration-500 ease-in-out"
          style="color: #FAFAFA">Ausloggen</span>
      </button>
    </nav>

  </aside>
</template>
