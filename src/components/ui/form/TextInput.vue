<script setup lang="ts">
import FormLabel from '@/components/ui/form/FormLabel.vue'

interface Props {
  label?: string;
  forId?: string;
  required?: boolean;
  placeholder?: string;
  inputClasses?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  forId: '',
  required: false,
  placeholder: '',
  inputClasses: '',
})
</script>

<template>
  <div>
    <FormLabel
      :label="props.label"
      :for-id="props.forId"
      :required="props.required"
    />

    <input
      :id="props.forId"
      type="text"
      :placeholder="props.placeholder"
      :class="props.inputClasses"
    >
  </div>
</template>

<style scoped></style>
