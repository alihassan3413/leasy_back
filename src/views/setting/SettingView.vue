<script setup lang="ts">
import GeneralSetting from "@/components/setting/GeneralSetting.vue";
</script>

<template>
  <div class="flex flex-col gap-4 md:gap-5 p-3 md:p-0">
    <div class="bg-[#FAFAFA] p-2.5 rounded-md">
    <!-- Page header -->
    <div class="flex items-center justify-between pl-3 md:pl-7.5 mb-2">
      <h1 class="text-xl md:text-2xl font-normal text-custom-black">Einstellungen</h1>
    </div>

    <!-- General Settings Section -->
    <GeneralSetting />
    </div>
  </div>
</template>
