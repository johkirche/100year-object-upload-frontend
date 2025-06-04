<template>
  <div class="flex items-center justify-center min-h-screen">
    <LogoComponent />
    <div class="max-w-4xl w-full px-2 md:px-6 py-8">
      <template v-if="currentStep === 'type-selection'">
        <div v-if="isLoading" class="flex justify-center mb-4">
          <div class="flex items-center">
            <div
              class="animate-spin h-5 w-5 mr-3 border-2 border-primary rounded-full border-t-transparent"
            ></div>
            <p>Lade Informationen...</p>
          </div>
        </div>

        <div v-else-if="error" class="mb-4">
          <Alert variant="destructive">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
              Die aktuellen Informationen konnten nicht geladen werden. Bitte versuchen Sie es
              später erneut.
            </AlertDescription>
          </Alert>
        </div>

        <div v-else-if="statistics" class="mb-8 text-center">
          <h1 class="text-3xl font-bold mb-2">Willkommen zum 100-Jahre-Objekt-Upload</h1>
          <p class="text-lg my-text-muted-foreground">
            Bisher wurden <span class="font-medium">{{ statistics.objectCount }}</span> Objekte
            hochgeladen und <span class="font-medium">{{ statistics.wishCount }}</span> Wünsche
            geäußert.
          </p>
        </div>
      </template>

      <ObjektUploadForm class="mb-20" v-model="currentStep" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import ObjektUploadForm from '@/components/objectupload/ObjektUploadForm.vue'
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
  import LogoComponent from '@/components/LogoComponent.vue'
  type FormStep = 'type-selection' | 'object-info' | 'submitter-info'

  interface Statistics {
    wishCount: number
    objectCount: number
  }

  const { DIRECTUS_URL } = useAuthStore()

  const statistics = ref<Statistics | null>(null)
  const isLoading = ref(true)
  const currentStep = ref<FormStep>('type-selection')
  const error = ref(false)

  async function fetchStatistics() {
    isLoading.value = true
    error.value = false

    try {
      const response = await fetch(
        `${DIRECTUS_URL}/flows/trigger/12a60dff-bebc-4298-8a52-fe749f1e4999`
      )
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      statistics.value = await response.json()
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
      error.value = true
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchStatistics()
  })
</script>
