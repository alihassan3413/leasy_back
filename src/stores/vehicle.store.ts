import { defineStore } from 'pinia'
import { ref } from 'vue'
import { vehicleApi } from '@/api'
import { mapVehicleResponseToVehicle } from '@/api/mappers/vehicle.mapper'
import type { Vehicle } from '@/components/dashboard/vehicle.types'

export const useVehicleStore = defineStore('vehicle', () => {
  const vehicles = ref<Vehicle[]>([
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
  ])

  const completedVehicles = ref<Vehicle[]>([
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
  ])

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const staticVehicles = [...vehicles.value]
  const staticCompletedVehicles = [...completedVehicles.value]

  async function fetchVehicles(ownerId: string) {
    isLoading.value = true
    error.value = null
    try {
      const response = await vehicleApi.getVehicleStatus(ownerId)
      const mapped = response.map(mapVehicleResponseToVehicle)
      
      // Merge API data with static data
      vehicles.value = [...staticVehicles, ...mapped.filter(v => !v.completed)]
      completedVehicles.value = [...staticCompletedVehicles, ...mapped.filter(v => v.completed)]
    } catch (err) {
      console.error('Failed to fetch vehicles:', err)
      error.value = 'Fehler beim Laden der Fahrzeuge'
    } finally {
      isLoading.value = false
    }
  }

  return {
    vehicles,
    completedVehicles,
    isLoading,
    error,
    fetchVehicles,
  }
})
