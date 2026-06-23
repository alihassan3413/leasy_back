export interface StatusLabel {
  label: string
  colorClass: string
  backgroundClass: string
}

const userStatusMap: Record<string, StatusLabel> = {
  active: {
    label: 'Aktiv',
    colorClass: 'text-[#05603a]',
    backgroundClass: 'bg-[#d1fae5]',
  },
  inactive: {
    label: 'Inaktiv',
    colorClass: 'text-[#7c2d12]',
    backgroundClass: 'bg-[#fee2e2]',
  },
}

const orderStatusMap: Record<string, StatusLabel> = {
  order_placed: {
    label: 'Bestellt',
    colorClass: 'text-[#9a3412]',
    backgroundClass: 'bg-[#fed7aa]',
  },
  confirmed: {
    label: 'Bestätigt',
    colorClass: 'text-[#92400e]',
    backgroundClass: 'bg-[#fde68a]',
  },
  inspected: {
    label: 'Geprüft',
    colorClass: 'text-[#064e3b]',
    backgroundClass: 'bg-[#bbf7d0]',
  },
  delivered: {
    label: 'Geliefert',
    colorClass: 'text-[#0f766e]',
    backgroundClass: 'bg-[#ccfbf1]',
  },
  completed: {
    label: 'Abgeschlossen',
    colorClass: 'text-[#14532d]',
    backgroundClass: 'bg-[#dcfce7]',
  },
}

const vehicleStatusMap: Record<string, StatusLabel> = {
  order_placed: orderStatusMap.order_placed,
  confirmed: orderStatusMap.confirmed,
  inspected: orderStatusMap.inspected,
  delivered: orderStatusMap.delivered,
  completed: orderStatusMap.completed,
}

export function getUserStatusLabel(isActive: boolean): StatusLabel {
  return isActive ? userStatusMap.active : userStatusMap.inactive
}

export function getOrderStatusLabel(status: string): StatusLabel {
  return orderStatusMap[status] ?? {
    label: status ? status.replace(/_/g, ' ') : 'Unbekannt',
    colorClass: 'text-[#334155]',
    backgroundClass: 'bg-[#f8fafc]',
  }
}

export function getVehicleStatusLabel(status: string): StatusLabel {
  return vehicleStatusMap[status] ?? getOrderStatusLabel(status)
}
