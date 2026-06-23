<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWorkshopStore } from "@/stores/workshop.store";
import { useAuth } from "@/composables/useAuth";
import VehicleTable from "@/components/dashboard/VehicleTable.vue";
import AddVehicleModal from "@/components/dashboard/modals/AddVehicleModal.vue";
import AccountDetail from "@/components/account/workshop/AccountDetail.vue";
import ContactPerson from "@/components/account/workshop/ContactPerson.vue";
import ManagePassword from "@/components/account/workshop/ManagePassword.vue";
import AccountCredits from "@/components/account/workshop/AccountCredits.vue";
import Contract from "@/components/account/workshop/contract.vue";
import DeleteAccount from "@/components/account/workshop/DeleteAccount.vue";
import type { Vehicle } from "@/components/dashboard/vehicle.types";

const workshopStore = useWorkshopStore();
const { user } = useAuth();
const addVehicleOpen = ref(false);

const loadWorkshopData = async (userId: string) => {
  try {
    console.log("Loading workshop data for user:", userId);
    await workshopStore.fetchWorkshop(userId);
  } catch (err) {
    console.error("Failed to fetch workshop data:", err);
  }
};

// Watch for user availability (especially on refresh)
watch(
  () => user.value,
  (newUser) => {
    const userId = newUser?.id || (newUser as any)?.user_id;
    if (userId && !workshopStore.profile) {
      loadWorkshopData(userId);
    }
  },
  { immediate: true },
);

onMounted(() => {
  const userId = user.value?.id || (user.value as any)?.user_id;
  if (userId) {
    loadWorkshopData(userId);
  }
});

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

    <!-- Account Credits Section -->
    <AccountCredits />

    <!-- Contract Section -->
    <Contract />

    <!-- Delete Account Section -->
    <DeleteAccount />
    </div>
  </div>
</template>
