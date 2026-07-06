<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { adminVehiclesApi, vehicleApi } from "@/api";
import type { VehicleDocument } from "@/types";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const props = defineProps<{
  open: boolean;
  vehicleId?: string;
  auftragsnummer?: string;
}>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  uploaded: [doc: VehicleDocument];
  changed: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const uploadError = ref("");
const isLoading = ref(false);
const documents = ref<VehicleDocument[]>([]);
const documentType = ref("rechnung");
const documentTitle = ref("Rechnung");

// The document_type drives the grouping/heading in the Vehicle Docs panel
// (AdminVehicleOrderHistory), so it must match the keys in its
// DOCUMENT_TYPE_LABELS map. This is the *invoice* upload modal, so the type is
// locked to "rechnung" — invoices always land in their own "Rechnung" section
// and can never be confused with admin-uploaded reports.
const documentTypeOptions = [{ label: "Rechnung", value: "rechnung" }];

// Title shown for the document must match the selected type, otherwise the row
// label in the Vehicle Docs panel contradicts the section it lands under.
function titleForType(type: string): string {
  return documentTypeOptions.find((o) => o.value === type)?.label ?? "";
}

function close() {
  emit("update:open", false);
}

function openFilePicker() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  selectedFile.value = e.dataTransfer?.files?.[0] ?? null;
}

async function fetchDocuments() {
  if (!props.vehicleId) return;

  isLoading.value = true;
  uploadError.value = "";

  try {
    documents.value = await vehicleApi.getVehicleDocuments(props.vehicleId);
  } catch (err) {
    console.error("Failed to fetch vehicle documents:", err);
    uploadError.value = "Dokumente konnten nicht geladen werden.";
  } finally {
    isLoading.value = false;
  }
}

async function uploadDocument() {
  if (!props.vehicleId) {
    uploadError.value = "Kein Fahrzeug ausgewählt.";
    return;
  }

  if (!props.auftragsnummer) {
    uploadError.value = "Keine Auftragsnummer verfügbar.";
    return;
  }

  if (!selectedFile.value) {
    uploadError.value = "Bitte wählen Sie eine Datei zum Hochladen aus.";
    return;
  }

  isLoading.value = true;
  uploadError.value = "";

  try {
    const newDoc = await adminVehiclesApi.uploadReport(
      props.auftragsnummer,
      props.vehicleId,
      documentType.value,
      documentTitle.value || titleForType(documentType.value) || selectedFile.value.name,
      selectedFile.value,
      false,
    );
    selectedFile.value = null;
    await fetchDocuments();

    // refresh vehicle lists in stores
    try {
      const auth = useAuthStore();
      const vehicleStore = useVehicleStore();
      const b2bStore = useB2BVehicleStore();
      if (auth.user?.id) {
        void vehicleStore.fetchVehicles(auth.user.id);
        void b2bStore.fetchVehicles(auth.user.id);
      }
    } catch (err) {
      console.warn("Could not refresh vehicle stores after upload", err);
    }

    emit("uploaded", newDoc);
    close();
  } catch (err) {
    console.error("Upload fehlgeschlagen:", err);
    uploadError.value = "Dokument konnte nicht hochgeladen werden.";
  } finally {
    isLoading.value = false;
  }
}

async function deleteDocument(documentId: string) {
  if (!props.vehicleId) return;

  isLoading.value = true;
  uploadError.value = "";

  try {
    await adminVehiclesApi.deleteReport(documentId);
    documents.value = documents.value.filter((doc) => doc.id !== documentId);

    // refresh vehicle lists
    try {
      const auth = useAuthStore();
      const vehicleStore = useVehicleStore();
      const b2bStore = useB2BVehicleStore();
      if (auth.user?.id) {
        void vehicleStore.fetchVehicles(auth.user.id);
        void b2bStore.fetchVehicles(auth.user.id);
      }
    } catch (err) {
      console.warn("Could not refresh vehicle stores after delete", err);
    }

    emit("changed");
  } catch (err) {
    console.error("Löschen fehlgeschlagen:", err);
    uploadError.value = "Dokument konnte nicht gelöscht werden.";
  } finally {
    isLoading.value = false;
  }
}

// Keep the title in sync with the selected document type.
watch(documentType, (newType) => {
  documentTitle.value = titleForType(newType);
});

watch(
  () => props.open,
  async (open) => {
    if (open) {
      documentType.value = "rechnung";
      documentTitle.value = "Rechnung";
      selectedFile.value = null;
      await fetchDocuments();
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 720px; max-width: calc(100vw - 2rem)"
      :show-close-button="false"
    >
      <div class="relative">
        <button
          @click="close"
          class="absolute -right-1 -top-1 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600"
        >
          <Icon icon="mdi:close" class="size-8" />
        </button>

        <div
          class="bg-white border border-[#C6C6CD] p-6 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-6 pt-6 mb-6">
            <h2 class="text-[20px] font-bold leading-normal text-black">Rechnung hochladen</h2>
            <p class="mt-1 mx-2 pb-3 text-sm font-light leading-normal not-italic text-[#00000080]">
              Laden Sie ein neues Dokument hoch – ziehen Sie die Datei dazu auf die Fläche oder
              wählen Sie sie von Ihrem Rechner aus.
            </p>
          </div>

          <!-- Body -->
          <div class="flex flex-col gap-3 px-6 pb-6">
            <!-- Document Type — locked to "Rechnung" so invoices always land in
                 their own section, never mixed with reports. -->
            <div class="flex flex-col gap-2">
              <span class="text-sm font-semibold text-black">Dokumententyp</span>
              <div
                class="flex h-9 items-center rounded-full border border-gray-200 bg-gray-100 px-4 text-sm text-gray-600"
              >
                Rechnung
              </div>
            </div>

            <!-- Upload invoice section -->
            <div class="flex flex-col gap-2">
              <span class="text-sm font-semibold text-black">Rechnung hochladen</span>

              <!-- Drop zone -->
              <div
                class="relative flex h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border transition-colors"
                :style="
                  isDragging
                    ? 'border-color: #01B990; border-style: dashed'
                    : 'border-color: #B7C2C2; border-style: dashed'
                "
                @click="openFilePicker"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.png"
                  class="hidden"
                  @change="onFileChange"
                />

                <template v-if="selectedFile">
                  <Icon icon="mdi:file-check-outline" class="mb-1 size-8" style="color: #01b990" />
                  <span class="text-center text-sm text-gray-800">{{ selectedFile.name }}</span>
                </template>
                <template v-else>
                  <Icon icon="mdi:upload-outline" class="size-8 mb-2 text-gray-500" />
                  <p class="text-center text-sm text-gray-600">
                    Zum Hochladen klicken oder Datei hierher ziehen
                  </p>
                  <p class="mt-1 text-xs text-gray-400">.pdf, .jpg oder .png</p>
                </template>
              </div>

              <!-- Selected file display -->
              <div
                v-if="selectedFile"
                class="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-800">{{ selectedFile.name }}</span>
                  <span class="text-xs text-gray-500"
                    >{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </span>
                </div>
                <button
                  type="button"
                  class="text-gray-500 hover:text-gray-700"
                  @click.stop="selectedFile = null"
                >
                  <Icon icon="mdi:close" class="size-5" />
                </button>
              </div>
            </div>

            <p v-if="uploadError" class="text-sm text-red-500">
              {{ uploadError }}
            </p>
          </div>

          <!-- Footer: Bestätigen button with upload -->
          <div class="flex justify-center px-6 pb-6">
            <button
              class="h-9 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
              style="background: #ef8450"
              :disabled="isLoading"
              @click="uploadDocument"
            >
              {{ isLoading ? "Lädt..." : "Bestätigen" }}
            </button>
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
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at calc(100% - var(--r)) var(--r), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 0 var(--_m),
    100% calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 0, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r) - var(--x)) calc(var(--r) + var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}
</style>
