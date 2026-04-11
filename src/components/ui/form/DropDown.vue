<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import FormLabel from "./FormLabel.vue";
import type { DropDownProps } from "./drop-down.types";

const props = withDefaults(defineProps<DropDownProps<string>>(), {
  modelValue: "",
  label: "",
  forId: "",
  required: false,
  placeholder: "Auswählen",
  inputClasses: "",
  labelClasses: "",
  disabled: false,
  error: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const selected = computed(() => props.options.find((o) => o.value === props.modelValue));

const displayLabel = computed(() => selected.value?.label || props.placeholder);

const triggerClasses = computed(() => [
  "flex w-full items-center justify-between rounded-[5px] border bg-white px-3 py-2.5 text-sm transition",
  props.error ? "border-red-400 bg-red-50" : "border-green-gray",
  props.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
  props.inputClasses,
]);

const iconClasses = computed(() => [
  "text-[26px] text-primary transition-transform duration-200",
  isOpen.value ? "rotate-180" : "",
]);

function toggle() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function select(value: string) {
  emit("update:modelValue", value);
  close();
}

function handleClickOutside(e: MouseEvent) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div ref="rootRef" class="relative space-y-1.5">
    <FormLabel
      :label="label"
      :required="required"
      :for-id="forId"
      :label-classes="labelClasses"
    />

    <button
      type="button"
      :id="forId"
      :class="triggerClasses"
      :disabled="disabled"
      @click="toggle"
    >
      <span :class="selected ? 'text-custom-black' : 'text-green-gray'">
        {{ displayLabel }}
      </span>

      <Icon icon="material-symbols-light:arrow-drop-down-rounded" :class="iconClasses" />
    </button>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
    >
      <div
        v-if="isOpen"
        class="absolute z-30 mt-1 w-full origin-top rounded-[5px] border border-green-gray bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
      >
        <ul class="max-h-60 overflow-auto">
          <li v-for="opt in options" :key="opt.value">
            <button
              type="button"
              class="w-full px-3 py-2 text-left text-sm transition cursor-pointer hover:bg-custom-orange/10"
              :class="opt.value === modelValue ? 'bg-green-gray/25 font-medium' : ''"
              @click="select(opt.value)"
            >
              {{ opt.label }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>

    <p v-if="error" class="text-xs text-red-500">
      {{ error }}
    </p>
  </div>
</template>
