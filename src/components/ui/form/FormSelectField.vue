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

withDefaults(
  defineProps<{
    name: string
    label: string
    options: { label: string; value: string }[]
    placeholder?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    placeholder: 'Auswählen',
    required: false,
    disabled: false,
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
      <Select v-bind="componentField" :disabled="disabled">
        <FormControl>
          <SelectTrigger
            class="!h-[34px] w-full rounded-[5px] border-green-gray bg-white px-3 py-0 text-sm shadow-none data-[state=open]:border-custom-green focus-visible:ring-0"
          >
            <SelectValue :placeholder="placeholder" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <!-- Reserved height keeps row layout stable whether an error is shown or not -->
      <div class="min-h-[14px] leading-[14px]">
        <FormMessage class="text-[11px] text-red-500" />
      </div>
    </FormItem>
  </FormField>
</template>
