<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  open: boolean
  title?: string
  message?: string
  icon?: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  confirmButtonClass?: string
  cancelButtonClass?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  icon: 'material-symbols-light:info-outline',
  confirmText: 'OK',
  cancelText: 'Abbrechen',
  showCancel: false,
  confirmButtonClass:
    'rounded-[5px] px-10 py-2 text-sm font-bold !bg-custom-green text-white cursor-pointer',
  cancelButtonClass:
    'rounded-[5px] px-10 py-2 text-sm font-bold !bg-custom-orange text-white cursor-pointer',
})

const emit = defineEmits<{
  close: []
  confirm: []
  cancel: []
}>()

function handleConfirm(): void {
  emit('confirm')
}

function handleCancel(): void {
  emit('cancel')
  emit('close')
}

function handleClose(): void {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="handleClose"
      >
        <div class="w-full max-w-sm rounded-[5px] bg-[#ECECEC] p-6 text-center shadow-lg">
          <Icon
            v-if="icon"
            :icon="icon"
            class="mx-auto mb-2 text-4xl text-custom-green"
          />

          <h3
            v-if="title"
            class="mb-2 font-bold text-custom-black"
          >
            {{ title }}
          </h3>

          <p
            v-if="message"
            class="mb-5 text-sm text-custom-black"
          >
            {{ message }}
          </p>

          <slot />

          <div class="mt-5 flex justify-center gap-3">
            <button
              v-if="showCancel"
              type="button"
              :class="cancelButtonClass"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              :class="confirmButtonClass"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>