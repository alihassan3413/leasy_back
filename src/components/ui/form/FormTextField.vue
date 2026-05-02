<script setup lang="ts">
import { useField } from 'vee-validate'
import Input from '@/components/form/Input.vue'

const props = withDefaults(defineProps<{
  name: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}>(), {
  placeholder: '',
  type: 'text',
  required: false,
})

const { value, errorMessage, meta, handleChange } = useField<string>(() => props.name)
</script>

<template>
  <Input
    :model-value="value"
    :label="label"
    :placeholder="placeholder"
    :type="type"
    :required="required"
    :error="meta.touched ? errorMessage : ''"
    class="w-full"
    @update:model-value="handleChange"
  />
</template>