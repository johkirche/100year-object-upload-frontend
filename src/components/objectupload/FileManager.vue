<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { X, File as FileIcon } from 'lucide-vue-next'

import { Checkbox } from '@/components/ui/checkbox/'
import { Progress } from '@/components/ui/progress/'
import { Alert, AlertTitle } from '@/components/ui/alert'

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
  error?: string;
}

interface Props {
  modelValue: FileItem[];
  error?: string | null;
  isUploading?: boolean;
  disableUploadArea?: boolean;
  maxFileSize?: number; // in bytes
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 10 * 1024 * 1024 // 10MB default
})
const emit = defineEmits(['update:modelValue', 'error'])

// Local reference to the files array
const isUploading = ref(false)
const fileSizeError = ref<string | null>(null)

// Get authentication from store
const { getAuthToken } = useAuthStore()

// Clear file size error
function clearFileSizeError() {
  fileSizeError.value = null
}

// Check if a file is an image
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

// Format file size to human readable format
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Check if file is within size limit
function isFileSizeValid(file: File): boolean {
  return file.size <= props.maxFileSize
}

// Handle new files being added
function handleFilesAdded(files: File[]) {
  // Reset previous file size errors
  fileSizeError.value = null
  
  // Filter out files that exceed the size limit
  const oversizedFiles = files.filter(file => !isFileSizeValid(file))
  const validFiles = files.filter(file => isFileSizeValid(file))
  
  // Display error for oversized files
  if (oversizedFiles.length > 0) {
    const fileNames = oversizedFiles.map(f => `"${f.name}" (${formatFileSize(f.size)})`).join(', ')
    fileSizeError.value = `Folgende Dateien überschreiten das Limit von ${formatFileSize(props.maxFileSize)}: ${fileNames}`
  }
  
  // Only process valid files
  const newFiles: FileItem[] = validFiles.map(file => {
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

  // Maximum number of retry attempts
  const MAX_RETRIES = 3
  // Base delay for exponential backoff (in ms)
  const BASE_DELAY = 1000
  
  // Setup retry logic with exponential backoff
  return new Promise<string>((resolve, reject) => {
    let attempt = 0
    
    function attemptUpload() {
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
            handleError('Error parsing response')
          }
        } else {
          handleError(`HTTP Error: ${xhr.status}`)
        }
      }
      
      xhr.onerror = function() {
        handleError('Network error')
      }

      xhr.ontimeout = function() {
        handleError('Connection timed out')
      }
      
      xhr.onabort = function() {
        handleError('Upload aborted')
      }

      function handleError(errorMsg: string) {
        console.warn(`Upload attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errorMsg}`)
        
        if (attempt < MAX_RETRIES - 1) {
          attempt++
          // Exponential backoff: delay increases with each retry
          const delay = BASE_DELAY * Math.pow(2, attempt - 1)
          console.log(`Retrying upload in ${delay}ms...`)
          
          // Update UI to show retry status
          const updatedFiles = [...props.modelValue]
          if (updatedFiles[index]) {
            updatedFiles[index].progress = 0
            emit('update:modelValue', updatedFiles)
          }
          
          setTimeout(attemptUpload, delay)
        } else {
          reject(new Error(`Fehler beim Hochladen nach ${MAX_RETRIES} Versuchen: ${errorMsg}`))
        }
      }
      
      const isDev = import.meta.env.DEV
      const DIRECTUS_URL = isDev 
        ? window.location.origin + '/directus/files' 
        : `${import.meta.env.VITE_DIRECTUS_URL}/files`

      xhr.open('POST', DIRECTUS_URL, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      
      // Set longer timeout to prevent premature timeouts
      xhr.timeout = 60000 // 60 seconds
      
      try {
        xhr.send(formData)
      } catch (e: unknown) {
        handleError(`Error sending request: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    
    // Start the first upload attempt
    attemptUpload()
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
    
    let hauptbildId = ''
    let additionalFileIds: string[] = []
    
    // First upload the main image with better error handling
    try {
      const hauptbildTitle = `Hauptbild: ${objectName}`
      hauptbildId = await uploadSingleFile(mainImage, hauptbildTitle)
    } catch (error: unknown) {
      console.error('Error uploading main image:', error)
      throw new Error(`Hauptbild konnte nicht hochgeladen werden: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Then upload any additional files with better error handling
    const additionalFiles = props.modelValue.filter(file => !file.isMain)
    
    // Use Promise.allSettled to continue even if some files fail
    const uploadPromises = additionalFiles.map(async (file, i) => {
      if (file) {
        try {
          const index = i + 1
          const fileType = file.isImage ? 'Bild' : 'Datei'
          const additionalTitle = `Weiteres ${fileType} ${index}: ${objectName}`
          return await uploadSingleFile(file, additionalTitle)
        } catch (error: unknown) {
          console.error(`Error uploading additional file ${i+1}:`, error)
          throw error
        }
      }
      return null
    })
    
    const results = await Promise.allSettled(uploadPromises)
    
    // Filter out successful uploads
    additionalFileIds = results
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)
    
    // Warn about failed uploads
    const failedUploads = results.filter(result => result.status === 'rejected')
    if (failedUploads.length > 0) {
      console.warn(`${failedUploads.length} additional files failed to upload`)
    }
    
    return {
      hauptbildId,
      additionalFileIds
    }
  } catch (error: unknown) {
    console.error('Upload error:', error)
    throw new Error(error instanceof Error ? error.message : 'Fehler beim Hochladen')
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
      <p class="mt-2 text-sm text-gray-500">
        Bitte markieren Sie ein Bild als Hauptbild durch auswählen der Checkbox.
        Maximale Dateigröße: {{ formatFileSize(props.maxFileSize) }}
      </p>
    </div>
    
    <!-- File Size Error Alert -->
    <Alert v-if="fileSizeError" variant="destructive" class="mt-4 relative">
      <button 
        type="button"
        class="absolute right-2 top-2 p-1 rounded-full hover:border-red-500"
        @click="clearFileSizeError"
        aria-label="Dismiss"
      >
        <X class="h-4 w-4" />
      </button>
      <AlertTitle>{{ fileSizeError }}</AlertTitle>
    </Alert>
    
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