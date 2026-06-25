<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    limit: number;
    total: number;
  }>(),
  {
    page: 1,
    limit: 10,
    total: 0,
  },
);

const emit = defineEmits<{
  (e: "update:page", page: number): void;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)));

function changePage(value: number) {
  if (value < 1 || value > totalPages.value) return;
  emit("update:page", value);
}

const visiblePages = computed(() => {
  const pages = [] as number[];
  const start = Math.max(1, props.page - 2);
  const end = Math.min(totalPages.value, props.page + 2);
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  if (start > 1) pages.unshift(1);
  if (start > 2) pages.splice(1, 0, -1);
  if (end < totalPages.value) pages.push(-1);
  if (end < totalPages.value - 1) pages.splice(pages.length - 1, 0, -1);
  return pages;
});
</script>

<template>
  <div class="flex items-center justify-center gap-2 py-4">
    <button
      type="button"
      class="rounded-full border border-[#d9e2e2] bg-white px-3 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#f4f7f6] disabled:opacity-40"
      :disabled="props.page === 1"
      @click="changePage(props.page - 1)"
    >
      Zurück
    </button>

    <template v-for="pageItem in visiblePages" :key="pageItem + '-' + props.page">
      <button
        v-if="pageItem > 0"
        type="button"
        class="rounded-full px-3 py-2 text-sm font-semibold transition"
        :class="
          pageItem === props.page
            ? 'bg-[#01B990] text-white shadow-[0_8px_20px_rgba(1,185,144,0.18)]'
            : 'bg-white text-[#334155] hover:bg-[#f4f7f6]'
        "
        @click="changePage(pageItem)"
      >
        {{ pageItem }}
      </button>
      <span v-else class="px-2 text-sm font-semibold text-[#94a3b8]">…</span>
    </template>

    <button
      type="button"
      class="rounded-full border border-[#d9e2e2] bg-white px-3 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#f4f7f6] disabled:opacity-40"
      :disabled="props.page === totalPages"
      @click="changePage(props.page + 1)"
    >
      Weiter
    </button>
  </div>
</template>
