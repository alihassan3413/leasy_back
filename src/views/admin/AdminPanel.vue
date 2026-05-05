<script setup lang="ts">
import { Icon } from "@iconify/vue";
import Image from "../../assets/logo/leasyback-logo.svg";
import AdminHeader from "@/components/admin/Header.vue";
import AdminVehicleTable from "@/components/admin/AdminVehicleTable.vue";
</script>

<template>
  <!-- Top bar — dark green -->
  <header
    class="flex h-15.5 shrink-0 items-center justify-between px-8.5"
    style="background-color: #10393b"
  >
    <!-- Logo -->
    <div class="flex w-40 h-14">
      <img :src="Image" alt="" />
    </div>
  </header>

  <div class="flex flex-col gap-5 p-6 overflow-hidden">
    <AdminHeader />
    <AdminVehicleTable />
  </div>
</template>
