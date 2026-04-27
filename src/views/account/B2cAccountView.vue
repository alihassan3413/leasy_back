<script setup lang="ts">
import AccountDetail from "@/components/account/b2c/AccountDetail.vue";
import ContactPerson from "@/components/account/b2c/ContactPerson.vue";
import ManagePassword from "@/components/account/b2c/ManagePassword.vue";
import DeleteAccount from "@/components/account/b2c/DeleteAccount.vue";
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
