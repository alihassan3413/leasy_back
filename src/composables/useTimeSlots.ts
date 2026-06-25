import { computed } from 'vue';

export interface UseTimeSlotsOptions {
  startTime?: string; // e.g., "08:00"
  endTime?: string; // e.g., "16:00"
  intervalMinutes?: number; // e.g., 30
}

export function useTimeSlots(options: UseTimeSlotsOptions = {}) {
  const {
    startTime = '08:00',
    endTime = '16:00',
    intervalMinutes = 30,
  } = options;

  const timeSlots = computed(() => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      currentMin += intervalMinutes;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  });

  return {
    timeSlots,
  };
}
