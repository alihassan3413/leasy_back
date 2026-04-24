<script setup lang="ts">
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="bg-[#FAFAFA] p-2.5 rounded-md">
    <!-- Page header -->
    <div class="flex items-center justify-between pl-7.5 mb-2">
      <h1 class="text-2xl font-normal text-custom-black">My Account</h1>
    </div>

    <!-- Account Details Section -->
    <AccountDetail />

    <!-- Contact Person Section -->
    <ContactPerson />

    <!-- Manage Password Section -->
    <ManagePassword />

    <!-- Delete Account Section -->
    <DeleteAccount />
    </div>
  </div>
</template>
