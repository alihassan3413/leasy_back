<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useField } from "vee-validate";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useAppointmentCalendar } from "@/composables/useAppointmentCalendar";

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "TT.MM.JJJJ",
  helpText: "",
});

const { value, errorMessage } = useField<string | undefined>(props.name);

const {
  datePopoverOpen: isOpen,
  calendarYear,
  calendarMonth,
  monthNamesShort,
  dayHeaders,
  calendarDays,
  selectedDateDisplay,
  previousMonth,
  nextMonth,
  previousYear,
  nextYear,
  selectDay,
  isSelectedDay,
} = useAppointmentCalendar(value);
</script>

<template>
  <div class="space-y-1">
    <label class="text-sm font-bold text-primary">
      {{ label }}

      <span v-if="helpText" class="ml-1 text-[10px] font-normal text-green-gray">
        {{ helpText }}
      </span>
    </label>

    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex h-8.5 w-full items-center justify-between rounded-[5px] border border-green-gray bg-white px-3 text-left text-sm text-custom-black outline-none transition focus:border-custom-green"
          :class="errorMessage ? 'border-red-400 bg-red-50' : ''"
        >
          <span :class="selectedDateDisplay ? 'text-custom-black' : 'text-green-gray'">
            {{ selectedDateDisplay || placeholder }}
          </span>

          <Icon
            icon="material-symbols-light:calendar-month-outline"
            class="text-lg text-primary"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        class="w-70 rounded-[6px] border border-green-gray bg-white px-4 py-4 shadow-[0_4px_8px_rgba(0,0,0,0.16)]"
      >
        <div class="mb-4 flex items-center justify-center gap-2">
          <div
            class="flex h-10 w-20 items-center justify-center gap-2 rounded-[6px] border border-green-gray bg-white text-[15px] font-bold text-custom-black"
          >
            <span>
              {{ monthNamesShort[calendarMonth] }}
            </span>

            <div class="flex flex-col">
              <button
                type="button"
                class="leading-none text-green-gray hover:text-primary"
                @click="previousMonth"
              >
                <Icon icon="material-symbols-light:keyboard-arrow-up" class="text-xl" />
              </button>

              <button
                type="button"
                class="-mt-2 leading-none text-green-gray hover:text-primary"
                @click="nextMonth"
              >
                <Icon icon="material-symbols-light:keyboard-arrow-down" class="text-xl" />
              </button>
            </div>
          </div>

          <div
            class="flex h-10 w-24 items-center justify-center gap-2 rounded-[6px] border border-green-gray bg-white text-[15px] font-bold text-custom-black"
          >
            <span>
              {{ calendarYear }}
            </span>

            <div class="flex flex-col">
              <button
                type="button"
                class="leading-none text-green-gray hover:text-primary"
                @click="previousYear"
              >
                <Icon icon="material-symbols-light:keyboard-arrow-up" class="text-xl" />
              </button>

              <button
                type="button"
                class="-mt-2 leading-none text-green-gray hover:text-primary"
                @click="nextYear"
              >
                <Icon icon="material-symbols-light:keyboard-arrow-down" class="text-xl" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="ml-1 text-green-gray hover:text-primary"
            @click="nextMonth"
          >
            <Icon icon="material-symbols-light:keyboard-arrow-right" class="text-3xl" />
          </button>
        </div>

        <div class="grid grid-cols-7 text-center text-[13px] font-bold text-custom-black">
          <div v-for="dayHeader in dayHeaders" :key="dayHeader" class="pb-3">
            {{ dayHeader }}
          </div>
        </div>

        <div
          class="grid grid-cols-7 gap-y-2 text-center text-[13px] font-bold text-custom-black"
        >
          <button
            v-for="(calendarDay, index) in calendarDays"
            :key="index"
            type="button"
            class="mx-auto flex h-6 w-6 items-center justify-center rounded-[6px] transition"
            :class="{
              'bg-custom-green text-white': isSelectedDay(calendarDay),
              'text-custom-black hover:border hover:border-custom-green': !isSelectedDay(
                calendarDay
              ),
            }"
            @click="selectDay(calendarDay)"
          >
            {{ calendarDay.day }}
          </button>
        </div>
      </PopoverContent>
    </Popover>

    <p v-if="errorMessage" class="text-[11px] text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
