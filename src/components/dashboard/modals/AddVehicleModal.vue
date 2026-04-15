<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { Vehicle } from '../vehicle.types'

const props = defineProps<{
  open: boolean
  vehicle?: Vehicle // if provided → edit mode
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: Partial<Vehicle>]
}>()

// ── Form state ──────────────────────────────────────────────────────────────
const city    = ref('')
const district = ref('')
const number  = ref('')
const marke   = ref('')
const modell  = ref('')
const leasingende = ref('')
const fin     = ref('')
const rueckgabestart = ref('')
const status  = ref('')
const fahrzeugnutzer = ref('')

// Dropdown open states
const markeOpen = ref(false)
const nutzerOpen = ref(false)

const markeOptions = ['VW', 'BMW', 'Mercedes', 'Audi', 'Renault', 'Toyota', 'Peugeot', 'Skoda', 'Ford', 'Opel']
const nutzerOptions = ['— Unbekannt —', 'Christin Mechtild', 'Thorsten Jung', 'Marcus Dietrich']

// ── Edit vs Add mode ─────────────────────────────────────────────────────────
const isEditMode = computed(() => !!props.vehicle)

// When modal opens, populate fields from vehicle (edit) or clear (add)
watch(() => props.open, (opened) => {
  if (!opened) return
  if (props.vehicle) {
    const parts = props.vehicle.licensePlate?.split(' ') ?? []
    city.value     = parts[0] ?? ''
    district.value = parts[1] ?? ''
    number.value   = parts[2] ?? ''
    marke.value    = props.vehicle.brand ?? ''
    modell.value   = props.vehicle.model ?? ''
    leasingende.value    = props.vehicle.leaseEnd ?? ''
    fin.value      = props.vehicle.fin ?? ''
    rueckgabestart.value = props.vehicle.returnStart ?? ''
    status.value   = props.vehicle.status ?? ''
    fahrzeugnutzer.value = props.vehicle.driver ?? ''
  } else {
    city.value = district.value = number.value = ''
    marke.value = modell.value = leasingende.value = ''
    fin.value = rueckgabestart.value = status.value = fahrzeugnutzer.value = ''
  }
  isDirty.value = false
})

// ── Dirty tracking (edit mode button activation) ─────────────────────────────
const isDirty = ref(false)
watch([city, district, number, marke, modell, leasingende, fin, rueckgabestart, status, fahrzeugnutzer], () => {
  if (props.open && isEditMode.value) isDirty.value = true
})

const buttonActive = computed(() => !isEditMode.value || isDirty.value)

function close() { emit('update:open', false) }

function handleSubmit() {
  emit('submit', {
    licensePlate: `${city.value} ${district.value} ${number.value}`.trim(),
    brand: marke.value,
    model: modell.value,
    leaseEnd: leasingende.value,
    fin: fin.value,
    returnStart: rueckgabestart.value,
    status: status.value,
    driver: fahrzeugnutzer.value,
  })
  close()
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-hidden"
      style="width: 700px; max-width: 700px; border-radius: 5px; border: 1px solid #ECECEC;"
      :show-close-button="false"
    >
      <!-- Header -->
      <div
        class="flex h-[50px] items-center justify-between px-9"
        style="background-color:#FAFAFA; border-bottom: 1px solid #B7C2C2"
      >
        <span class="text-[20px] font-bold" style="color:#10393B">Neues Fahrzeug</span>
        <button @click="close" class="transition-opacity hover:opacity-60">
          <Icon icon="mdi:close" class="size-5" style="color:#B7C2C2" />
        </button>
      </div>

      <!-- Description -->
      <p class="px-9 pt-5 text-[16px]" style="color:#000">
        Legen Sie ganz einfach ein neues Fahrzeug an – bitte füllen Sie dafür alle Angaben im Formular unten aus
      </p>

      <!-- Form — 2 columns -->
      <div class="flex gap-8 px-8 pb-6 pt-4">

        <!-- Left column -->
        <div class="flex w-[308px] flex-col gap-4">

          <!-- Kennzeichen -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Kennzeichen</label>
            <!-- German plate widget -->
            <div class="flex h-[36px] items-center rounded-[5px] border" style="background:#ECECEC; border-color:#B7C2C2">
              <!-- EU blue strip -->
              <div class="flex h-full w-[22px] shrink-0 flex-col items-center justify-center rounded-l-[4px]" style="background:#00339B">
                <span class="text-[8px] font-bold text-white leading-none">★</span>
                <span class="text-[14px] font-bold text-white leading-none">D</span>
              </div>
              <!-- City -->
              <div class="flex h-full items-center border-x" style="border-color:#B7C2C2; background:#FAFAFA; min-width:60px">
                <input v-model="city" class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none" style="color:#B7C2C2" placeholder="ABC" maxlength="3" />
              </div>
              <!-- District -->
              <div class="flex h-full items-center border-r" style="border-color:#B7C2C2; background:#FAFAFA; min-width:44px">
                <input v-model="district" class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none" style="color:#B7C2C2" placeholder="DE" maxlength="2" />
              </div>
              <!-- Number -->
              <div class="flex h-full flex-1 items-center" style="background:#FAFAFA">
                <input v-model="number" class="h-full w-full bg-transparent px-1 text-center text-[16px] font-extrabold uppercase outline-none" style="color:#B7C2C2" placeholder="1234" maxlength="5" />
              </div>
            </div>
            <span class="text-[10px] font-bold" style="color:#2E3E3F">*(Format: ABC DE 1234)</span>
          </div>

          <!-- Marke (dropdown) -->
          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Marke</label>
            <div
              class="flex h-[30px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color:#B7C2C2"
              @click="markeOpen = !markeOpen; nutzerOpen = false"
            >
              <span class="text-[14px]" :style="marke ? 'color:#000' : 'color:#B7C2C2'">{{ marke || 'Marke wählen' }}</span>
              <Icon :icon="markeOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="size-4" style="color:#2E3E3F" />
            </div>
            <div v-if="markeOpen" class="absolute top-full z-50 mt-1 w-full rounded-[5px] border bg-white shadow-md" style="border-color:#B7C2C2">
              <div
                v-for="opt in markeOptions"
                :key="opt"
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                style="color:#000"
                @click="marke = opt; markeOpen = false"
              >{{ opt }}</div>
            </div>
          </div>

          <!-- Modell -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Modell</label>
            <input
              v-model="modell"
              class="h-[30px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color:#B7C2C2; color:#000"
              placeholder="Modell"
            />
          </div>

          <!-- Leasingende -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Leasingende</label>
            <div class="relative flex h-[30px] items-center rounded-[5px] border" style="border-color:#B7C2C2">
              <input
                v-model="leasingende"
                type="date"
                class="h-full w-full rounded-[5px] bg-transparent px-2 text-[14px] outline-none"
                style="color:#000"
              />
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="flex w-[308px] flex-col gap-4">

          <!-- FIN -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">FIN</label>
            <input
              v-model="fin"
              class="h-[30px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color:#B7C2C2; color:#000"
              placeholder="Fahrgestellnummer"
            />
            <span class="text-[10px] font-bold" style="color:#2E3E3F">*(seh. Fahrzeugschein Mitte oben)</span>
          </div>

          <!-- Rückgabestart -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Rückgabestart</label>
            <input
              v-model="rueckgabestart"
              type="date"
              class="h-[30px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color:#B7C2C2; color:#000"
            />
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Status</label>
            <input
              v-model="status"
              class="h-[30px] rounded-[5px] border px-2 text-[14px] outline-none"
              style="border-color:#B7C2C2; color:#000"
              placeholder="Status"
            />
          </div>

          <!-- Fahrzeugnutzer (dropdown) -->
          <div class="relative flex flex-col gap-1">
            <label class="text-[16px] font-bold" style="color:#000">Fahrzeugnutzer</label>
            <div
              class="flex h-[30px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color:#B7C2C2"
              @click="nutzerOpen = !nutzerOpen; markeOpen = false"
            >
              <span class="text-[14px]" :style="fahrzeugnutzer ? 'color:#000' : 'color:#B7C2C2'">{{ fahrzeugnutzer || 'Nutzer wählen' }}</span>
              <Icon :icon="nutzerOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="size-4" style="color:#2E3E3F" />
            </div>
            <div v-if="nutzerOpen" class="absolute top-full z-50 mt-1 w-full rounded-[5px] border bg-white shadow-md" style="border-color:#B7C2C2">
              <div
                v-for="opt in nutzerOptions"
                :key="opt"
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                style="color:#000"
                @click="fahrzeugnutzer = opt; nutzerOpen = false"
              >{{ opt }}</div>
            </div>
          </div>

          <!-- Bestätigen button — right-aligned, bottom -->
          <div class="mt-auto flex justify-end pt-4">
            <button
              class="h-[30px] w-[150px] rounded-[5px] text-[14px] font-bold text-white transition-opacity"
              :style="buttonActive ? 'background:#EF8450' : 'background:#B7C2C2'"
              :disabled="!buttonActive"
              @click="handleSubmit"
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
