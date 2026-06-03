<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { vehicleApi } from '@/api'
import type { VehicleDocument } from '@/types'
import { useVehicleStore } from '@/stores/vehicle.store'
import { useB2BVehicleStore } from '@/stores/b2bVehicle.store'
import { useAuthStore } from '@/stores/auth.store'

const props = defineProps<{ open: boolean; vehicleId?: string }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  uploaded: [doc: VehicleDocument]
  changed: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const selectedDocType = ref('')
const uploadError = ref('')
const isLoading = ref(false)
const documents = ref<VehicleDocument[]>([])
const docsOpen = ref(false)

const docOptions = [
  { label: 'Leasingvertrag', value: 'Leasingvertrag' },
  { label: 'Vorschaden', value: 'vorschaden' },
  { label: 'Gutachten', value: 'gutachten' },
  { label: 'Sonstiges', value: 'Sonstiges' },
]

function close() {
  emit('update:open', false)
}

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  selectedFile.value = e.dataTransfer?.files?.[0] ?? null
}

async function fetchDocuments() {
  if (!props.vehicleId) return

  isLoading.value = true
  uploadError.value = ''

  try {
    documents.value = await vehicleApi.getVehicleDocuments(props.vehicleId)
  } catch (err) {
    console.error('Failed to fetch vehicle documents:', err)
    uploadError.value = 'Dokumente konnten nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

async function uploadDocument() {
  if (!props.vehicleId) {
    uploadError.value = 'Kein Fahrzeug ausgewählt.'
    return
  }

  if (!selectedDocType.value) {
    uploadError.value = 'Bitte wählen Sie einen Dokumenttyp aus.'
    return
  }

  if (!selectedFile.value) {
    uploadError.value = 'Bitte wählen Sie eine Datei zum Hochladen aus.'
    return
  }

  const formData = new FormData()
  formData.append('document_type', selectedDocType.value)
  formData.append('file', selectedFile.value)

  isLoading.value = true
  uploadError.value = ''

  try {
    const newDoc = await vehicleApi.uploadVehicleDocument(props.vehicleId, formData)
    selectedFile.value = null
    selectedDocType.value = ''
    await fetchDocuments()

    // refresh vehicle lists in stores so dashboard shows the newly uploaded document
    try {
      const auth = useAuthStore()
      const vehicleStore = useVehicleStore()
      const b2bStore = useB2BVehicleStore()
      if (auth.user?.id) {
        // refresh both stores where applicable
        void vehicleStore.fetchVehicles(auth.user.id)
        void b2bStore.fetchVehicles(auth.user.id)
      }
    } catch (err) {
      // non-fatal if stores not available
      console.warn('Could not refresh vehicle stores after upload', err)
    }

    emit('uploaded', newDoc)
  } catch (err) {
    console.error('Upload fehlgeschlagen:', err)
    uploadError.value = 'Dokument konnte nicht hochgeladen werden.'
  } finally {
    isLoading.value = false
  }
}

async function deleteDocument(documentId: string) {
  if (!props.vehicleId) return

  isLoading.value = true
  uploadError.value = ''

  try {
    await vehicleApi.deleteVehicleDocument(props.vehicleId, documentId)
    documents.value = documents.value.filter((doc) => doc.id !== documentId)

    // refresh vehicle lists in stores so dashboard shows updated state
    try {
      const auth = useAuthStore()
      const vehicleStore = useVehicleStore()
      const b2bStore = useB2BVehicleStore()
      if (auth.user?.id) {
        void vehicleStore.fetchVehicles(auth.user.id)
        void b2bStore.fetchVehicles(auth.user.id)
      }
    } catch (err) {
      console.warn('Could not refresh vehicle stores after delete', err)
    }

    // notify parent components that documents changed
    emit('changed')
  } catch (err) {
    console.error('Löschen fehlgeschlagen:', err)
    uploadError.value = 'Dokument konnte nicht gelöscht werden.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await fetchDocuments()
    }
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="p-0 gap-0 overflow-hidden"
      style="width: 700px; max-width: 700px; border-radius: 5px; border: 1px solid #ECECEC;"
      :show-close-button="false"
    >
      <!-- Header -->
      <div
        class="flex h-[50px] items-center justify-between px-9"
        style="background-color:#FAFAFA; border-bottom: 1px solid #B7C2C2"
      >
        <span class="text-[20px] font-bold" style="color:#10393B">Dokumente hochladen</span>
        <button @click="close" class="transition-opacity hover:opacity-60">
          <Icon icon="mdi:close" class="size-5" style="color:#B7C2C2" />
        </button>
      </div>

      <!-- Description -->
      <p class="px-9 pt-5 text-[16px]" style="color:#000">
        Laden Sie ganz einfach ein neues Dokument hoch – ziehen Sie die Datei dazu auf die Fläche oder wählen Sie sie von Ihrem Rechner aus.
      </p>

      <!-- Body — two columns -->
      <div class="flex gap-8 px-9 pb-8 pt-4">

        <!-- Left: file drop zone -->
        <div class="flex w-[300px] flex-col gap-2">
          <span class="text-[16px] font-bold" style="color:#000">Laden Sie ein neues Dokument hoch</span>

          <!-- Drop area -->
          <div
            class="relative flex h-[130px] w-full cursor-pointer flex-col items-center justify-center rounded-[5px] transition-colors"
            :style="isDragging
              ? 'border: 1px dashed #01B990'
              : 'border: 1px dashed #B7C2C2'"
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
              <Icon icon="mdi:file-check-outline" class="mb-1 size-8" style="color:#01B990" />
              <span class="text-center text-[13px]" style="color:#2E3E3F">{{ selectedFile.name }}</span>
            </template>
            <template v-else>
              <p class="px-4 text-center text-[14px]" style="color:#10393B">
                Datei hierher ziehen oder zum Hochladen durchsuchen
              </p>
              <p class="mt-3 text-[12px] tracking-widest" style="color:#2E3E3F">
                PDF, JPG oder PNG • 8MB max
              </p>
            </template>
          </div>
        </div>

        <!-- Right: upload options and document list -->
        <div class="flex w-[308px] flex-col gap-3">
          <span class="text-[16px] font-bold" style="color:#000">Dokumenttyp wählen</span>

          <div class="relative">
            <div
              class="flex h-[30px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color:#B7C2C2"
              @click="docsOpen = !docsOpen"
            >
              <span class="text-[14px]" :style="selectedDocType ? 'color:#000' : 'color:#B7C2C2'">
                {{ selectedDocType || 'Dokumenttyp wählen' }}
              </span>
              <Icon :icon="docsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="size-4" style="color:#2E3E3F" />
            </div>

            <div v-if="docsOpen" class="absolute top-full z-50 mt-1 w-full rounded-[5px] border bg-white shadow-md" style="border-color:#B7C2C2">
              <div
                v-for="opt in docOptions"
                :key="opt.value"
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                :style="opt.value === 'Sonstiges' ? 'color:#1F2937' : 'color:#000'"
                @click="selectedDocType = opt.value; docsOpen = false"
              >{{ opt.label }}</div>
            </div>
          </div>

          <div class="rounded-[5px] border border-[#D1D5DB] bg-white p-3">
            <p class="mb-2 text-[14px] font-semibold" style="color:#000">Vorhandene Dokumente</p>

            <div v-if="isLoading" class="text-[13px]" style="color:#6B7280">Lade Dokumente...</div>
            <div v-else-if="documents.length === 0" class="text-[13px]" style="color:#6B7280">Keine Dokumente vorhanden.</div>

            <div v-else class="flex flex-col gap-2">
              <div
                v-for="doc in documents"
                :key="doc.id"
                class="flex items-center justify-between rounded-[5px] border px-3 py-2"
                style="border-color:#E5E7EB"
              >
                <div>
                  <p class="text-[14px] font-medium" style="color:#111827">{{ doc.file_name || doc.document_type }}</p>
                  <p class="text-[12px]" style="color:#6B7280">{{ doc.document_type }}</p>
                </div>
                <button
                  type="button"
                  class="text-[13px] font-semibold text-[#EF4444] hover:text-[#B91C1C]"
                  @click="deleteDocument(doc.id)"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>

          <p v-if="uploadError" class="text-[13px] text-[#B91C1C]">{{ uploadError }}</p>

          <button
            class="h-[36px] rounded-[5px] bg-[#01B990] px-4 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            :disabled="isLoading"
            @click="uploadDocument"
          >
            {{ isLoading ? 'Lädt...' : 'Hochladen' }}
          </button>
        </div>
      </div>

      <!-- Footer: Bestätigen button -->
      <div class="flex justify-end px-9 pb-6">
        <button
          class="h-[30px] w-[150px] rounded-[5px] text-[14px] font-bold text-white transition-opacity hover:opacity-90"
          style="background:#EF8450"
          @click="close"
        >
          Bestätigen
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
