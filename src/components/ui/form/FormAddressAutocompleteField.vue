<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useField } from "vee-validate";
import { Icon } from "@iconify/vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGooglePlaces,
  type PlaceSuggestion,
  type ResolvedPlaceAddress,
} from "@/composables/useGooglePlaces";

const props = withDefaults(
  defineProps<{
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: "",
    required: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  resolved: [address: ResolvedPlaceAddress];
}>();

const { value, errorMessage, meta, handleChange, handleBlur } =
  useField<string>(() => props.name);

const { autocomplete, getPlaceDetails } = useGooglePlaces();

const suggestions = ref<PlaceSuggestion[]>([]);
const open = ref(false);
const loading = ref(false);
const activeIndex = ref(-1);
const inputId = `addr-${Math.random().toString(36).slice(2, 7)}`;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const runSearch = (query: string) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (query.trim().length < 3) {
    suggestions.value = [];
    open.value = false;
    return;
  }
  loading.value = true;
  debounceTimer = setTimeout(async () => {
    suggestions.value = await autocomplete(query);
    activeIndex.value = -1;
    open.value = suggestions.value.length > 0;
    loading.value = false;
  }, 300);
};

const onInput = (next: string | number) => {
  const text = String(next ?? "");
  handleChange(text);
  runSearch(text);
};

const selectSuggestion = async (s: PlaceSuggestion) => {
  open.value = false;
  suggestions.value = [];
  // Reflect the choice immediately; the parent overrides individual fields
  // once details resolve.
  handleChange(s.mainText);
  const resolved = await getPlaceDetails(s.placeId);
  if (resolved) emit("resolved", resolved);
};

const onKeydown = (e: KeyboardEvent) => {
  if (!open.value || suggestions.value.length === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value =
      (activeIndex.value - 1 + suggestions.value.length) %
      suggestions.value.length;
  } else if (e.key === "Enter") {
    if (activeIndex.value >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions.value[activeIndex.value]);
    }
  } else if (e.key === "Escape") {
    open.value = false;
  }
};

const onBlur = (e: FocusEvent) => {
  handleBlur(e);
  // Delay so a click on a suggestion still registers before the list closes.
  setTimeout(() => {
    open.value = false;
  }, 150);
};

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <div class="relative flex w-full flex-col gap-0.5">
    <Label
      v-if="label"
      :for="inputId"
      class="text-sm font-bold leading-normal text-black not-italic"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-sm font-bold leading-normal text-custom-orange not-italic"
        >*</span
      >
    </Label>

    <div class="relative">
      <Input
        :id="inputId"
        :model-value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        class="w-full rounded-[5px] border border-green-gray pr-8 text-sm font-normal leading-normal text-black not-italic"
        @update:model-value="onInput"
        @keydown="onKeydown"
        @focus="suggestions.length && (open = true)"
        @blur="onBlur"
      />
      <Icon
        v-if="loading"
        icon="mdi:loading"
        class="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#9CB3B4]"
      />
      <Icon
        v-else
        icon="mdi:map-marker-outline"
        class="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9CB3B4]"
      />

      <!-- Suggestions dropdown -->
      <ul
        v-if="open && suggestions.length"
        class="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#D1DCDC] bg-white py-1 shadow-lg"
      >
        <li
          v-for="(s, i) in suggestions"
          :key="s.placeId"
          :class="[
            'cursor-pointer px-3 py-2 text-sm transition-colors',
            i === activeIndex ? 'bg-[#F0FBF8]' : 'hover:bg-[#F0FBF8]',
          ]"
          @mousedown.prevent="selectSuggestion(s)"
          @mouseenter="activeIndex = i"
        >
          <div class="flex items-start gap-2">
            <Icon
              icon="mdi:map-marker-outline"
              class="mt-0.5 size-4 shrink-0 text-custom-green"
            />
            <div class="min-w-0">
              <p class="truncate font-semibold text-[#10393B]">
                {{ s.mainText }}
              </p>
              <p v-if="s.secondaryText" class="truncate text-xs text-[#7A9699]">
                {{ s.secondaryText }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <span v-if="meta.touched && errorMessage" class="mt-1 text-xs text-custom-orange">
      {{ errorMessage }}
    </span>
  </div>
</template>
