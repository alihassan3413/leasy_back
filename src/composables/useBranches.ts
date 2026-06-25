import { computed, ref } from "vue";
import type { Ref } from "vue";

type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  distance: string;
  ort: string;
  strasse: string;
  plz: string;
  service: "tuvsud" | "dekra";
};

const branches: Record<string, Branch> = {
  koeln: {
    id: "koeln",
    name: "TÜV Rheinland Prüfstelle Köln-Mülheim",
    address: "Frankfurter Str. 200, 51065 Köln",
    phone: "T.: 080088388838",
    email: "Email: tuv.km@hreinland.de",
    distance: "Entfernung: 14km",
    ort: "Köln",
    strasse: "Frankfurter Str. 200",
    plz: "51065",
    service: "tuvsud",
  },
  hamburg: {
    id: "hamburg",
    name: "TÜV Nord Hamburg",
    address: "Beim Strohhause 31, 20097 Hamburg",
    phone: "T.: 0800 88 38 88 00",
    email: "Email: tuv.hh@nord.de",
    distance: "Entfernung: 8km",
    ort: "Hamburg",
    strasse: "Beim Strohhause 31",
    plz: "20097",
    service: "tuvsud",
  },
  berlin: {
    id: "berlin",
    name: "TÜV Rheinland Berlin",
    address: "Salzufer 22, 10587 Berlin",
    phone: "T.: 0800 88 38 88 11",
    email: "Email: tuv.ber@rheinland.de",
    distance: "Entfernung: 5km",
    ort: "Berlin",
    strasse: "Salzufer 22",
    plz: "10587",
    service: "tuvsud",
  },
  muenchen: {
    id: "muenchen",
    name: "TÜV SÜD München",
    address: "Westendstraße 199, 80686 München",
    phone: "T.: 0800 88 38 88 22",
    email: "Email: tuv.muc@sued.de",
    distance: "Entfernung: 11km",
    ort: "München",
    strasse: "Westendstraße 199",
    plz: "80686",
    service: "tuvsud",
  },
  frankfurt: {
    id: "frankfurt",
    name: "TÜV Hessen Frankfurt",
    address: "Gutleutstraße 163, 60327 Frankfurt",
    phone: "T.: 0800 88 38 88 33",
    email: "Email: tuv.fra@hessen.de",
    distance: "Entfernung: 7km",
    ort: "Frankfurt",
    strasse: "Gutleutstraße 163",
    plz: "60327",
    service: "tuvsud",
  },
  // DEKRA branches
  "dekra-koeln": {
    id: "dekra-koeln",
    name: "DEKRA Köln",
    address: "Am Dom 1, 50667 Köln",
    phone: "T.: 0800 33572000",
    email: "Email: info.koeln@dekra.de",
    distance: "Entfernung: 12km",
    ort: "Köln",
    strasse: "Am Dom 1",
    plz: "50667",
    service: "dekra",
  },
  "dekra-hamburg": {
    id: "dekra-hamburg",
    name: "DEKRA Hamburg",
    address: "Rathausmarkt 1, 20095 Hamburg",
    phone: "T.: 0800 33572001",
    email: "Email: info.hamburg@dekra.de",
    distance: "Entfernung: 6km",
    ort: "Hamburg",
    strasse: "Rathausmarkt 1",
    plz: "20095",
    service: "dekra",
  },
  "dekra-berlin": {
    id: "dekra-berlin",
    name: "DEKRA Berlin",
    address: "Alexanderplatz 1, 10178 Berlin",
    phone: "T.: 0800 33572002",
    email: "Email: info.berlin@dekra.de",
    distance: "Entfernung: 4km",
    ort: "Berlin",
    strasse: "Alexanderplatz 1",
    plz: "10178",
    service: "dekra",
  },
};

export function useBranches(
  selectedCity: Ref<string | undefined>,
  selectedService?: Ref<"tuvsud" | "dekra" | undefined>,
) {
  const stadtOptions = [
    { value: "koeln", label: "Köln" },
    { value: "hamburg", label: "Hamburg" },
    { value: "berlin", label: "Berlin" },
    { value: "muenchen", label: "München" },
    { value: "frankfurt", label: "Frankfurt" },
  ];

  const allBranches = computed(() => {
    const branchesList = Object.values(branches);
    if (!selectedService?.value) return branchesList;
    return branchesList.filter((branch) => branch.service === selectedService.value);
  });

  const selectedBranch = computed(() => {
    if (!selectedCity.value) return null;

    return branches[selectedCity.value] ?? null;
  });

  async function geocodeBranch(branch: Branch) {
    const q = `${branch.strasse}, ${branch.plz} ${branch.ort}, Germany`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await res.json();
      if (data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  return {
    stadtOptions,
    allBranches,
    selectedBranch,
    geocodeBranch,
  };
}
