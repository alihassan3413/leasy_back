import { computed } from 'vue'
import type { Ref } from 'vue'

type Branch = {
  name: string
  address: string
  phone: string
  email: string
  distance: string
}

const branches: Record<string, Branch> = {
  koeln: {
    name: 'TÜV Rheinland Prüfstelle Köln-Mülheim',
    address: 'Frankfurter Str. 200, 51065 Köln',
    phone: 'T.: 080088388838',
    email: 'Email: tuv.km@hreinland.de',
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

export function useBranches(selectedCity: Ref<string | undefined>) {
  const stadtOptions = [
    { value: 'koeln', label: 'Köln' },
    { value: 'hamburg', label: 'Hamburg' },
    { value: 'berlin', label: 'Berlin' },
    { value: 'muenchen', label: 'München' },
    { value: 'frankfurt', label: 'Frankfurt' },
  ]

  const selectedBranch = computed(() => {
    if (!selectedCity.value) return null

    return branches[selectedCity.value] ?? null
  })

  return {
    stadtOptions,
    selectedBranch,
  }
}