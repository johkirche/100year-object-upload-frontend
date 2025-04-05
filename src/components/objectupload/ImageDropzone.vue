<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean;
  acceptAllFiles?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  acceptAllFiles: false
})

const emit = defineEmits(['files-added'])

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function onDragEnter() {
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  
  if (event.dataTransfer?.files.length) {
    const newFiles = Array.from(event.dataTransfer.files)
    emit('files-added', newFiles)
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    const newFiles = Array.from(input.files)
    emit('files-added', newFiles)
  }
}
</script>

<template>
  <div 
    class="dropzone border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer text-center"
    :class="{ 'border-primary bg-primary/5': isDragging, 'border-gray-300 hover:border-primary': !isDragging }"
    :disabled="props.disabled"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @click="fileInput?.click()"
  >
    <div class="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-600">Ziehen Sie Dateien hier hinein oder klicken Sie zum Auswählen</p>
      <p v-if="props.acceptAllFiles" class="text-gray-500 text-sm mt-1">Alle Dateitypen werden akzeptiert (Bilder, PDFs, Dokumente, etc.)</p>
      <p v-else class="text-gray-500 text-sm mt-1">JPG, PNG oder GIF, max. 10MB pro Bild</p>
    </div>
  </div>
  <input 
    ref="fileInput"
    type="file" 
    :accept="props.acceptAllFiles ? undefined : 'image/*'" 
    multiple
    class="hidden" 
    @change="handleFileChange"
  />
</template>

<style scoped>
.dropzone {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>