<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    options: Array<{ label: string; value: string }>
    modelValue: string
    fullWidth?: boolean
  }>(),
  {
    options: [],
    modelValue: '',
    fullWidth: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function select(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div :class="['inline-flex overflow-hidden rounded-full border border-[#d9e2e2]', props.fullWidth ? 'w-full' : '']">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="flex-1 min-w-[110px] px-4 py-2 text-sm font-semibold transition"
      :class="option.value === props.modelValue
        ? 'bg-[#10393b] text-white'
        : 'bg-white text-[#334155] hover:bg-[#f4f7f6]'
      "
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
