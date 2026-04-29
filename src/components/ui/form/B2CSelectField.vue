<script setup lang="ts">
import { Field as FormField } from 'vee-validate'
import FormItem from './FormItem.vue'
import FormLabel from './FormLabel.vue'
import FormControl from './FormControl.vue'
import FormMessage from './FormMessage.vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = withDefaults(
  defineProps<{
    name: string
    label: string
    options: { label: string; value: string | number }[]
    placeholder?: string
    required?: boolean
  }>(),
  {
    placeholder: 'Bitte wählen',
    required: false,
  },
)
</script>

<template>
  <FormField v-slot="{ componentField }" :name="name">
    <FormItem class="space-y-1">
      <FormLabel>
        {{ label }}
        <span v-if="required" class="text-custom-orange">*</span>
      </FormLabel>
      <FormControl>
        <Select v-bind="componentField">
          <SelectTrigger
            class="!h-[34px] w-full rounded-[5px] border-green-gray bg-white px-3 text-sm shadow-none focus:ring-0 focus:border-custom-green"
          >
            <SelectValue :placeholder="placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="String(option.value)"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </FormControl>
      <div class="min-h-[14px] leading-[14px]">
        <FormMessage class="text-[11px] text-red-500" />
      </div>
    </FormItem>
  </FormField>
</template>
