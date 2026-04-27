<script setup lang="ts">
import { ref } from 'vue'
import VehicleTable from '@/components/dashboard/VehicleTable.vue'
import AddVehicleModal from '@/components/dashboard/modals/AddVehicleModal.vue'
import type { Vehicle } from '@/components/dashboard/vehicle.types'

const addVehicleOpen = ref(false)

const vehicles: Vehicle[] = [
  {
    id: '1',
    licensePlate: 'D-HI 4404',
    brand: 'VW',
    model: 'Polo',
    leaseEnd: '21.07.2025',
    returnStart: '22.07.2025',
    driver: 'Christin Mechtild',
    driverFirstName: 'Christin',
    driverLastName: 'Mechtild',
    driverPhone: '151 384 12578',
    usageAddress: 'Sechzig Str. 45, 50733 Köln',
    lastActivity: '12.03.2025 Getankt',
    fin: 'WBA3A5G59DNP26082',
    kilometerstand: '15416 km',
    leasinggeber: 'VW Leasing',
    leasingAbgabetermin: '25.05.2025',
    status: 'Vollendet',
    workshopName: 'ATU Lüneburg',
    leasingDocuments: ['Leasingvertrag', 'TÜV', 'Vorschäden'],
    returnDocuments: ['Gutachten', 'Nachgutachten', 'Rechnung', 'Rücknahme Nachweis'],
    offers: [
      { id: '01', name: 'Göhler Werkstatt', cost: 1866, saving: 36, address: 'Siemensstraße 5-7, 63768 Hösbach', distance: '227km', accepted: false },
      { id: '02', name: 'HanseMerkur', cost: 2555, saving: 85, address: 'Buxtehuder Str. 41, 21073 Hamburg', distance: '406km', accepted: false },
      { id: '03', name: 'ATU Lüneburg', cost: 1755, saving: 59, address: 'Lilienthalstraße 7, 21337 Lüneburg', distance: '405km', recommended: true, accepted: true },
    ],
    timeline: [
      { datetime: '29.02.2025\n10:30 Uhr', label: 'DEKRA', sublabel: 'Hugo-Eckener-Straße 26, 50829 Köln' },
      { datetime: '15.03.2025\n11:30 Uhr', label: 'DEKRA', sublabel: 'Clevischer Ring 131, 51063 Köln' },
      { datetime: '16.03.2025\n11:30 Uhr', label: 'Dekra-Bericht' },
      { datetime: '21.03.2025\n13:00 Uhr', label: 'Schätzung angenommen' },
      { datetime: '28.03.2025\n09:30 Uhr', label: 'In Arbeit' },
      { datetime: '25.04.2025\n16:30 Uhr', label: 'Warten auf die Endkontrolle' },
      { datetime: '11.05.2025\n11:10 Uhr', label: 'Vollendet' },
    ],
    notifications: 1,
    completed: false,
  },
]

const completedVehicles: Vehicle[] = [
  {
    id: '2',
    licensePlate: 'D-K LA 7401',
    brand: 'Toyota',
    model: 'Auris',
    leaseEnd: '21.07.2025',
    returnStart: '22.07.2025',
    driver: 'Christin Mechtild',
    driverFirstName: 'Christin',
    driverLastName: 'Mechtild',
    driverPhone: '151 384 12578',
    usageAddress: 'Sechzig Str. 45, 50733 Köln',
    lastActivity: '20.07.2025 Übergabe',
    fin: 'JTDBT923X00123456',
    kilometerstand: '42000 km',
    leasinggeber: 'Toyota Leasing',
    leasingAbgabetermin: '22.07.2025',
    status: 'Abgeschlossen',
    workshopName: 'ATU Lüneburg',
    leasingDocuments: ['Leasingvertrag', 'TÜV'],
    returnDocuments: ['Gutachten', 'Rechnung'],
    offers: [],
    timeline: [],
    completed: true,
  },
  {
    id: '3',
    licensePlate: 'D-AC DE 275',
    brand: 'Renault',
    model: 'Kangoo',
    leaseEnd: '28.02.2021',
    returnStart: '06.03.2021',
    driver: 'Christin Mechtild',
    driverFirstName: 'Christin',
    driverLastName: 'Mechtild',
    driverPhone: '151 384 12578',
    usageAddress: 'Sechzig Str. 45, 50733 Köln',
    lastActivity: '01.03.2021 Repariert',
    fin: 'VF1KW0HBH44567890',
    kilometerstand: '89000 km',
    leasinggeber: 'Renault Leasing',
    leasingAbgabetermin: '06.03.2021',
    status: 'Abgeschlossen',
    workshopName: 'HanseMerkur',
    leasingDocuments: ['Leasingvertrag'],
    returnDocuments: ['Rechnung'],
    offers: [],
    timeline: [],
    completed: true,
  },
  {
    id: '4',
    licensePlate: 'D-DU OX 801',
    brand: 'Renault',
    model: 'Captur',
    leaseEnd: '20.11.2016',
    returnStart: '25.11.2016',
    driver: 'Christin Mechtild',
    driverFirstName: 'Christin',
    driverLastName: 'Mechtild',
    driverPhone: '151 384 12578',
    usageAddress: 'Sechzig Str. 45, 50733 Köln',
    lastActivity: '15.11.2016 Inspektiert',
    fin: 'VF1RJA00054321098',
    kilometerstand: '61000 km',
    leasinggeber: 'Renault Leasing',
    leasingAbgabetermin: '25.11.2016',
    status: 'Abgeschlossen',
    workshopName: 'Göhler Werkstatt',
    leasingDocuments: ['Leasingvertrag', 'TÜV'],
    returnDocuments: ['Gutachten'],
    offers: [],
    timeline: [],
    completed: true,
  },
  {
    id: '5',
    licensePlate: 'D-K LA 334',
    brand: 'Peugeot',
    model: '107',
    leaseEnd: '12.09.2013',
    returnStart: '13.09.2013',
    driver: 'Christin Mechtild',
    driverFirstName: 'Christin',
    driverLastName: 'Mechtild',
    driverPhone: '151 384 12578',
    usageAddress: 'Sechzig Str. 45, 50733 Köln',
    lastActivity: '10.09.2013 Abgabe',
    fin: 'VF3KASYHB12345678',
    kilometerstand: '54000 km',
    leasinggeber: 'PSA Leasing',
    leasingAbgabetermin: '13.09.2013',
    status: 'Abgeschlossen',
    workshopName: 'Göhler Werkstatt',
    leasingDocuments: ['Leasingvertrag'],
    returnDocuments: ['Rechnung'],
    offers: [],
    timeline: [],
    completed: true,
  },
]
</script>

<template>
  <div class="flex flex-col gap-5 overflow-hidden">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-custom-black">
        My Dashboard
      </h1>
      <div class="flex items-center gap-2">
        <button
          class="rounded-[5px] px-4 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style="background-color: #EF8450"
        >
          Rückgabeprozess starten
        </button>
        <button
          class="flex size-8 items-center justify-center rounded-[5px] text-white transition-opacity hover:opacity-90"
          style="background-color: #EF8450"
          @click="addVehicleOpen = true"
        >
          <span class="text-lg font-bold leading-none">+</span>
        </button>
      </div>
    </div>

    <!-- Vehicle table -->
    <VehicleTable
      :vehicles="vehicles"
      :completed-vehicles="completedVehicles"
    />

    <!-- Modals -->
    <AddVehicleModal v-model:open="addVehicleOpen" />
  </div>
</template>
