<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import FormLabel from '@/components/ui/form/FormLabel.vue'
import type { TextInputProps } from './text-input.types'

const props = withDefaults(defineProps<TextInputProps>(), {
  modelValue: '',
  label: '',
  forId: '',
  required: false,
  placeholder: '',
  inputClasses: '',
  labelClasses: '',
  type: 'text',
  showPasswordToggle: false,
  disabled: false,
  error: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const passwordVisible = ref(false)

const actualType = computed(() => {
  if (props.type === 'password' && props.showPasswordToggle) {
    return passwordVisible.value ? 'text' : 'password'
  }

  return props.type
})

const inputClasses = computed(() => {
  return [
    'w-full rounded-[5px] border bg-white px-3 py-2.5 text-sm outline-none transition',
    props.error ? 'border-red-400 bg-red-50' : 'border-green-gray',
    props.showPasswordToggle && props.type === 'password' ? 'pr-10' : '',
    props.disabled ? 'cursor-not-allowed opacity-60' : '',
    props.inputClasses,
  ]
})

const togglePasswordIcon = computed(() => {
  return passwordVisible.value
    ? 'material-symbols-light:visibility-off-outline-rounded'
    : 'material-symbols-light:visibility-outline-rounded'
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="space-y-1.5">
    <FormLabel
      :label="props.label"
      :for-id="props.forId"
      :required="props.required"
      :label-classes="props.labelClasses"
    />

    <div class="relative">
      <input
        :id="props.forId"
        :type="actualType"
        :placeholder="props.placeholder"
        :class="inputClasses"
        :value="props.modelValue"
        :disabled="props.disabled"
        @input="onInput"
      >

      <button
        v-if="props.type === 'password' && props.showPasswordToggle"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 transition hover:text-gray-700"
        @click="passwordVisible = !passwordVisible"
      >
        <Icon :icon="togglePasswordIcon" class="text-xl" />
      </button>
    </div>

    <p v-if="error" class="text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>