<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps({
  modelValue: { type: String, default: ''},
  error: {type: String, default: ''},
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  class: { type: String, default: '' },
  id: { type: String, default: () => `input-${Math.random().toString(36).slice(2, 7)}` },
})

const emit = defineEmits(['update:modelValue'])

const inputClasses = computed(() =>
  [
    'border   border-green-gray rounded-[5px] w-[310px] text-black text-sm leading-normal not-italic font-normal  ',
    props.class,
  ].join(' ')
)
</script>

<template>
  <div class="flex flex-col gap-0.5 w-full">
    <Label v-if="label" :for="id" class="text-sm font-bold text-black leading-normal not-italic">
      {{ label }}
      <span v-if="required" class="text-custom-orange text-sm font-bold leading-normal not-italic">*</span>
    </Label>
    <Input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :model-value="modelValue"
      :class="inputClasses"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <span v-if="error" class="text-custom-orange text-xs mt-1">
      {{ error }}
    </span>
  </div>
</template>