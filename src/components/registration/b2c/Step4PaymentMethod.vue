<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { Icon } from '@iconify/vue'
import FormSelectField from '@/components/ui/form/FormSelectField.vue'
import Button from '@/components/ui/Button.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { paymentMethodSchema } from '@/validations/b2c/paymentMethod.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import type { PaymentData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{ submit: []; back: [] }>()

const store = useB2CRegistrationStore()

const uhrzeitOptions = [
  { value: '10:30', label: '10:30 Uhr' },
  { value: '11:00', label: '11:00 Uhr' },
  { value: '13:30', label: '13:30 Uhr' },
  { value: '15:00', label: '15:00 Uhr' },
]

// Calendar logic
const today = new Date()
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth())

const monthNamesShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7
  const days: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
})

function prevMonth() {
  if (calendarMonth.value === 0) { calendarMonth.value = 11; calendarYear.value-- }
  else calendarMonth.value--
}
function nextMonth() {
  if (calendarMonth.value === 11) { calendarMonth.value = 0; calendarYear.value++ }
  else calendarMonth.value++
}
function prevYear() { calendarYear.value-- }
function nextYear() { calendarYear.value++ }

function toIso(day: number): string {
  const m = String(calendarMonth.value + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${calendarYear.value}-${m}-${d}`
}

const datePopoverOpen = ref(false)

function selectDay(day: number | null) {
  if (!day) return
  datum.value = toIso(day)
  datePopoverOpen.value = false
}

function isSelected(day: number | null): boolean {
  if (!day || !datum.value) return false
  return toIso(day) === datum.value
}

const { handleSubmit } = useForm<PaymentData>({
  validationSchema: paymentMethodSchema,
  initialValues: store.paymentData,
})

const { value: datum, errorMessage: datumError } = useField<string>('datum')

const datumDisplay = computed(() => {
  if (!datum.value) return ''
  const [y, m, d] = datum.value.split('-')
  return `${d}.${m}.${y}`
})

const onSubmit = handleSubmit((vals) => {
  Object.assign(store.paymentData, vals)
  emit('submit')
})
</script>

<template>
  <div class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6">
    <h2 class="text-[20px] font-bold text-primary">Suchen Sie ihre Zahlungsart aus</h2>
    <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

    <form novalidate @submit.prevent="onSubmit" class="space-y-3">
      <div class="max-w-[340px] space-y-3">
        <!-- Datum -->
        <div class="space-y-1">
          <label class="text-sm font-bold text-primary">Datum</label>
          <Popover v-model:open="datePopoverOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                class="flex h-[34px] w-full items-center justify-between rounded-[5px] border border-green-gray bg-white px-3 text-left text-sm text-custom-black outline-none transition focus:border-custom-green"
                :class="datumError ? 'border-red-400 bg-red-50' : ''"
              >
                <span :class="datumDisplay ? 'text-custom-black' : 'text-green-gray'">
                  {{ datumDisplay || 'TT.MM.JJJJ' }}
                </span>
                <Icon icon="material-symbols-light:calendar-month-outline" class="text-lg text-primary" />
              </button>
            </PopoverTrigger>

            <PopoverContent class="w-[280px] rounded-[5px] border border-green-gray p-3">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <span class="text-sm font-medium text-primary">{{ monthNamesShort[calendarMonth] }}</span>
                  <div class="flex flex-col">
                    <button type="button" class="leading-none text-primary hover:opacity-70" @click="prevMonth">
                      <Icon icon="material-symbols-light:keyboard-arrow-up" class="text-base" />
                    </button>
                    <button type="button" class="leading-none text-primary hover:opacity-70" @click="nextMonth">
                      <Icon icon="material-symbols-light:keyboard-arrow-down" class="text-base" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-medium text-primary">{{ calendarYear }}</span>
                  <div class="flex flex-col">
                    <button type="button" class="leading-none text-primary hover:opacity-70" @click="prevYear">
                      <Icon icon="material-symbols-light:keyboard-arrow-up" class="text-base" />
                    </button>
                    <button type="button" class="leading-none text-primary hover:opacity-70" @click="nextYear">
                      <Icon icon="material-symbols-light:keyboard-arrow-down" class="text-base" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-green-gray">
                <div v-for="d in dayHeaders" :key="d" class="py-1">{{ d }}</div>
              </div>

              <div class="grid grid-cols-7 gap-0.5 text-center text-xs">
                <button
                  v-for="(day, i) in calendarDays"
                  :key="i"
                  type="button"
                  :disabled="!day"
                  class="flex h-7 items-center justify-center rounded-[3px] transition"
                  :class="{
                    'bg-custom-green text-white font-bold': isSelected(day),
                    'text-primary hover:bg-custom-green/20': !isSelected(day) && day,
                    'invisible': !day,
                  }"
                  @click="selectDay(day)"
                >
                  {{ day }}
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <p v-if="datumError" class="text-[11px] text-red-500">{{ datumError }}</p>
        </div>

        <!-- Uhrzeit -->
        <FormSelectField name="uhrzeit" label="Uhrzeit" :options="uhrzeitOptions" />
      </div>

      <!-- Buttons (Weiter only per Figma) -->
      <div class="flex justify-end pt-4">
        <Button
          type="submit"
          :disabled="store.status === 'loading'"
          button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
        >
          {{ store.status === 'loading' ? 'Wird gespeichert…' : 'Weiter' }}
        </Button>
      </div>
    </form>
  </div>
</template>
