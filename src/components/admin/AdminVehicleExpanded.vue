<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProfileAvatar from "@/assets/logo/B2bProfile-img.svg";

defineProps<{ vehicle: any }>();

const timeline = [
  {
    datetime: "29.02.2025\n10:30 Uhr",
    label: "DEKRA",
    sublabel: "Hugo-Eckener-Straße\n26, 50829 Köln",
    status: "completed",
  },
  {
    datetime: "15.03.2025\n11:30 Uhr",
    label: "DEKRA",
    sublabel: "Clevischer Ring\n131, 51063 Köln",
    status: "completed",
  },
  {
    datetime: "16.03.2025\n11:30 Uhr",
    label: "Dekra-Bericht",
    status: "active",
  },
  {
    datetime: "21.03.2025\n13:00 Uhr",
    label: "Schätzung angenommen",
    status: "pending",
  },
  { datetime: "28.03.2025\n09:30 Uhr", label: "In Arbeit", status: "pending" },
  {
    datetime: "25.04.2025\n16:30 Uhr",
    label: "Warten auf die Endkontrolle",
    status: "pending",
  },
  { datetime: "11.05.2025\n11:10 Uhr", label: "Vollendet", status: "pending" },
];

const offers = [
  {
    id: "01",
    name: "Göhler Werkstatt",
    address: "Siemensstraße 5-7, 63768 Hösbach",
    distance: "227km",
    saving: "36€",
    cost: "1866 €",
    accepted: false,
  },
  {
    id: "02",
    name: "HanseMerkur",
    address: "Buxtehuder Str. 41, 21073 Hamburg",
    distance: "406km",
    saving: "85€",
    cost: "2555 €",
    accepted: false,
  },
  {
    id: "03",
    name: "ATU Lüneburg",
    address: "Lilienthalstraße 7, 21337 Lüneburg",
    distance: "405km",
    saving: "59€",
    cost: "1755 €",
    accepted: true,
  },
];
</script>

<template>
  <TableRow class="border-0 hover:bg-transparent">
    <TableCell colspan="8" class="max-w-0 p-0 overflow-x-auto">
      <div class="flex gap-2.5 border-t border-[#D9E2E2] bg-white p-4 overflow-x-auto">
        <!-- Column 1: Firma & Werkstatt Logos -->
        <div class="flex w-43 shrink-0 flex-col gap-4">
          <div class="rounded-[5px] border border-[#ECECEC] p-3">
            <p class="text-base font-bold text-[#2E3E3F] mb-3">
              Firma
              <span class="text-[14px] font-normal text-[#2E3E3F]">
                / Firmenlogo
              </span>
            </p>
            <div
              class="aspect-square w-full bg-[#f3f4f6] rounded flex items-center justify-center"
            >
              <Icon icon="mdi:image-outline" class="size-12 text-gray-300" />
            </div>
          </div>
          <div class="rounded-[5px] border border-[#ECECEC] p-3">
            <p class="text-[14px] font-bold text-[#2E3E3F] mb-3">Werkstatt</p>
            <div
              class="aspect-square w-full bg-[#f3f4f6] rounded flex items-center justify-center"
            >
              <Icon icon="mdi:image-outline" class="size-12 text-gray-300" />
            </div>
          </div>
        </div>

        <!-- Column 2: Status Timeline -->
        <div class="flex w-71 shrink-0 flex-col rounded-[10px] border border-[#ECECEC] bg-white p-6">
          <p class="text-[20px] font-bold text-[#2E3E3F] mb-8">
            Status bei: ATU Lüneburg
          </p>
          <div class="flex flex-col">
            <div
              v-for="(entry, i) in timeline"
              :key="i"
              class="flex items-stretch min-h-15"
            >
              <!-- Date column -->
              <div class="w-25 shrink-0 text-right pr-4 pt-2">
                <span
                  class="text-sm text-[#2E3E3F] leading-tight block whitespace-pre-line font-normal"
                  >{{ entry.datetime }}</span
                >
              </div>

              <!-- Timeline indicator column -->
              <div class="relative flex w-6 shrink-0 flex-col items-center">
                <!-- Line -->
                <div
                  v-if="i < timeline.length - 1"
                  class="w-0.5 absolute top-5 bottom-0 z-0"
                  :class="
                    timeline[i + 1].status === 'completed'
                      ? 'bg-green-gray'
                      : 'bg-green-gray'
                  "
                ></div>
                <!-- Dot -->
                <div
                  class="size-2 rounded-full z-10 mt-3"
                  :class="
                    entry.status === 'completed'
                      ? 'bg-green-gray'
                      : 'bg-green-gray'
                  "
                ></div>
              </div>

              <!-- Label column -->
              <div class="flex-1 pl-4 pb-6">
                <div v-if="entry.label === 'DEKRA'" class="flex flex-col">
                  <div class="flex items-center gap-1.5">
                    <Icon
                      icon="ph:play-fill"
                      class="size-4 text-custom-green"
                    />
                    <span class="text-sm font-bold text-custom-green"
                      >DEKRA</span
                    >
                  </div>
                  <p
                    class="text-sm text-[#2E3E3F] leading-tight whitespace-pre-line mt-1"
                  >
                    {{ entry.sublabel }}
                  </p>
                </div>
                <div v-else class="pt-1">
                  <p
                    class="text-sm text-[#2E3E3F] leading-tight whitespace-pre-line font-normal"
                  >
                    {{ entry.label }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Angebote -->
        <div class="flex w-81 shrink-0 flex-col rounded-[5px] border border-[#ECECEC] bg-white p-4">
          <p class="text-[16px] font-bold text-[#2E3E3F] mb-4">Angebote</p>
          <div class="flex flex-col gap-4">
            <div
              v-for="offer in offers"
              :key="offer.id"
              class="flex flex-col gap-1"
            >
              <div class="flex justify-between items-center">
                <span
                  class="text-[14px] font-bold"
                  :class="offer.accepted ? 'text-[#2E3E3F]' : 'text-green-gray'"
                  >{{ offer.id }} - {{ offer.name }}</span
                >
                <div class="flex items-center gap-2">
                  <span
                    class="text-[14px]"
                    :class="
                      offer.accepted ? 'text-[#2E3E3F]' : 'text-green-gray'
                    "
                    >{{ offer.cost }}</span
                  >
                  <div
                    class="size-4 rounded-full border flex items-center justify-center"
                    :class="
                      offer.accepted ? 'border-[#EF8450]' : 'border-green-gray'
                    "
                  >
                    <div
                      v-if="offer.accepted"
                      class="size-2 rounded-full bg-[#EF8450]"
                    ></div>
                  </div>
                </div>
              </div>
              <p class="text-[11px] text-green-gray">{{ offer.address }}</p>
              <div class="flex justify-between text-[11px] text-green-gray">
                <span>Entfernung: {{ offer.distance }}</span>
                <span>Ersparnis: {{ offer.saving }}</span>
              </div>
            </div>
          </div>
          <button
            class="mt-4 w-full bg-green-gray text-white py-2 rounded font-bold text-[14px]"
          >
            Im Auftrag des Klienten Annehmen
          </button>

          <div class="mt-4 border border-green-gray rounded p-2">
            <p class="text-[13px] font-bold text-[#2E3E3F] mb-1">
              Angenommenes Angebot
            </p>
            <div class="bg-gray-50 p-1 text-[12px] text-gray-400">
              Noch kein Angebot vorhanden
            </div>
          </div>

          <div class="mt-6 flex justify-center gap-6">
            <!-- Days -->
            <div class="flex flex-col items-center gap-2">
              <div class="flex gap-1">
                <div
                  v-for="digit in ['0', '0']"
                  :key="digit"
                  class="relative w-7.5 h-12 bg-[#EF8450] border-[1.5px] border-green-gray rounded-[6px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                >
                  <span class="text-[30px] font-bold text-white leading-none">{{
                    digit
                  }}</span>
                  <div
                    class="absolute w-full h-[1.5px] bg-white top-[calc(50%-0.75px)] left-0"
                  ></div>
                </div>
              </div>
              <span class="text-[16px] font-bold text-[#2E3E3F]">days</span>
            </div>

            <!-- Hours -->
            <div class="flex flex-col items-center gap-2">
              <div class="flex gap-1">
                <div
                  v-for="digit in ['0', '3']"
                  :key="digit"
                  class="relative w-7.5 h-12 bg-[#EF8450] border-[1.5px] border-green-gray rounded-[6px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                >
                  <span class="text-[30px] font-bold text-white leading-none">{{
                    digit
                  }}</span>
                  <div
                    class="absolute w-full h-[1.5px] bg-white top-[calc(50%-0.75px)] left-0"
                  ></div>
                </div>
              </div>
              <span class="text-[16px] font-bold text-[#2E3E3F]">hours</span>
            </div>

            <!-- Minutes -->
            <div class="flex flex-col items-center gap-2">
              <div class="flex gap-1">
                <div
                  v-for="digit in ['0', '0']"
                  :key="digit"
                  class="relative w-7.5 h-12 bg-[#EF8450] border-[1.5px] border-green-gray rounded-[6px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                >
                  <span class="text-[30px] font-bold text-white leading-none">{{
                    digit
                  }}</span>
                  <div
                    class="absolute w-full h-[1.5px] bg-white top-[calc(50%-0.75px)] left-0"
                  ></div>
                </div>
              </div>
              <span class="text-[16px] font-bold text-[#2E3E3F]">minutes</span>
            </div>
          </div>
        </div>

        <!-- Column 4: Dokumente -->
        <div class="flex w-54.5 shrink-0 flex-col rounded-[5px] border border-[#ECECEC] bg-white p-4 relative">
          <button class="absolute right-0.5 top-0.5 text-custom-green">
            <Icon icon="mdi:pencil-outline" class="size-5" />
          </button>
          <p class="text-[16px] font-bold text-[#2E3E3F] mb-6">
            Fahrzeug Dokumente
          </p>
          <div class="flex flex-col gap-4 mb-8">
            <div
              v-for="doc in ['Leasingvertrag', 'TÜV', 'Vorschäden']"
              :key="doc"
              class="flex justify-between items-center"
            >
              <span class="text-[13px] text-[#2E3E3F]">{{ doc }}</span>
              <Icon
                icon="mdi:file-download-outline"
                class="size-5 text-custom-green"
              />
            </div>
          </div>
          <div class="border border-green-gray rounded p-2 text-center mb-6">
            <p class="text-[12px] text-custom-green">Vorgangsnummer:</p>
            <p class="text-[14px] font-bold text-custom-green">123456789-51225</p>
          </div>
          <p class="text-[14px] font-bold text-[#2E3E3F] mb-4">
            Rückgabe Dokumente
          </p>
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center">
              <span class="text-[13px] text-[#2E3E3F]">Gutachten</span>
              <Icon
                icon="mdi:file-download-outline"
                class="size-5 text-custom-green"
              />
            </div>
            <div
              class="border border-gray-200 rounded px-2 py-1 text-[12px] text-gray-400 flex justify-between"
            >
              <span>Ber.Nr.: 31584245133</span>
            </div>
            <div
              v-for="doc in ['Rechnung', 'Nachgutachten', 'Rücknahme Nachweis']"
              :key="doc"
              class="flex justify-between items-center"
            >
              <span class="text-[13px] text-[#2E3E3F]">{{ doc }}</span>
              <Icon
                icon="mdi:file-download-outline"
                class="size-5 text-custom-green"
              />
            </div>
          </div>
        </div>

        <!-- Column 5: Fahrzeug Daten -->
        <div class="flex w-37.5 shrink-0 flex-col rounded-[5px] border border-[#ECECEC] bg-white p-4 relative">
          <button class="absolute right-0.5 top-0.5 text-custom-green">
            <Icon icon="mdi:pencil-outline" class="size-5" />
          </button>
          <p class="text-[16px] font-bold text-[#2E3E3F] mb-6">
            Fahrzeug Daten
          </p>
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-[12px] text-gray-400">Kennzeichen:</p>
              <p class="text-[13px] font-medium text-[#2E3E3F]">
                {{ vehicle.licensePlate }}
              </p>
            </div>
            <div>
              <p class="text-[12px] text-gray-400">Modell:</p>
              <p class="text-[13px] font-medium text-[#2E3E3F]">
                {{ vehicle.model }}
              </p>
            </div>
            <div>
              <p class="text-[12px] text-gray-400">Kilometerstand:</p>
              <p class="text-[13px] font-medium text-[#2E3E3F]">15416 km</p>
            </div>
            <div>
              <p class="text-[12px] text-gray-400">Leasinggeber:</p>
              <p class="text-[13px] font-medium text-[#2E3E3F]">VW Leasing</p>
            </div>
            <div>
              <p class="text-[12px] text-gray-400">Leasing Abgabetermin:</p>
              <p class="text-[13px] font-medium text-[#2E3E3F]">25.05.2025</p>
            </div>
          </div>
        </div>

        <!-- Column 6: Zugewiesen -->
        <div class="flex w-50 shrink-0 flex-col rounded-[5px] border border-[#ECECEC] bg-white p-4 relative">
          <button class="absolute right-0.5 top-0.5 text-custom-green">
            <Icon icon="mdi:pencil-outline" class="size-5" />
          </button>
          <p class="text-[16px] font-bold text-[#2E3E3F] mb-4">Zugewiesen</p>
          <div class="flex justify-center mb-6">
            <!-- <Avatar class="size-20 bg-gray-200">
              <Icon icon="mdi:account" class="size-12 text-gray-400" />
            </Avatar> -->
            <img :src="ProfileAvatar" alt="" class="size-20 rounded-full" />
          </div>
          <div class="flex flex-col gap-2">
            <p class="text-[13px]">
              <span class="font-bold">Vorname:</span> Marcus
            </p>
            <p class="text-[13px]">
              <span class="font-bold">Nachname:</span> Dietrich
            </p>
            <p class="text-[13px]">
              <span class="font-bold">Tel.:</span> 17655874354
            </p>
            <p class="text-[13px] font-bold">Nutzungsadresse:</p>
            <p class="text-[12px] text-[#2E3E3F]">
              Radestraße 12, 35037 Marburg
            </p>
            <div class="mt-2">
              <p class="text-[13px] font-bold text-[#01B990]">Nutzer:</p>
              <p class="text-[13px] text-[#2E3E3F]">Wilhelm Tell</p>
            </div>
          </div>
        </div>
        
      </div>
    </TableCell>
  </TableRow>
</template>
