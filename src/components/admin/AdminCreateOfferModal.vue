<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AdminVehicle } from "@/types";
import { adminOffersApi } from "@/api";

const props = defineProps<{
    open: boolean;
    vehicle: AdminVehicle | null;
}>();

const emit = defineEmits<{
    "update:open": [value: boolean];
    success: [];
}>();

const isLoading = ref(false);

// Define state for each field's net and gross
const repairCosts = ref({ net: "", gross: "" });
const depreciationValue = ref({ net: "", gross: "" });
const workshopQuote = ref({ net: "", gross: "" });
const missingPartsCost = ref({ net: "", gross: "" });
const notes = ref("");

// Auto-calculate gross from net (assuming 19% VAT as standard in DE)
const calculateGross = (netStr: string): string => {
    const net = parseFloat(netStr);
    if (isNaN(net)) return "";
    const gross = net * 1.19;
    return gross.toFixed(2);
};

// Auto-calculate net from gross
const calculateNet = (grossStr: string): string => {
    const gross = parseFloat(grossStr);
    if (isNaN(gross)) return "";
    const net = gross / 1.19;
    return net.toFixed(2);
};

// Watch for changes to calculate gross/net
watch(() => repairCosts.value.net, (newNet) => {
    repairCosts.value.gross = calculateGross(newNet);
});
watch(() => repairCosts.value.gross, (newGross) => {
    repairCosts.value.net = calculateNet(newGross);
});

watch(() => depreciationValue.value.net, (newNet) => {
    depreciationValue.value.gross = calculateGross(newNet);
});
watch(() => depreciationValue.value.gross, (newGross) => {
    depreciationValue.value.net = calculateNet(newGross);
});

watch(() => workshopQuote.value.net, (newNet) => {
    workshopQuote.value.gross = calculateGross(newNet);
});
watch(() => workshopQuote.value.gross, (newGross) => {
    workshopQuote.value.net = calculateNet(newGross);
});

watch(() => missingPartsCost.value.net, (newNet) => {
    missingPartsCost.value.gross = calculateGross(newNet);
});
watch(() => missingPartsCost.value.gross, (newGross) => {
    missingPartsCost.value.net = calculateNet(newGross);
});

// Auto-calculate final total
const finalTotal = computed(() => {
    const repairNet = parseFloat(repairCosts.value.net) || 0;
    const depNet = parseFloat(depreciationValue.value.net) || 0;
    const workshopNet = parseFloat(workshopQuote.value.net) || 0;
    const partsNet = parseFloat(missingPartsCost.value.net) || 0;

    const totalNet = repairNet + depNet + workshopNet + partsNet;
    const totalGross = totalNet * 1.19;

    return {
        net: totalNet.toFixed(2),
        gross: totalGross.toFixed(2),
    };
});

// Reset form when closing
watch(
    () => props.open,
    (opened) => {
        if (!opened) {
            repairCosts.value = { net: "", gross: "" };
            depreciationValue.value = { net: "", gross: "" };
            workshopQuote.value = { net: "", gross: "" };
            missingPartsCost.value = { net: "", gross: "" };
            notes.value = "";
        }
    },
);

function close() {
    emit("update:open", false);
}

async function handleSubmit() {
    if (!props.vehicle?.current_auftragsnummer) {
        console.error("No auftragsnummer available");
        return;
    }
    
    try {
        isLoading.value = true;
        await adminOffersApi.createDraft(props.vehicle.current_auftragsnummer, {
            repair_cost_net: repairCosts.value.net,
            repair_cost_gross: repairCosts.value.gross,
            depreciation_value_net: depreciationValue.value.net,
            depreciation_value_gross: depreciationValue.value.gross,
            workshop_repair_quote_net: workshopQuote.value.net,
            workshop_repair_quote_gross: workshopQuote.value.gross,
            missing_parts_cost_net: missingPartsCost.value.net,
            missing_parts_cost_gross: missingPartsCost.value.gross,
            additional_notes: notes.value,
        });
        emit("success");
        close();
    } catch (err) {
        console.error("Error submitting offer:", err);
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
            style="width: 720px; max-width: 720px" :show-close-button="false">
            <div class="relative">
                <button @click="close"
                    class="absolute -right-1 -top-1 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600">
                    <Icon icon="mdi:close" class="size-8" />
                </button>

                <div class="bg-white border border-[#C6C6CD] p-6 inverted-corner inverted-corner-top-right"
                    style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))">
                    <div class="px-6 pt-6 mb-6">
                        <h2 class="text-[20px] font-bold leading-normal text-black">
                            Angebot erstellen
                        </h2>
                        <p class="mt-1 mx-2 pb-3 text-sm font-light leading-normal not-italic text-[#00000080]">
                            Bitte füllen Sie die Details für das Angebot aus.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-x-4 gap-y-3 px-4 max-h-[70vh] overflow-y-auto pr-1">
                        <!-- Repair Costs -->
                        <div class="col-span-2 flex flex-col gap-2">
                            <label class="text-sm font-semibold text-black">
                                Reparaturkosten Gesamt
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Netto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="repairCosts.net" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Brutto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="repairCosts.gross" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Depreciation Value -->
                        <div class="col-span-2 flex flex-col gap-2">
                            <label class="text-sm font-semibold text-black">
                                Wertminderung Gesamt
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Netto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="depreciationValue.net" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Brutto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="depreciationValue.gross" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Workshop Repair Quote -->
                        <div class="col-span-2 flex flex-col gap-2">
                            <label class="text-sm font-semibold text-black">
                                Werkstattreparaturangebot
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Netto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="workshopQuote.net" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Brutto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="workshopQuote.gross" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Missing Parts Cost -->
                        <div class="col-span-2 flex flex-col gap-2">
                            <label class="text-sm font-semibold text-black">
                                Fehlende Teile Kosten
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Netto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="missingPartsCost.net" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Brutto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 px-4 focus-within:border-emerald-500">
                                        <input v-model="missingPartsCost.gross" type="number" step="0.01"
                                            class="h-full w-full bg-transparent text-sm outline-none"
                                            placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Final Total -->
                        <div class="col-span-2 flex flex-col gap-2 bg-gray-50 rounded-xl p-4">
                            <label class="text-sm font-semibold text-black">
                                Endsumme (auto-berechnet)
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Netto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 bg-white px-4">
                                        <span class="text-sm font-medium text-gray-700">{{
                                            finalTotal.net
                                            }}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-xs font-medium text-gray-500">
                                        Brutto (€)
                                    </label>
                                    <div
                                        class="relative flex h-9 items-center rounded-full border border-gray-300 bg-white px-4">
                                        <span class="text-sm font-medium text-gray-700">{{
                                            finalTotal.gross
                                            }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Notes -->
                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="text-sm font-semibold text-black">
                                Zusätzliche Informationen / Hinweise
                            </label>
                            <div
                                class="relative flex items-start rounded-full border border-gray-300 px-4 py-2 focus-within:border-emerald-500">
                                <textarea v-model="notes" rows="3"
                                    class="w-full bg-transparent text-sm outline-none resize-none"
                                    placeholder="Hinweise hinzufügen..." />
                            </div>
                        </div>

                        <!-- Submit -->
                        <div class="mt-2 flex justify-center col-span-2">
                            <button
                                class="h-9 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
                                style="background: #EF8450;" :disabled="isLoading" @click="handleSubmit">
                                {{ isLoading ? "Lädt..." : "Angebot erstellen" }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
.inverted-corner {
    --r: 38px;
    --s: 32px;
    --x: 0px;
    --y: 0px;
    border-radius: var(--r);
}

.inverted-corner-top-right {
    --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 0%);
    --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
    --_d: (var(--s) + var(--r));

    mask:
        calc(100% - var(--_d) - var(--x)) 0 var(--_m),
        100% calc(var(--_d) + var(--y)) var(--_m),
        radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 0.5px)) calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
        var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
        var(--_g) 0 calc(var(--_d) + var(--y));
    mask-repeat: no-repeat;
}
</style>
