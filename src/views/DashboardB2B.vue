<script setup lang="ts">
import { ref } from 'vue'
import AddVehicleModal from '@/components/dashboard/modals/AddVehicleModal.vue'
import B2BVehicleTable from '@/components/b2b/B2BVehicleTable.vue';
import { b2bVehicles } from '@/config/b2bVehivcles';
import { Icon } from '@iconify/vue';

const addVehicleOpen = ref(false)


</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[22px] font-normal leading-normal not-italic text-primary">
        My Dashboard
      </h1>
      <div  @click="addVehicleOpen = true" class="flex items-center gap-2 ">
        
          <Icon icon="ic:baseline-plus" class=" w-8 h-8 text-custom-orange cursor-pointer" />
      </div>
      
      
    </div>

    
    <B2BVehicleTable :vehicles="b2bVehicles" />

    <AddVehicleModal v-model:open="addVehicleOpen"/>
  </div>
</template>
