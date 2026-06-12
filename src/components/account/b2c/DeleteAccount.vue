<script setup lang="ts">
import { Icon } from "@iconify/vue";
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[#F0D9D9] bg-white">
    <div class="flex flex-col gap-5 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-4">
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FBF2F2] text-[#B4544F]"
        >
          <Icon icon="mdi:trash-can-outline" class="size-5" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-[#10393B]">Konto löschen</h2>
          <p class="mt-0.5 max-w-[520px] text-[13px] leading-relaxed text-[#6B8587]">
            Wenn Sie Ihr Konto dauerhaft löschen möchten, kontaktieren Sie uns
            bitte per E-Mail. Wir kümmern uns um den Rest.
          </p>
        </div>
      </div>

      <a
        href="mailto:office@leasyback.com"
        class="flex shrink-0 items-center gap-2 self-start rounded-lg border border-[#E8C9C9] px-4 py-2.5 text-sm font-bold text-[#B4544F] transition-colors hover:border-[#B4544F] hover:bg-[#FBF2F2] sm:self-auto"
      >
        <Icon icon="mdi:email-outline" class="size-4" />
        office@leasyback.com
      </a>
    </div>
  </div>
</template>