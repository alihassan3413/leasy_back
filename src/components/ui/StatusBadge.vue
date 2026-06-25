<script setup lang="ts">
import { computed } from "vue";
import type { StatusLabel } from "@/lib/status";

const props = withDefaults(
  defineProps<{
    label: string;
    colorClass?: string;
    backgroundClass?: string;
    status?: string;
  }>(),
  {
    colorClass: "text-[#334155]",
    backgroundClass: "bg-[#f8fafc]",
    status: "",
  },
);

const classes = computed(() =>
  [
    "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold",
    props.colorClass,
    props.backgroundClass,
  ].join(" "),
);
</script>

<template>
  <span :class="classes">{{ props.label }}</span>
</template>
