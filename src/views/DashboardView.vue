<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { fullName, userRole } = useAuth()
</script>

<template>
  <div>
    <h2 class="text-2xl font-semibold text-gray-900 mb-1">
      Welcome back, {{ fullName }}
    </h2>
    <p class="text-gray-500 text-sm">
      Role: {{ userRole }}
    </p>
  </div>
</template>
