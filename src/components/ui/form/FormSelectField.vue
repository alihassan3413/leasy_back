<script setup lang="ts">
import { useField } from 'vee-validate'
import SelectDropDown from '../../form/SelectDropDown.vue'

const props = withDefaults(defineProps<{
  name: string
  label: string
  options: { label: string; value: string | number }[]
  placeholder?: string
  required?: boolean
}>(), {
  placeholder: 'Bitte wählen',
  required: false,
})

// useField connects this specific component to the Vee-Validate form 
// using the 'name' prop (e.g., "admin.anrede")
const { value, errorMessage, meta } = useField<string>(() => props.name)
</script>

<template>
  <div class="flex flex-col w-full">
    <SelectDropDown
      v-model="value"
      :label="label"
      :options="options"
      :placeholder="placeholder"
      class="w-full"
    />
    
    <span 
      v-if="meta.touched && errorMessage" 
      class="text-red-500 text-xs mt-1 ml-2"
    >
      {{ errorMessage }}
    </span>
  </div>
</template>