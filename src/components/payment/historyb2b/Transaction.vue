<script setup lang="ts">
import { Icon } from "@iconify/vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  {
    ausstellung: "25.07.2025",
    rechnungsnummer: "Nr. 145874551",
    kenzeichen: "D-K LA 7401",
    rechnungsbetrag: "2.468,25 €",
    rechnungssaldo: "0,00 €",
  },
  {
    ausstellung: "10.03.2021",
    rechnungsnummer: "Nr. 157486137",
    kenzeichen: "D-AC DE 275",
    rechnungsbetrag: "2.150,30 €",
    rechnungssaldo: "0,00 €",
  },
  {
    ausstellung: "28.11.2016",
    rechnungsnummer: "Nr. 087486842",
    kenzeichen: "D-DU OX 801",
    rechnungsbetrag: "1.726,50 €",
    rechnungssaldo: "0,00 €",
  },
  {
    ausstellung: "17.09.2013",
    rechnungsnummer: "Nr. 127224781",
    kenzeichen: "D-K LA 334",
    rechnungsbetrag: "940,80 €",
    rechnungssaldo: "0,00 €",
  },
];
</script>

<template>
  <div class="w-full pt-2">
    <h2 class="text-lg md:text-[22px] font-normal text-color-primary my-4 pl-3 md:pl-8">Transaktionen</h2>

    <!-- Desktop: Table View -->
    <div class="hidden md:block overflow-hidden rounded-[5px] border border-green-gray">
      <Table>
        <TableHeader>
          <TableRow
            class="border-0 hover:bg-transparent"
            style="background-color: #01b990; height: 40px"
          >
            <TableHead class="h-10 px-4 text-[18px] font-normal text-white"
              >Ausstellung</TableHead
            >
            <TableHead class="h-10 px-4 text-[18px] font-normal text-white"
              >Rechnungsnummer</TableHead
            >
            <TableHead class="h-10 px-4 text-[18px] font-normal text-white"
              >Kenzeichen</TableHead
            >
            <TableHead class="h-10 px-4 text-[18px] font-normal text-white"
              >Rechnungsbetrag</TableHead
            >
            <TableHead class="h-10 px-4 text-[18px] font-normal text-white"
              >Rechnungssaldo</TableHead
            >
            <TableHead class="h-10 px-4 text-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(transaction, index) in transactions"
            :key="index"
            class="border-b border-green-gray/30 hover:bg-gray-50 transition-colors"
          >
            <TableCell class="py-3 px-4 text-base text-custom-black">{{
              transaction.ausstellung
            }}</TableCell>
            <TableCell class="py-3 px-4 text-base text-custom-black">{{
              transaction.rechnungsnummer
            }}</TableCell>
            <TableCell class="py-3 px-4 text-base text-custom-black">{{
              transaction.kenzeichen
            }}</TableCell>
            <TableCell class="py-3 px-4 text-base text-custom-black">{{
              transaction.rechnungsbetrag
            }}</TableCell>
            <TableCell class="py-3 px-4 text-base text-custom-black">{{
              transaction.rechnungssaldo
            }}</TableCell>
            <TableCell class="py-3 px-4 text-right">
              <button
                class="text-custom-green hover:opacity-80 transition-opacity"
              >
                <Icon icon="mdi:file-download-outline" class="size-6 cursor-pointer" />
              </button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Mobile: Card View -->
    <div class="md:hidden flex flex-col gap-3">
      <div
        v-for="(transaction, index) in transactions"
        :key="index"
        class="bg-white border border-green-gray rounded-[5px] p-4"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="text-xs text-gray-500">Ausstellung</span>
            <p class="text-sm font-medium text-custom-black">{{ transaction.ausstellung }}</p>
          </div>
          <button class="text-custom-green hover:opacity-80 transition-opacity">
            <Icon icon="mdi:file-download-outline" class="size-5 cursor-pointer" />
          </button>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Rechnungsnummer</span>
            <span class="text-sm text-custom-black">{{ transaction.rechnungsnummer }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Kenzeichen</span>
            <span class="text-sm font-medium text-custom-black">{{ transaction.kenzeichen }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Rechnungsbetrag</span>
            <span class="text-sm font-bold text-custom-black">{{ transaction.rechnungsbetrag }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">Rechnungssaldo</span>
            <span class="text-sm text-custom-black">{{ transaction.rechnungssaldo }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
