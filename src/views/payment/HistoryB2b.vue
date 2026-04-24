<script setup lang="ts">
import Setting from "@/components/payment/historyb2b/Setting.vue";
import Transaction from "@/components/payment/historyb2b/Transaction.vue";
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="bg-[#FAFAFA] p-2.5 rounded-md">
    <!-- Page header -->
    <div class="flex items-center justify-between pl-7.5 mb-2">
      <h1 class="text-2xl font-normal text-custom-black">Zahlungsverlauf</h1>
    </div>
    <!-- Payment History Section -->
    <Setting />
    <!-- Transaction Section -->
    <Transaction />
    </div>
  </div>
</template>
