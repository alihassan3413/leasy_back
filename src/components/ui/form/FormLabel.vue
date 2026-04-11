<script setup lang="ts">
import { computed } from 'vue'
import type { FormLabelProps } from './form-label.types'

const props = withDefaults(defineProps<FormLabelProps>(), {
  label: '',
  forId: '',
  required: false,
  labelClasses: '',
})

const hasLabel = computed(() => props.label.trim().length > 0)

const classes = computed(() => {
  return [
    'mb-1.5 block text-sm font-bold text-custom-black',
    props.labelClasses,
  ]
})
</script>

<template>
  <label
    v-if="hasLabel"
    :for="props.forId"
    class="flex items-start justify-start gap-1"
  >
    <span :class="classes">
      {{ props.label }}
    </span>

    <span
      v-if="props.required"
      class="text-red-500"
      aria-hidden="true"
    >
      *
    </span>
  </label>
</template>