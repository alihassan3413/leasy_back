<script setup>
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

/* Props */

const props = defineProps({
  modelValue: [String, Number],

  label: String,

  placeholder: {
    type: String,
    default: "Select",
  },

  options: {
    type: Array,
    required: true,
  },

  width: {
    type: String,
    default: "w-57.5",
  },
});

const emit = defineEmits(["update:modelValue"]);

/* State */

const isOpen = ref(false);

/* Selected label */

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  return found ? found.label : "";
});

/* Methods */

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectOption(option) {
  emit("update:modelValue", option.value);

  isOpen.value = false;
}

/* Click outside close */

function handleClickOutside(event) {
  if (!event.target.closest(".relative")) {
    isOpen.value = false;
  }
}

const iconClasses = computed(() => [
  "text-[26px] text-primary transition-transform duration-200",
  isOpen.value ? "rotate-180" : "",
]);

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="relative">
    <!-- Label -->
    <label
      v-if="label"
      class="block text-sm font-bold leading-normal not-italic text-black mb-px ml-2"
    >
      {{ label }}
    </label>

    <!-- Select Box -->
    <div
      class="relative rounded-[5px] border border-green-gray bg-[#ECECEC] cursor-pointer"
      :class="width"
      @click="toggleDropdown"
    >
      <!-- Selected Value -->
      <div class="flex items-center justify-between px-3 py-px">
        <span class="text-sm font-normal leading-normal not-italic text-black">
          {{ selectedLabel || placeholder }}
        </span>

        <!-- Divider + Icon -->
        <div class="flex items-center">
          <div class="h-8 w-px bg-gray-300 mr-1"></div>

          <!-- Triangle -->
          <Icon icon="ic:round-arrow-drop-down" :class="iconClasses" />
        </div>
      </div>
    </div>

    <!-- Dropdown Options -->
    <div
      v-if="isOpen"
      class="absolute mt-2 rounded-2xl border border-gray-300 bg-gray-100 shadow-lg z-50 overflow-hidden"
      :class="width"
    >
      <div
        v-for="option in options"
        :key="option.value"
        @click="selectOption(option)"
        class="px-4 py-3 text-lg border-b border-green-gray cursor-pointer hover:bg-gray-200 transition"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>
