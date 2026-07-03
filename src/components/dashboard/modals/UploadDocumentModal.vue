<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { vehicleApi } from "@/api";
import type { VehicleDocument } from "@/types";
import { useVehicleStore } from "@/stores/vehicle.store";
import { useB2BVehicleStore } from "@/stores/b2bVehicle.store";
import { useAuthStore } from "@/stores/auth.store";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const props = defineProps<{ open: boolean; vehicleId?: string }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  uploaded: [doc: VehicleDocument];
  changed: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const selectedDocType = ref("");
const uploadError = ref("");
const isLoading = ref(false);
const documents = ref<VehicleDocument[]>([]);
const docsOpen = ref(false);

const docOptions = [
  { label: "Leasingvertrag", value: "Leasingvertrag" },
  { label: "Vorschaden", value: "vorschaden" },
  { label: "Gutachten", value: "gutachten" },
  { label: "Sonstiges", value: "Sonstiges" },
];

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

  if (!selectedDocType.value) {
    uploadError.value = "Bitte wählen Sie einen Dokumenttyp aus.";
    return;
  }

  if (!selectedFile.value) {
    uploadError.value = "Bitte wählen Sie eine Datei zum Hochladen aus.";
    return;
  }

  const formData = new FormData();
  formData.append("document_type", selectedDocType.value);
  formData.append("file", selectedFile.value);

  isLoading.value = true;
  uploadError.value = "";

  try {
    const newDoc = await vehicleApi.uploadVehicleDocument(props.vehicleId, formData);
    selectedFile.value = null;
    selectedDocType.value = "";
    await fetchDocuments();

    // refresh vehicle lists in stores so dashboard shows the newly uploaded document
    try {
      const auth = useAuthStore();
      const vehicleStore = useVehicleStore();
      const b2bStore = useB2BVehicleStore();
      if (auth.user?.id) {
        // refresh both stores where applicable
        void vehicleStore.fetchVehicles(auth.user.id);
        void b2bStore.fetchVehicles(auth.user.id);
      }
    } catch (err) {
      // non-fatal if stores not available
      console.warn("Could not refresh vehicle stores after upload", err);
    }

    emit("uploaded", newDoc);
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
    await vehicleApi.deleteVehicleDocument(props.vehicleId, documentId);
    documents.value = documents.value.filter((doc) => doc.id !== documentId);

    // refresh vehicle lists in stores so dashboard shows updated state
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

    // notify parent components that documents changed
    emit("changed");
  } catch (err) {
    console.error("Löschen fehlgeschlagen:", err);
    uploadError.value = "Dokument konnte nicht gelöscht werden.";
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await fetchDocuments();
    }
  },
);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-visible bg-transparent border-none shadow-none rounded-none"
      style="width: 100%; max-width: 720px"
      :show-close-button="false"
    >
      <div class="relative px-3 md:px-0">
        <button
          @click="close"
          class="absolute -right-1 -top-1 md:-right-1 md:-top-1 z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition-colors hover:bg-emerald-600"
        >
          <Icon icon="mdi:close" class="size-6 md:size-8" />
        </button>

        <div
          class="bg-white border border-[#C6C6CD] p-3 md:p-4 inverted-corner inverted-corner-top-right"
          style="filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))"
        >
          <div class="px-2 md:px-4 pt-2 md:pt-3 mb-2 md:mb-3">
            <h2 class="text-[16px] md:text-[18px] font-bold leading-normal text-black pr-8 md:pr-0">
              Dokumente hochladen
            </h2>
            <p
              class="mt-1 mx-0 md:mx-2 pb-2 text-xs md:text-sm font-light leading-normal not-italic text-[#00000080]"
            >
              Laden Sie ganz einfach ein neues Dokument hoch – ziehen Sie die Datei dazu auf die
              Fläche oder wählen Sie sie von Ihrem Rechner aus.
            </p>
          </div>

          <!-- Body — responsive layout: stack on mobile, two columns on desktop -->
          <div class="flex flex-col md:flex-row gap-3 md:gap-5 px-0 md:px-4 pb-4 md:pb-5">
            <!-- Left: file drop zone -->
            <div class="flex flex-1 flex-col gap-2">
              <span class="text-sm font-semibold text-black"
                >Laden Sie ein neues Dokument hoch</span
              >

              <!-- Drop area -->
              <div
                class="relative flex h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border transition-colors"
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
                  <p class="px-4 text-center text-sm text-gray-800">
                    Datei hierher ziehen oder zum Hochladen durchsuchen
                  </p>
                  <p class="mt-3 text-xs tracking-widest text-gray-400">
                    PDF, JPG oder PNG • 8MB max
                  </p>
                </template>
              </div>
            </div>

            <!-- Right: upload options and document list -->
            <div class="flex flex-1 flex-col gap-3">
              <span class="text-sm font-semibold text-black">Dokumenttyp wählen</span>

              <div class="relative">
                <div
                  class="flex h-8 cursor-pointer items-center justify-between rounded-full border border-gray-300 px-4 outline-none focus-within:border-emerald-500"
                  @click="docsOpen = !docsOpen"
                >
                  <span
                    class="text-sm"
                    :class="selectedDocType ? 'text-gray-800' : 'text-gray-400'"
                  >
                    {{ selectedDocType || "Dokumenttyp wählen" }}
                  </span>
                  <Icon
                    :icon="docsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                    class="text-gray-500 text-[24px]"
                  />
                </div>

                <div
                  v-if="docsOpen"
                  class="absolute top-full z-[10000] mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg"
                >
                  <div
                    v-for="opt in docOptions"
                    :key="opt.value"
                    class="flex h-8 cursor-pointer items-center px-4 text-sm hover:bg-gray-50 text-gray-800"
                    @click="
                      selectedDocType = opt.value;
                      docsOpen = false;
                    "
                  >
                    {{ opt.label }}
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-gray-300 bg-white p-4">
                <p class="mb-2 text-sm font-semibold text-black">Vorhandene Dokumente</p>

                <div v-if="isLoading" class="text-sm text-gray-400">Lade Dokumente...</div>
                <div v-else-if="documents.length === 0" class="text-sm text-gray-400">
                  Keine Dokumente vorhanden.
                </div>

                <div v-else class="flex flex-col gap-2">
                  <div
                    v-for="doc in documents"
                    :key="doc.id"
                    class="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <p class="text-sm font-medium text-gray-800">
                        {{ doc.file_name || doc.document_type }}
                      </p>
                      <p class="text-xs text-gray-400">
                        {{ doc.document_type }}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="text-sm font-semibold text-red-500 hover:text-red-600"
                      @click="deleteDocument(doc.id)"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>

              <p v-if="uploadError" class="text-sm text-red-500">
                {{ uploadError }}
              </p>

              <button
                class="h-8 w-full rounded-full bg-emerald-500 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-lg"
                :disabled="isLoading"
                @click="uploadDocument"
              >
                {{ isLoading ? "Lädt..." : "Hochladen" }}
              </button>
            </div>
          </div>

          <!-- Footer: Bestätigen button -->
          <div class="flex justify-center px-2 md:px-4 pb-3 md:pb-4">
            <button
              class="h-8 w-full md:w-auto px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 shadow-lg"
              style="background: #ef8450"
              @click="close"
            >
              Bestätigen
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

.inverted-corner-top-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(at var(--r) var(--r), #000 75%, #0000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 0 var(--_m),
    0 calc(var(--_d) + var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 0, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x))
      calc(var(--r) + var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(var(--_d) + var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-right {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(
    from 90deg at calc(100% - var(--r)) calc(100% - var(--r)),
    #0000 25%,
    #000 0
  );
  --_d: (var(--s) + var(--r));

  mask:
    calc(100% - var(--_d) - var(--x)) 100% var(--_m),
    100% calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 100% 100%, #0000 99%, #000 calc(100% + 1px))
      calc(-1 * var(--r) - var(--x)) calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(-1 * var(--_d) - var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}

.inverted-corner-bottom-left {
  --_m: /calc(2 * var(--r)) calc(2 * var(--r)) radial-gradient(#000 70%, #0000 72%);
  --_g: conic-gradient(from 180deg at var(--r) calc(100% - var(--r)), #0000 25%, #000 0);
  --_d: (var(--s) + var(--r));

  mask:
    calc(var(--_d) + var(--x)) 100% var(--_m),
    0 calc(100% - var(--_d) - var(--y)) var(--_m),
    radial-gradient(var(--s) at 0 100%, #0000 99%, #000 calc(100% + 1px)) calc(var(--r) + var(--x))
      calc(-1 * var(--r) - var(--y)),
    var(--_g) calc(var(--_d) + var(--x)) 0,
    var(--_g) 0 calc(-1 * var(--_d) - var(--y));
  mask-repeat: no-repeat;
}
</style>
