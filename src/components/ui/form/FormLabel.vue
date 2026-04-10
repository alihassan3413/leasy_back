<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string;
  forId?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  forId: '',
  required: false,
})

const hasLabel = computed(() => props.label.trim().length > 0)
</script>

<template>
  <label
    v-if="hasLabel"
    :for="forId"
  >
        
    <span>{{ label }}</span>

    <span
      v-if="required"
      class="text-red-500"
      aria-hidden="true"
    >*</span>

  </label>
</template>

