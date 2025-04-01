<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { X, File as FileIcon } from 'lucide-vue-next'

import { Checkbox } from '@/components/ui/checkbox/'
import { Progress } from '@/components/ui/progress/'

import { useAuthStore } from '@/stores/auth'
import ImageDropzone from './ImageDropzone.vue'

interface FileItem {
  file: File;
  preview?: string;
  isMain: boolean;
  id?: string;
  uploaded?: boolean;
  progress?: number;
  isImage: boolean;
}

interface Props {
  modelValue: FileItem[];
  error?: string | null;
  isUploading?: boolean;
  disableUploadArea?: boolean;
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'error'])

// Local reference to the files array
const files = ref<FileItem[]>(props.modelValue)
const isUploading = ref(false)

// Get authentication from store
const authStore = useAuthStore()
const client = authStore.getClient()

// Check if a file is an image
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// Handle new files being added
function handleFilesAdded(files: File[]) {
  const newFiles: FileItem[] = files.map(file => {
    const isImage = isImageFile(file)
    return {
      file,
      preview: isImage ? URL.createObjectURL(file) : undefined,
      isMain: false, // Don't set as main by default
      uploaded: false,
      progress: 0,
      isImage
    }
  })
  
  const updatedFiles = [...props.modelValue, ...newFiles]
  
  // Only set the first image as main if there are no files yet
  if (props.modelValue.length === 0 && newFiles.length > 0) {
    // Find the first image file
    const firstImageFile = updatedFiles.find(f => f.isImage)
    if (firstImageFile) {
      firstImageFile.isMain = true
    }
  }
  
  emit('update:modelValue', updatedFiles)
  
  // Clear any previous error when new files are added
  if (props.error && updatedFiles.some(file => file.isMain)) {
    emit('error', null)
  }
}

// Remove a file
function removeFile(index: number) {
  if (index >= 0 && index < props.modelValue.length) {
    const file = props.modelValue[index]
    if (file && file.preview) {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(file.preview)
    }
    
    const wasMain = file?.isMain || false
    const updatedFiles = [...props.modelValue]
    updatedFiles.splice(index, 1)
    
    // If the main file was removed, set the first remaining image as main
    if (wasMain && updatedFiles.length > 0) {
      const firstImage = updatedFiles.find(f => f.isImage)
      if (firstImage) {
        firstImage.isMain = true
      }
    }
    
    emit('update:modelValue', updatedFiles)
  }
}

// Set a file as the main image
function setAsMainFile(index: number) {
  if (index >= 0 && index < props.modelValue.length) {
    const selectedFile = props.modelValue[index]
    
    // Only images can be set as main
    if (!selectedFile || !selectedFile.isImage) {
      emit('error', 'Nur Bilder können als Hauptbild festgelegt werden')
      return
    }
    
    const updatedFiles = [...props.modelValue]
    
    // Set all files to not main
    updatedFiles.forEach(file => {
      if (file) {
        file.isMain = false
      }
    })
    
    // Set the selected image as main
    selectedFile.isMain = true
    updatedFiles[index] = selectedFile
    
    emit('update:modelValue', updatedFiles)
    
    // Clear any previous error when a main image is selected
    if (props.error) {
      emit('error', null)
    }
  }
}

// Get authentication token
async function getAuthToken(): Promise<string> {
  try {
    // @ts-ignore - Assuming the client has a getToken method
    const token = await client.getToken()
    if (typeof token === 'string') {
      return token
    }
    return ''  // Return empty string if no token found
  } catch (e) {
    console.error('Error getting token:', e)
    return ''
  }
}

// Upload a single file with progress tracking
async function uploadSingleFile(fileItem: FileItem, title: string): Promise<string> {
  const file = fileItem.file
  const index = props.modelValue.findIndex(f => f === fileItem)
  
  if (!file || index === -1) {
    throw new Error('Invalid file')
  }
  
  // Create formData for this single file
  const formData = new FormData()
  formData.append('folder', import.meta.env.VITE_FILE_FOLDER)
  formData.append('title', title)
  formData.append('file', file)
  
  // Get the authentication token
  const token = await getAuthToken()
  if (!token) {
    throw new Error('Nicht autorisiert. Bitte melden Sie sich an.')
  }
  
  // Setup XMLHttpRequest to track progress
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        
        // Update progress for this specific file
        const updatedFiles = [...props.modelValue]
        if (updatedFiles[index]) {
          updatedFiles[index].progress = percentComplete
          emit('update:modelValue', updatedFiles)
        }
      }
    })
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          
          // Update the file with uploaded status
          const updatedFiles = [...props.modelValue]
          if (updatedFiles[index]) {
            updatedFiles[index].uploaded = true
            updatedFiles[index].id = response.data.id
            emit('update:modelValue', updatedFiles)
          }
          
          resolve(response.data.id)
        } catch (error) {
          reject(new Error('Error parsing response'))
        }
      } else {
        reject(new Error(`HTTP Error: ${xhr.status}`))
      }
    }
    
    xhr.onerror = function() {
      reject(new Error('Network error'))
    }
    
    const isDev = import.meta.env.DEV
    const DIRECTUS_URL = isDev 
    ? window.location.origin + '/directus/files' 
    : `${import.meta.env.VITE_DIRECTUS_URL}/files`

    xhr.open('POST', DIRECTUS_URL, true)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// Upload all files and return their IDs
async function uploadAllFiles(objectName: string) {
  if (!props.modelValue.length) {
    throw new Error('Bitte fügen Sie mindestens eine Datei hinzu')
  }
  
  const mainImage = props.modelValue.find(file => file.isMain)
  if (!mainImage) {
    throw new Error('Bitte markieren Sie ein Bild als Hauptbild')
  }
  
  try {
    isUploading.value = true
    emit('error', null)
    
    // First upload the main image
    const hauptbildTitle = `Hauptbild: ${objectName}`
    const hauptbildId = await uploadSingleFile(mainImage, hauptbildTitle)
    
    // Then upload any additional files
    const additionalFileIds: string[] = []
    const additionalFiles = props.modelValue.filter(file => !file.isMain)
    
    for (const file of additionalFiles) {
      if (file) {
        const index = additionalFiles.indexOf(file) + 1
        const fileType = file.isImage ? 'Bild' : 'Datei'
        const additionalTitle = `Weiteres ${fileType} ${index}: ${objectName}`
        const fileId = await uploadSingleFile(file, additionalTitle)
        additionalFileIds.push(fileId)
      }
    }
    
    return {
      hauptbildId,
      additionalFileIds
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Fehler beim Hochladen')
  } finally {
    isUploading.value = false
  }
}

// Expose methods to parent
defineExpose({
  uploadAllFiles
})
</script>

<template>
  <div class="file-manager">

    <!-- Upload Area (Hide based on new prop) -->
    <div v-if="!props.disableUploadArea">
      <h2 class="text-lg font-semibold mb-2">Dateien hochladen (mind. 1 Bild erforderlich)</h2>
      <ImageDropzone @files-added="handleFilesAdded" :disabled="isUploading" :acceptAllFiles="true" />
      <p class="mt-2 text-sm text-gray-500">Bitte markieren Sie ein Bild als Hauptbild durch auswählen der Checkbox</p>
    </div>
    
    <!-- Display Error if any -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-6">
      {{ error }}
    </div>
    
    <!-- File Preview Section -->
    <div v-if="modelValue.length > 0" class="mb-6">
      <h3 class="text-md font-medium mb-2">Ausgewählte Dateien:</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="(fileItem, index) in modelValue" :key="index" class="relative border rounded p-2">
          <!-- X icon in top right corner -->
          <button 
            type="button"
            class="absolute -right-2 -top-2 bg-white rounded-full border border-gray-300 p-1 shadow-sm hover:bg-gray-100 hover:text-red-500"
            @click="removeFile(index)"
            :disabled="isUploading"
          >
            <X class="h-4 w-4" />
          </button>
          
          <!-- Display preview for images or file icon for non-images -->
          <div v-if="fileItem.isImage && fileItem.preview" class="h-64 flex items-center justify-center">
            <img :src="fileItem.preview" class="h-full w-full object-cover rounded mb-2" />
          </div>
          <div v-else class="h-64 flex flex-col items-center justify-center bg-gray-50 rounded mb-2 p-3">
            <FileIcon class="h-16 w-16 text-gray-400" />
            <p class="mt-2 text-xs text-gray-600 text-center break-all">{{ fileItem.file.name }}</p>
            <p class="text-xs text-gray-500">{{ Math.round(fileItem.file.size / 1024) }} KB</p>
          </div>
          
          <!-- Upload progress indicator -->
          <div v-if="isUploading && fileItem.progress !== undefined && fileItem.progress < 100" class="mt-2">
            <Progress v-model="fileItem.progress" class="w-full h-2" />
            <p class="text-xs text-gray-500 mt-1">Hochladen: {{ fileItem.progress }}%</p>
          </div>
          
          <!-- Uploaded indicator -->
          <div v-else-if="fileItem.uploaded" class="text-xs text-green-600 mt-1">
            Hochgeladen ✓
          </div>
          
          <!-- Main image checkbox (only enabled for images) -->
          <div class="flex items-center space-x-2 mt-2">
            <Checkbox 
              :id="`main-file-${index}`"
              v-model="fileItem.isMain" 
              @update:checked="() => setAsMainFile(index)"
              :disabled="isUploading || !fileItem.isImage"
            />
            <label :for="`main-file-${index}`" class="text-sm font-medium leading-none" :class="{ 'text-gray-400': !fileItem.isImage }">
              Hauptbild
              <span v-if="!fileItem.isImage" class="text-xs">(nur für Bilder)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles remain unchanged */
</style> 