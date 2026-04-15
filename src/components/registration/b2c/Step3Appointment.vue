<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { Icon } from '@iconify/vue'
import DropDown from '@/components/ui/form/DropDown.vue'
import Button from '@/components/ui/Button.vue'
import ProgressBar from './ProgressBar.vue'
import { appointmentSchema } from '@/validations/b2c/appointment.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { AppointmentData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{ next: []; back: [] }>()

const store = useB2CRegistrationStore()

const stadtOptions = [
  { value: 'koeln', label: 'Köln' },
  { value: 'hamburg', label: 'Hamburg' },
  { value: 'berlin', label: 'Berlin' },
  { value: 'muenchen', label: 'München' },
  { value: 'frankfurt', label: 'Frankfurt' },
]

const uhrzeitOptions = [
  { value: '10:30', label: '10:30 Uhr' },
  { value: '11:00', label: '11:00 Uhr' },
  { value: '13:30', label: '13:30 Uhr' },
  { value: '15:00', label: '15:00 Uhr' },
]

const branches: Record<string, { name: string; address: string; phone: string; email: string; distance: string }> = {
  koeln: {
    name: 'TÜV Rheinland Prüfstelle Köln-Mülheim',
    address: 'Frankfurter Str. 200, 51065 Köln',
    phone: 'T.: 0800 88 38 88 38',
    email: 'Email: tuv.km@rheinland.de',
    distance: 'Entfernung: 14km',
  },
  hamburg: {
    name: 'TÜV Nord Hamburg',
    address: 'Beim Strohhause 31, 20097 Hamburg',
    phone: 'T.: 0800 88 38 88 00',
    email: 'Email: tuv.hh@nord.de',
    distance: 'Entfernung: 8km',
  },
  berlin: {
    name: 'TÜV Rheinland Berlin',
    address: 'Salzufer 22, 10587 Berlin',
    phone: 'T.: 0800 88 38 88 11',
    email: 'Email: tuv.ber@rheinland.de',
    distance: 'Entfernung: 5km',
  },
  muenchen: {
    name: 'TÜV SÜD München',
    address: 'Westendstraße 199, 80686 München',
    phone: 'T.: 0800 88 38 88 22',
    email: 'Email: tuv.muc@sued.de',
    distance: 'Entfernung: 11km',
  },
  frankfurt: {
    name: 'TÜV Hessen Frankfurt',
    address: 'Gutleutstraße 163, 60327 Frankfurt',
    phone: 'T.: 0800 88 38 88 33',
    email: 'Email: tuv.fra@hessen.de',
    distance: 'Entfernung: 7km',
  },
}

// Calendar logic
const today = new Date()
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth()) // 0-indexed
const selectedDate = ref('')

const showConflictDialog = ref(false)

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // shift so Monday=0
  const startOffset = (firstDay + 6) % 7
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
})

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function formatDate(day: number): string {
  const m = String(calendarMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${calendarYear.value}-${m}-${d}`
}

function selectDay(day: number | null) {
  if (!day) return
  const iso = formatDate(day)
  selectedDate.value = iso
  datum.value = iso
}

function isToday(day: number | null): boolean {
  if (!day) return false
  return formatDate(day) === today.toISOString().split('T')[0]
}

function isSelected(day: number | null): boolean {
  if (!day) return false
  return formatDate(day) === selectedDate.value
}

// vee-validate
const { handleSubmit } = useForm<AppointmentData>({
  validationSchema: appointmentSchema,
  initialValues: store.appointmentData,
})

const { value: stadt, errorMessage: stadtError } = useField<string>('stadt')
const { value: datum, errorMessage: datumError } = useField<string>('datum')
const { value: uhrzeit, errorMessage: uhrzeitError } = useField<string>('uhrzeit')

const selectedBranch = computed(() => (stadt.value ? branches[stadt.value] : null))

const onSubmit = handleSubmit((values) => {
  Object.assign(store.appointmentData, values)
  emit('next')
})
</script>

<template>
  <div class="w-full max-w-[680px] rounded-[10px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
    <ProgressBar :current-step="3" />

    <h2 class="mb-6 text-xl font-bold text-primary">
      Terminvereinbarung
    </h2>

    <form novalidate @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Left: Location selection -->
        <div class="space-y-4">
          <p class="text-sm font-semibold text-primary">
            Suchen Sie Ihre Filiale aus
          </p>

          <DropDown
            v-model="stadt"
            label="Stadt"
            for-id="stadt"
            :options="stadtOptions"
            :error="stadtError"
          />

          <div
            v-if="selectedBranch"
            class="rounded-[5px] border border-custom-green bg-white p-3 text-sm"
          >
            <p class="font-semibold text-primary">{{ selectedBranch.name }}</p>
            <p class="text-custom-black mt-1">{{ selectedBranch.address }}</p>
            <p class="text-custom-black">{{ selectedBranch.phone }}</p>
            <p class="text-custom-black">{{ selectedBranch.email }}</p>
            <p class="mt-1 font-medium text-custom-green">{{ selectedBranch.distance }}</p>
          </div>

          <!-- Placeholder map -->
          <div
            v-if="selectedBranch"
            class="flex h-36 items-center justify-center rounded-[5px] bg-[#b7c2c2]/30 text-green-gray"
          >
            <Icon icon="material-symbols-light:location-on-outline" class="text-4xl text-custom-green" />
          </div>
        </div>

        <!-- Right: Date & time selection -->
        <div class="space-y-4">
          <p class="text-sm font-semibold text-primary">
            Hier können Sie Termine buchen
          </p>

          <!-- Calendar -->
          <div class="rounded-[5px] border border-green-gray p-3">
            <div class="mb-2 flex items-center justify-between">
              <button type="button" class="p-1 text-primary hover:opacity-70" @click="prevMonth">
                <Icon icon="material-symbols-light:chevron-left-rounded" class="text-xl" />
              </button>
              <span class="text-sm font-semibold text-primary">
                {{ monthNames[calendarMonth] }} {{ calendarYear }}
              </span>
              <button type="button" class="p-1 text-primary hover:opacity-70" @click="nextMonth">
                <Icon icon="material-symbols-light:chevron-right-rounded" class="text-xl" />
              </button>
            </div>

            <div class="grid grid-cols-7 gap-0.5 text-center text-xs">
              <div
                v-for="d in dayHeaders"
                :key="d"
                class="py-1 font-medium text-green-gray"
              >
                {{ d }}
              </div>

              <button
                v-for="(day, i) in calendarDays"
                :key="i"
                type="button"
                :disabled="!day"
                class="flex h-7 w-full items-center justify-center rounded text-xs transition"
                :class="{
                  'bg-custom-orange text-white font-bold': isSelected(day),
                  'bg-custom-green/20 text-primary hover:bg-custom-green/40': !isSelected(day) && day && !isToday(day),
                  'ring-1 ring-primary': isToday(day) && !isSelected(day),
                  'invisible': !day,
                }"
                @click="selectDay(day)"
              >
                {{ day }}
              </button>
            </div>
          </div>

          <p v-if="datumError" class="text-xs text-red-500">{{ datumError }}</p>

          <DropDown
            v-model="uhrzeit"
            label="Uhrzeit"
            for-id="uhrzeit"
            :options="uhrzeitOptions"
            :error="uhrzeitError"
          />
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <Button
          type="button"
          button-classes="rounded-[5px] py-3 px-6 text-sm font-bold bg-custom-orange text-white hover:opacity-90"
          @click="emit('back')"
        >
          Zurück
        </Button>

        <Button
          type="submit"
          button-classes="flex-1 rounded-[5px] py-3 text-sm font-bold bg-custom-green text-white hover:opacity-90"
        >
          Weiter
        </Button>
      </div>
    </form>
  </div>

  <!-- Conflict dialog -->
  <Teleport to="body">
    <div
      v-if="showConflictDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="w-full max-w-sm rounded-[5px] bg-[#ECECEC] p-6 text-center">
        <p class="mb-2 font-semibold text-custom-black">
          Ihr Wunschtermin ist leider vergeben.
        </p>
        <p class="mb-5 text-sm text-custom-black">
          Frühester freier Termin ist am 26.02.2025 um 11 Uhr.
        </p>
        <Button
          button-classes="rounded-[5px] px-8 py-2 text-sm font-bold bg-custom-green text-white"
          @click="showConflictDialog = false"
        >
          OK
        </Button>
      </div>
    </div>
  </Teleport>
</template>
