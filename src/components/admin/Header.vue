<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { Button } from "@/components/ui/button";
const activeTab = ref("b2b");
const activeFilter = ref("aktuelle");
const searchQuery = ref("");
</script>

<template>
  <div class="bg-white p-6 rounded-md shadow-sm border border-gray-100">
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-[22px] font-normal text-[#10393B]">Admin panel</h1>
    </div>

    <!-- Tabs and Search Container -->
    <div class="space-y-6">
      <!-- Main Tabs -->
      <div class="flex items-center gap-4">
        <button
          @click="activeTab = 'b2b'"
          :class="[
            'text-sm font-bold transition-colors relative pb-1',
            activeTab === 'b2b'
              ? 'text-custom-green border-b-2 border-custom-green'
              : 'text-[#2E3E3F] hover:text-gray-700',
          ]"
        >
          B2B Kunden
        </button>

        <div class="h-4 w-px bg-gray-300"></div>

        <button
          @click="activeTab = 'b2c'"
          :class="[
            'text-sm font-bold transition-colors relative pb-1',
            activeTab === 'b2c'
              ? 'text-custom-green border-b-2 border-custom-green'
              : 'text-[#2E3E3F] hover:text-gray-700',
          ]"
        >
          B2C Kunden
        </button>
      </div>

      <!-- Filter and Search Bar -->
      <div class="flex items-center justify-between">
        <!-- Sub Tabs / Filters -->
        <div class="flex items-center bg-[#ECECEC] p-1 rounded">
          <button
            @click="activeFilter = 'aktuelle'"
            :class="[
              'px-4 py-1 text-sm font-bold rounded transition-colors',
              activeFilter === 'aktuelle'
                ? 'bg-[#FAFAFA] text-custom-green shadow-sm'
                : 'text-[#2E3E3F]',
            ]"
          >
            Aktuelle Fälle
          </button>
          <button
            @click="activeFilter = 'geschlossene'"
            :class="[
              'px-4 py-1 text-sm font-bold rounded transition-colors',
              activeFilter === 'geschlossene'
                ? 'bg-[#FAFAFA] text-custom-green shadow-sm'
                : 'text-[#2E3E3F]',
            ]"
          >
            Geschlossene Fälle
          </button>
        </div>

        <!-- Search Bar -->
        <div class="flex items-center max-w-75 w-full relative">
          <FormTextField
            v-model="searchQuery"
            placeholder=""
            class="h-8 pr-12 border-custom-green! focus-visible:ring-0 focus-visible:border-custom-green!"
          />
          <Button
            size="icon"
            variant="default"
            class="absolute right-0 bg-custom-green hover:bg-custom-green/90 h-9 w-10 rounded-l-none"
          >
            <Icon icon="mdi:magnify" class="size-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
