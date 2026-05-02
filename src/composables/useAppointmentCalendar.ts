import { computed, ref } from 'vue'
import type { Ref } from 'vue'

type CalendarDay = {
  day: number
  monthOffset: -1 | 0 | 1
}

export function useAppointmentCalendar(selectedDate: Ref<string | undefined>) {
  const today = new Date()

  const calendarYear = ref(today.getFullYear())
  const calendarMonth = ref(today.getMonth())
  const datePopoverOpen = ref(false)

  const monthNamesShort = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ]

  const dayHeaders = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  const calendarDays = computed<CalendarDay[]>(() => {
    const year = calendarYear.value
    const month = calendarMonth.value

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPreviousMonth = new Date(year, month, 0).getDate()

    const startOffset = (firstDay + 6) % 7
    const days: CalendarDay[] = []

    for (let i = startOffset - 1; i >= 0; i -= 1) {
      days.push({
        day: daysInPreviousMonth - i,
        monthOffset: -1,
      })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push({
        day,
        monthOffset: 0,
      })
    }

    const remainingDays = 35 - days.length

    for (let day = 1; day <= remainingDays; day += 1) {
      days.push({
        day,
        monthOffset: 1,
      })
    }

    return days
  })

  const selectedDateDisplay = computed(() => {
    if (!selectedDate.value) return ''

    const [year, month, day] = selectedDate.value.split('-')

    return `${day}.${month}.${year}`
  })

  function previousMonth(): void {
    if (calendarMonth.value === 0) {
      calendarMonth.value = 11
      calendarYear.value -= 1
      return
    }

    calendarMonth.value -= 1
  }

  function nextMonth(): void {
    if (calendarMonth.value === 11) {
      calendarMonth.value = 0
      calendarYear.value += 1
      return
    }

    calendarMonth.value += 1
  }

  function previousYear(): void {
    calendarYear.value -= 1
  }

  function nextYear(): void {
    calendarYear.value += 1
  }

  function getDateFromCalendarDay(calendarDay: CalendarDay): string {
    const date = new Date(
      calendarYear.value,
      calendarMonth.value + calendarDay.monthOffset,
      calendarDay.day,
    )

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  function selectDay(calendarDay: CalendarDay): void {
    selectedDate.value = getDateFromCalendarDay(calendarDay)
    datePopoverOpen.value = false
  }

  function isSelectedDay(calendarDay: CalendarDay): boolean {
    if (!selectedDate.value) return false

    return getDateFromCalendarDay(calendarDay) === selectedDate.value
  }

  return {
    calendarYear,
    calendarMonth,
    datePopoverOpen,
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
  }
}