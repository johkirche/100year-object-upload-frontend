<template>
    <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h3 class="text-lg font-semibold mb-2">Anmerkung</h3>
                <Textarea :model-value="props.object.anmerkung || ''"
                    @blur="(e: Event) => updateAnmerkung(props.object, (e.target as HTMLTextAreaElement).value)"
                    placeholder="Anmerkung hinzufügen..." class="w-full" />
            </div>
            <div>
                <h3 class="text-lg font-semibold mb-2">Bewertung</h3>
                <div class="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3 border-red-500" :class="{
                        'bg-red-500 text-white': props.object.bewertung === 1
                    }" @click="updateBewertung(props.object, 1)">
                        Raus
                    </Button>
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3 border-orange-500" :class="{
                        'bg-orange-500 text-white': props.object.bewertung === 2
                    }" @click="updateBewertung(props.object, 2)">
                        Raus (?)
                    </Button>
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3 border-yellow-500" :class="{
                        'bg-yellow-500 text-white': props.object.bewertung === 6
                    }" @click="updateBewertung(props.object, 6)">
                        Rein, wenn
                    </Button>
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3 border-teal-500" :class="{
                        'bg-teal-500 text-white': props.object.bewertung === 3
                    }" @click="updateBewertung(props.object, 3)">
                        Rein (?)
                    </Button>
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3 border-green-500" :class="{
                        'bg-green-500 text-white': props.object.bewertung === 4
                    }" @click="updateBewertung(props.object, 4)">
                        Rein
                    </Button>
                    <Button variant="outline" size="sm" class="h-auto py-2 px-3" :class="{
                        'bg-gray-300': props.object.bewertung === 7
                    }" @click="updateBewertung(props.object, 7)">
                        Parking
                    </Button>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h3 class="text-lg font-semibold mb-2">Weitere Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-if="props.object.beschreibung" class="space-y-1">
                    <p class="font-medium">Beschreibung:</p>
                    <p>{{ props.object.beschreibung }}</p>
                </div>
                <div v-if="props.object.einreicherName" class="space-y-1">
                    <p class="font-medium">Einreicher:</p>
                    <p>{{ props.object.einreicherName }}</p>
                </div>
                <div v-if="props.object.einreicherGemeinde" class="space-y-1">
                    <p class="font-medium">Gemeinde:</p>
                    <p>{{ props.object.einreicherGemeinde }}</p>
                </div>
                <div v-if="props.object.kontaktRueckfrage" class="space-y-1">
                    <p class="font-medium">Kontakt für Rückfragen:</p>
                    <p>{{ props.object.kontaktRueckfrage }}</p>
                </div>
                <div v-if="props.object.aktuellerStandort" class="space-y-1">
                    <p class="font-medium">Aktueller Standort:</p>
                    <p>{{ props.object.aktuellerStandort }}</p>
                </div>
            </div>
        </div>

        <!-- Files section -->
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-3">Dateien ({{ getAllFilesCount }})</h3>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- Main image -->
                <div v-if="props.object.abbildung" class="group relative">
                    <div
                        class="aspect-square overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center">
                        <img :src="props.getImageThumbnailUrl({ directus_files_id: props.object.abbildung }, 400, 400)"
                            class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"
                            alt="Hauptbild"
                            onerror="this.onerror=null; this.src=''; this.classList.add('flex', 'items-center', 'justify-center'); this.parentNode.innerHTML = '<div class=\'flex items-center justify-center h-full w-full\'><span class=\'text-xs text-gray-400\'>Fehler</span></div>'" />
                    </div>
                    <div class="mt-1 flex items-center justify-between text-sm text-gray-500">
                        <div class="truncate text-xs flex-1 px-1">
                            Hauptbild
                        </div>

                        <div class="flex">
                            <Button variant="ghost" size="sm" class="h-7 w-7 p-0"
                                @click="() => { openImageInDialog({ directus_files_id: props.object.abbildung }) }"
                                title="Bild vergrößern">
                                <span class="sr-only">Vergrößern</span>
                                <Maximize2 class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" class="h-7 w-7 p-0"
                                @click="() => { props.openAssetUrl({ directus_files_id: props.object.abbildung }) }"
                                title="Datei öffnen">
                                <span class="sr-only">Öffnen</span>
                                <ExternalLink class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" class="h-7 w-7 p-0"
                                @click="() => { props.openAssetUrl({ directus_files_id: props.object.abbildung }, true) }"
                                title="Datei herunterladen">
                                <span class="sr-only">Download</span>
                                <Download class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Additional files -->
                <div v-for="(fileData, index) in props.object.weitereAbbildungen"
                    :key="typeof fileData === 'object' && 'id' in fileData ? fileData.id : index"
                    class="group relative">
                    <div
                        class="aspect-square overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center">
                        <!-- Image files -->
                        <img v-if="props.getFileType(fileData) === 'image'" :src="props.getImageThumbnailUrl(fileData)"
                            class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"
                            :alt="props.getFileName(fileData)"
                            onerror="this.onerror=null; this.src=''; this.classList.add('flex', 'items-center', 'justify-center'); this.parentNode.innerHTML = '<div class=\'flex items-center justify-center h-full w-full\'><span class=\'text-xs text-gray-400\'>Fehler</span></div>'" />

                        <!-- PDF files -->
                        <div v-else-if="props.getFileType(fileData) === 'pdf'"
                            class="flex flex-col items-center justify-center text-gray-500">
                            <FileText class="h-10 w-10" />
                            <span class="text-xs mt-2 max-w-full px-2 truncate">PDF</span>
                        </div>

                        <!-- Video files -->
                        <div v-else-if="props.getFileType(fileData) === 'video'"
                            class="flex flex-col items-center justify-center text-gray-500">
                            <Video class="h-10 w-10" />
                            <span class="text-xs mt-2 max-w-full px-2 truncate">Video</span>
                        </div>

                        <!-- Audio files -->
                        <div v-else-if="props.getFileType(fileData) === 'audio'"
                            class="flex flex-col items-center justify-center text-gray-500">
                            <AudioLines class="h-10 w-10" />
                            <span class="text-xs mt-2 max-w-full px-2 truncate">Audio</span>
                        </div>

                        <!-- Document files -->
                        <div v-else-if="props.getFileType(fileData) === 'document'"
                            class="flex flex-col items-center justify-center text-gray-500">
                            <FileText class="h-10 w-10" />
                            <span class="text-xs mt-2 max-w-full px-2 truncate">Dokument</span>
                        </div>

                        <!-- Other files -->
                        <div v-else class="flex flex-col items-center justify-center text-gray-500">
                            <File class="h-10 w-10" />
                            <span class="text-xs mt-2 max-w-full px-2 truncate">Datei</span>
                        </div>
                    </div>

                    <div class="mt-1 flex items-center justify-between text-sm text-gray-500">
                        <!-- File name -->
                        <div class="truncate text-xs flex-1 px-1">
                            {{ props.getFileName(fileData) || `Datei ${index + 1}` }}
                        </div>

                        <!-- Actions -->
                        <div class="flex">
                            <!-- Magnifier button for images -->
                            <Button v-if="props.getFileType(fileData) === 'image'" variant="ghost" size="sm"
                                class="h-7 w-7 p-0" @click="() => { openImageInDialog(fileData) }"
                                title="Bild vergrößern">
                                <span class="sr-only">Vergrößern</span>
                                <Maximize2 class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" class="h-7 w-7 p-0"
                                @click="() => { props.openAssetUrl(fileData) }" title="Datei öffnen">
                                <span class="sr-only">Öffnen</span>
                                <ExternalLink class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" class="h-7 w-7 p-0"
                                @click="() => { props.openAssetUrl(fileData, true) }" title="Datei herunterladen">
                                <span class="sr-only">Download</span>
                                <Download class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image Dialog -->
        <Dialog v-model:open="isDialogOpen">
            <DialogContent class="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                <div class="p-6 h-full overflow-auto">
                    <img v-if="selectedImage" :src="selectedImage"
                        class="max-w-full max-h-[calc(90vh-3rem)] object-contain mx-auto" alt="Vergrößertes Bild" />
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import type { ItemsObjekt } from '@/client/types.gen'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    FileText,
    File,
    Video,
    AudioLines,
    ExternalLink,
    Download,
    Maximize2
} from 'lucide-vue-next'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ref, computed } from 'vue'

const props = defineProps<{
    object: ItemsObjekt,
    getFileType: (fileData: any) => 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other',
    getFileName: (fileData: any) => string,
    getImageThumbnailUrl: (fileData: any, width?: number, height?: number) => string,
    openAssetUrl: (fileData: any, download?: boolean) => void
}>()

const emit = defineEmits<{
    'update-anmerkung': [objekt: ItemsObjekt, value: string],
    'update-bewertung': [objekt: ItemsObjekt, value: number]
}>()

const updateAnmerkung = (objekt: ItemsObjekt, value: string) => {
    emit('update-anmerkung', objekt, value)
}

const updateBewertung = (objekt: ItemsObjekt, value: number) => {
    emit('update-bewertung', objekt, value)
}

// Dialog for image preview
const isDialogOpen = ref(false)
const selectedImage = ref<string | null>(null)

const openImageInDialog = (fileData: any) => {
    // Get full size image URL (without thumbnail resizing)
    // check if directus_files_id is in fileData (and is an object)
    selectedImage.value = props.getImageThumbnailUrl(fileData, 0, 0)

    isDialogOpen.value = true
}

// Count total files (main image + additional images)
const getAllFilesCount = computed(() => {
    let count = 0
    if (props.object.abbildung) count++
    if (props.object.weitereAbbildungen) count += props.object.weitereAbbildungen.length
    return count
})
</script>