<script setup lang="ts">
import { computed } from 'vue'
import { Field as FormField } from 'vee-validate'
import FormItem from './FormItem.vue'
import FormLabel from './FormLabel.vue'
import FormControl from './FormControl.vue'
import FormMessage from './FormMessage.vue'
import { Input } from '@/components/ui/input'
import type { InputType } from './text-input.types'

const props = withDefaults(
  defineProps<{
    name: string
    label: string
    placeholder?: string
    type?: InputType
    required?: boolean
    disabled?: boolean
    helpText?: string
  }>(),
  {
    placeholder: '',
    type: 'text',
    required: false,
    disabled: false,
    helpText: '',
  },
)

// Preserves the LeasyBack design (5px radius, green-gray border, white bg).
// Explicit h-[34px] keeps inputs compact (matches Figma) and aligned with FormSelectField.
const inputClasses = computed(() => [
  'h-[34px] w-full rounded-[5px] border-green-gray bg-white px-3 py-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-custom-green',
  props.disabled ? 'cursor-not-allowed opacity-60' : '',
])
</script>

<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem class="space-y-1">
      <FormLabel>
        {{ label }}
        <span v-if="required" class="text-custom-orange">*</span>
        <span v-if="helpText" class="ml-1 text-[10px] font-normal text-green-gray">
          {{ helpText }}
        </span>
      </FormLabel>
      <FormControl>
        <Input
          v-bind="componentField"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="inputClasses"
        />
      </FormControl>
      <!-- Reserved height keeps row layout stable whether an error is shown or not -->
      <div class="min-h-[14px] leading-[14px]">
        <FormMessage class="text-[11px] text-red-500" />
      </div>
    </FormItem>
  </FormField>
</template>
