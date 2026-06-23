<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Icon } from '@iconify/vue'
import type { ButtonProps, ButtonSize, ButtonVariant } from './button.types'

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  icon: '',
  iconPosition: 'left',
  buttonClasses: '',
  disabled: false,
  type: 'button',
})

const slots = useSlots()

const useTextSlot = computed(() => Boolean(slots.default))

const base =
  'inline-flex items-center justify-center rounded-md font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-custom-orange text-white hover:opacity-90',
  secondary: 'bg-gray-100 text-black hover:bg-gray-200',
  outline: 'border border-gray-300 bg-white text-black hover:bg-gray-50',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const classes = computed(() => {
  return [
    base,
    variants[props.variant],
    sizes[props.size],
    !useTextSlot.value && props.icon ? 'w-10 p-0' : '',
    props.buttonClasses,
  ]
})
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="classes"
  >
    <Icon
      v-if="props.icon && props.iconPosition === 'left'"
      :icon="props.icon"
      class="shrink-0"
      :class="useTextSlot ? 'mr-2' : ''"
    />

    <slot />

    <Icon
      v-if="props.icon && props.iconPosition === 'right'"
      :icon="props.icon"
      class="shrink-0"
      :class="useTextSlot ? 'ml-2' : ''"
    />
  </button>
</template>