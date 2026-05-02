<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useField, useForm } from 'vee-validate'

import Button from '@/components/ui/Button.vue'
import AppModal from '@/components/ui/AppModal.vue'
import CalendarDateField from '@/components/ui/form/CalendarDateField.vue'
import FormSelectField from '@/components/ui/form/B2CSelectField.vue'

import { appointmentSchema } from '@/validations/b2c/appointment.schema'
import { useB2CRegistrationStore } from '@/stores/b2cRegistration.store'
import { useBranches } from '@/composables/useBranches'
import type { AppointmentData } from '@/stores/b2cRegistration.store'

const emit = defineEmits<{
  next: []
  back: []
}>()

const store = useB2CRegistrationStore()
const showConflictDialog = ref(false)

const uhrzeitOptions = [
  { value: '10:30', label: '10:30 Uhr' },
  { value: '11:00', label: '11:00 Uhr' },
  { value: '13:30', label: '13:30 Uhr' },
  { value: '15:00', label: '15:00 Uhr' },
]

const { handleSubmit } = useForm<AppointmentData>({
  validationSchema: appointmentSchema,
  initialValues: store.appointmentData,
})

const { value: stadt } = useField<string>('stadt')

const {
  stadtOptions,
  selectedBranch,
} = useBranches(stadt)

function closeConflictDialog(): void {
  showConflictDialog.value = false
}

const onSubmit = handleSubmit((values) => {
  Object.assign(store.appointmentData, values)

  const hasConflict = false

  if (hasConflict) {
    showConflictDialog.value = true
    return
  }

  emit('next')
})
</script>

<template>
  <div class="space-y-6">
    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">
        Suchen Sie Ihre Filiale aus
      </h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <div class="space-y-4">
        <FormSelectField
          name="stadt"
          label="Stadt"
          :options="stadtOptions"
        />

        <div
          v-if="selectedBranch"
          class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div
            class="flex h-35 items-center justify-center rounded-[5px] bg-[#b7c2c2]/30"
          >
            <Icon
              icon="material-symbols-light:location-on"
              class="text-5xl text-custom-green"
            />
          </div>

          <div
            class="flex flex-col justify-center rounded-[5px] border border-custom-green bg-white p-3 text-xs"
          >
            <p class="font-bold text-primary">
              {{ selectedBranch.name }}
            </p>

            <p class="mt-2 text-custom-black">
              {{ selectedBranch.address }}
            </p>

            <p class="text-custom-black">
              {{ selectedBranch.phone }}
            </p>

            <p class="text-custom-black">
              {{ selectedBranch.email }}
            </p>

            <p class="mt-2 text-custom-black">
              {{ selectedBranch.distance }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-full rounded-[10px] bg-white px-6 py-5 shadow-[0_4px_4px_rgba(0,0,0,0.25)] md:px-8 md:py-6"
    >
      <h2 class="text-[20px] font-bold text-primary">
        Hier können Sie Termine buchen
      </h2>

      <div class="mt-2 mb-4 h-px w-full bg-green-gray" />

      <form
        novalidate
        class="space-y-3"
        @submit.prevent="onSubmit"
      >
        <div class="max-w-85 space-y-3">
          <CalendarDateField
            name="datum"
            label="Datum"
          />

          <FormSelectField
            name="uhrzeit"
            label="Uhrzeit"
            :options="uhrzeitOptions"
          />
        </div>

        <p class="pt-2 text-xs text-custom-black">
          Frühester Termin am 26.02.2025 um 11:00 Uhr.
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-orange text-white hover:opacity-90"
            @click="emit('back')"
          >
            Abbrechen
          </Button>

          <Button
            type="submit"
            button-classes="rounded-[5px] py-2 px-10 text-sm font-bold !bg-custom-green text-white hover:opacity-90"
          >
            Weiter
          </Button>
        </div>
      </form>
    </div>
  </div>

  <AppModal
    :open="showConflictDialog"
    title="Ihr Wunschtermin ist leider vergeben."
    message="Frühester freier Termin ist am 26.02.2025 um 11 Uhr."
    confirm-text="OK"
    @confirm="closeConflictDialog"
    @close="closeConflictDialog"
  />
</template>