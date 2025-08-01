<template>
  <Card
    class="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg group overflow-hidden"
    @click="openDialog"
  >
    <CardContent class="p-0 relative">
      <div class="relative overflow-hidden">
        <img
          :src="imageError ? fallbackThumbnail : thumbnail"
          :alt="title"
          class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          @error="onImageError"
        />
        <div
          class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center"
        >
          <div
            class="bg-white bg-opacity-90 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg"
          >
            <PlayIcon class="h-8 w-8 text-primary ml-1" />
          </div>
        </div>
        <div
          class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded"
        >
          Video
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-lg text-center mb-2">{{ title }}</h3>
        <p v-if="description" class="text-sm text-muted-foreground text-center">
          {{ description }}
        </p>
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="isDialogOpen">
    <DialogContent class="max-w-5xl w-full p-0 bg-black border-0">
      <DialogHeader class="p-6 pb-2">
        <DialogTitle class="text-white text-xl">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" class="text-gray-300">
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <div class="aspect-video px-6 pb-6">
        <div
          v-if="videoError"
          class="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg"
        >
          <div class="text-center text-white">
            <PlayIcon class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p class="text-lg mb-2">Video nicht verfügbar</p>
            <p class="text-sm text-gray-400">{{ errorMessage }}</p>
          </div>
        </div>
        <video
          v-else-if="isDialogOpen"
          ref="videoElement"
          class="w-full h-full rounded-lg"
          controls
          preload="metadata"
          @loadedmetadata="onVideoLoaded"
          @error="onVideoError"
        >
          Ihr Browser unterstützt das Video-Element nicht.
        </video>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onUnmounted } from 'vue'
  import { PlayIcon } from 'lucide-vue-next'
  import { Card, CardContent } from '@/components/ui/card'
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
  } from '@/components/ui/dialog'
  import Hls from 'hls.js'

  interface Props {
    title: string
    description?: string
    thumbnail: string
    videoSrc: string
  }

  const props = defineProps<Props>()

  const isDialogOpen = ref(false)
  const videoElement = ref<HTMLVideoElement>()
  const imageError = ref(false)
  const videoError = ref(false)
  const errorMessage = ref('Das Video konnte nicht geladen werden.')
  let hls: Hls | null = null

  // Check if the video source is an HLS stream
  const isHlsStream = computed(() => {
    return props.videoSrc.includes('.m3u8') || props.videoSrc.includes('hls')
  })

  function openDialog() {
    isDialogOpen.value = true
    videoError.value = false
    errorMessage.value = 'Das Video konnte nicht geladen werden.'
  }

  function initializeVideo() {
    if (!videoElement.value || !isDialogOpen.value) return

    const video = videoElement.value

    if (isHlsStream.value) {
      // Initialize HLS for .m3u8 streams
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        })

        hls.loadSource(props.videoSrc)
        hls.attachMedia(video)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest loaded, found', hls?.levels.length, 'quality levels')
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('HLS error:', data)
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                errorMessage.value = 'Netzwerkfehler beim Laden des Streams.'
                hls?.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                errorMessage.value = 'Medienfehler beim Abspielen des Streams.'
                hls?.recoverMediaError()
                break
              default:
                errorMessage.value = 'Fataler Fehler beim Laden des Streams.'
                destroyHls()
                videoError.value = true
                break
            }
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = props.videoSrc
      } else {
        errorMessage.value = 'HLS wird von Ihrem Browser nicht unterstützt.'
        videoError.value = true
      }
    } else {
      // Regular video file
      video.src = props.videoSrc
    }
  }

  function destroyHls() {
    if (hls) {
      hls.destroy()
      hls = null
    }
  }

  function onVideoLoaded() {
    if (videoElement.value) {
      videoElement.value.focus()
    }
  }

  function onImageError() {
    imageError.value = true
  }

  function onVideoError() {
    console.error('Video error occurred')
    videoError.value = true
    if (!isHlsStream.value) {
      errorMessage.value = 'Das Video konnte nicht geladen werden.'
    }
  }

  // Watch for dialog open state to initialize video
  watch(isDialogOpen, (isOpen) => {
    if (isOpen) {
      // Wait for next tick to ensure video element is in DOM
      setTimeout(initializeVideo, 100)
    } else {
      destroyHls()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    destroyHls()
  })

  // Fallback thumbnail as SVG data URL
  const fallbackThumbnail =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTIwTDI0MCAyMDBMMTYwIDI4MFYxMjBaIiBmaWxsPSIjOTA5RkIxIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNTY1ODVEIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
</script>
