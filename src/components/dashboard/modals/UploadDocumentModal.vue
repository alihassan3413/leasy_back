<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectedFile = ref<File | null>(null)

const docsOpen = ref(false)
const selectedDoc = ref('')
const docOptions = ['Gutachten', 'Vorschäden', 'Leasingvertrag', 'Sonstiges']

function close() { emit('update:open', false) }

function openFilePicker() { fileInput.value?.click() }

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  selectedFile.value = e.dataTransfer?.files?.[0] ?? null
}
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

        <!-- Right: uploaded documents dropdown -->
        <div class="flex w-[308px] flex-col gap-2">
          <span class="text-[16px] font-bold" style="color:#000">Hochgeladene Dokumente</span>

          <div class="relative">
            <div
              class="flex h-[30px] cursor-pointer items-center justify-between rounded-[5px] border px-2"
              style="border-color:#B7C2C2"
              @click="docsOpen = !docsOpen"
            >
              <span class="text-[14px]" :style="selectedDoc ? 'color:#000' : 'color:#B7C2C2'">
                {{ selectedDoc || 'Dokument wählen' }}
              </span>
              <Icon :icon="docsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" class="size-4" style="color:#2E3E3F" />
            </div>

            <!-- Dropdown list -->
            <div v-if="docsOpen" class="absolute top-full z-50 mt-1 w-full rounded-[5px] border bg-white shadow-md" style="border-color:#B7C2C2">
              <div
                v-for="opt in docOptions"
                :key="opt"
                class="flex h-[30px] cursor-pointer items-center px-2 text-[14px] hover:bg-gray-50"
                :style="opt === 'Sonstiges' ? 'color:#B7C2C2' : 'color:#000'"
                @click="selectedDoc = opt; docsOpen = false"
              >{{ opt }}</div>
            </div>
          </div>
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
