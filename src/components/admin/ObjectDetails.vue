<template>
    <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold">Anmerkung</h3>
                    <span
                        v-if="anmerkung.state.value !== 'idle'"
                        class="flex items-center gap-1 text-xs text-muted-foreground"
                    >
                        <Loader2
                            v-if="
                                anmerkung.state.value === 'pending' ||
                                anmerkung.state.value === 'saving'
                            "
                            class="h-3 w-3 animate-spin"
                        />
                        <Check v-else class="h-3 w-3 text-success" />
                        {{
                            anmerkung.state.value === 'saving'
                                ? 'Speichern…'
                                : anmerkung.state.value === 'pending'
                                  ? 'Warte…'
                                  : 'Gespeichert'
                        }}
                    </span>
                </div>
                <Textarea
                    v-model="anmerkung.value.value"
                    placeholder="Anmerkung hinzufügen..."
                    class="w-full min-h-36"
                />
            </div>
            <div>
                <h3 class="text-lg font-semibold mb-2">Bewertung</h3>
                <div class="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3 border-red-500"
                        :class="{ 'bg-red-500 text-white': props.object.bewertung === 1 }"
                        @click="updateBewertung(props.object, 1, 'Raus')"
                        >Raus</Button
                    >
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3 border-orange-500"
                        :class="{ 'bg-orange-500 text-white': props.object.bewertung === 2 }"
                        @click="updateBewertung(props.object, 2, 'Raus (?)')"
                        >Raus (?)</Button
                    >
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3 border-yellow-500"
                        :class="{ 'bg-yellow-500 text-white': props.object.bewertung === 6 }"
                        @click="updateBewertung(props.object, 6, 'Rein, wenn ...')"
                        >Rein, wenn</Button
                    >
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3 border-teal-500"
                        :class="{ 'bg-teal-500 text-white': props.object.bewertung === 3 }"
                        @click="updateBewertung(props.object, 3, 'Rein (?)')"
                        >Rein (?)</Button
                    >
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3 border-green-500"
                        :class="{ 'bg-green-500 text-white': props.object.bewertung === 4 }"
                        @click="updateBewertung(props.object, 4, 'Rein')"
                        >Rein</Button
                    >
                    <Button
                        variant="outline"
                        size="sm"
                        class="h-auto py-2 px-3"
                        :class="{ 'bg-gray-300': props.object.bewertung === 7 }"
                        @click="updateBewertung(props.object, 7, 'Parking')"
                        >Parking</Button
                    >
                    <div class="flex-grow"></div>
                    <Button
                        variant="destructive"
                        size="sm"
                        class="flex items-center gap-1"
                        @click="confirmDelete"
                    >
                        <Trash2 class="h-4 w-4" />
                        <span>löschen</span>
                    </Button>
                </div>
            </div>
        </div>

        <!-- Weitere Details -->
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
                <div v-if="props.object.anmerkungEinreicher" class="space-y-1">
                    <p class="font-medium">Anmerkung des Einreichers:</p>
                    <p>{{ props.object.anmerkungEinreicher }}</p>
                </div>
                <div class="space-y-1">
                    <p class="font-medium">Kategorien:</p>
                    <HierarchicalMultiSelect
                        :options="categoryOptions"
                        v-model="selectedCategories"
                        placeholder="Kategorie(n) auswählen ..."
                    />
                </div>
            </div>
        </div>

        <!-- Ausstellung – Umsetzung -->
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-3">Ausstellung – Umsetzung</h3>
            <div class="space-y-4">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <p class="font-medium">Infotext</p>
                        <span
                            v-if="infotextAusstellung.state.value !== 'idle'"
                            class="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                            <Loader2
                                v-if="
                                    infotextAusstellung.state.value === 'pending' ||
                                    infotextAusstellung.state.value === 'saving'
                                "
                                class="h-3 w-3 animate-spin"
                            />
                            <Check v-else class="h-3 w-3 text-success" />
                            {{
                                infotextAusstellung.state.value === 'saving'
                                    ? 'Speichern…'
                                    : infotextAusstellung.state.value === 'pending'
                                      ? 'Warte…'
                                      : 'Gespeichert'
                            }}
                        </span>
                    </div>
                    <Textarea
                        v-model="infotextAusstellung.value.value"
                        placeholder="Platz für alle Anmerkungen/Notizen"
                        class="w-full"
                    />
                </div>
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <p class="font-medium">Label</p>
                        <span
                            v-if="labelAusstellung.state.value !== 'idle'"
                            class="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                            <Loader2
                                v-if="
                                    labelAusstellung.state.value === 'pending' ||
                                    labelAusstellung.state.value === 'saving'
                                "
                                class="h-3 w-3 animate-spin"
                            />
                            <Check v-else class="h-3 w-3 text-success" />
                            {{
                                labelAusstellung.state.value === 'saving'
                                    ? 'Speichern…'
                                    : labelAusstellung.state.value === 'pending'
                                      ? 'Warte…'
                                      : 'Gespeichert'
                            }}
                        </span>
                    </div>
                    <Textarea
                        v-model="labelAusstellung.value.value"
                        placeholder="Label für die Ausstellung"
                        class="w-full"
                    />
                </div>
                <div>
                    <p class="font-medium mb-2">Umsetzungsideen</p>
                    <div
                        v-if="
                            props.object.umsetzungsideen && props.object.umsetzungsideen.length > 0
                        "
                        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-3"
                    >
                        <div
                            v-for="(fileData, index) in props.object.umsetzungsideen"
                            :key="
                                typeof fileData === 'object' && 'id' in fileData
                                    ? fileData.id
                                    : index
                            "
                            class="group relative"
                        >
                            <div
                                class="aspect-square overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center"
                                :class="{
                                    'cursor-pointer': props.getFileType(fileData) === 'image'
                                }"
                                @click="
                                    props.getFileType(fileData) === 'image' &&
                                    openImageInDialog(fileData, 'umsetzungsideen')
                                "
                            >
                                <img
                                    v-if="props.getFileType(fileData) === 'image'"
                                    :src="props.getImageThumbnailUrl(fileData)"
                                    class="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                    :alt="props.getFileName(fileData)"
                                    onerror="
                                        this.onerror = null
                                        this.src = ''
                                        this.parentNode.innerHTML =
                                            '<div class=\'flex items-center justify-center h-full w-full\'><span class=\'text-xs text-gray-400\'>Fehler</span></div>'
                                    "
                                />
                                <div
                                    v-else-if="props.getFileType(fileData) === 'pdf'"
                                    class="flex flex-col items-center justify-center text-gray-500"
                                >
                                    <FileText class="h-10 w-10" /><span class="text-xs mt-2"
                                        >PDF</span
                                    >
                                </div>
                                <div
                                    v-else-if="props.getFileType(fileData) === 'video'"
                                    class="flex flex-col items-center justify-center text-gray-500"
                                >
                                    <Video class="h-10 w-10" /><span class="text-xs mt-2"
                                        >Video</span
                                    >
                                </div>
                                <div
                                    v-else-if="props.getFileType(fileData) === 'audio'"
                                    class="flex flex-col items-center justify-center text-gray-500"
                                >
                                    <AudioLines class="h-10 w-10" /><span class="text-xs mt-2"
                                        >Audio</span
                                    >
                                </div>
                                <div
                                    v-else
                                    class="flex flex-col items-center justify-center text-gray-500"
                                >
                                    <File class="h-10 w-10" /><span class="text-xs mt-2"
                                        >Datei</span
                                    >
                                </div>
                            </div>
                            <div
                                class="mt-1 flex items-center justify-between text-sm text-gray-500"
                            >
                                <div class="truncate text-xs flex-1 px-1">
                                    {{ props.getFileName(fileData) || `Datei ${index + 1}` }}
                                </div>
                                <div
                                    class="flex opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="h-7 w-7 p-0"
                                        title="Datei öffnen"
                                        @click="props.openAssetUrl(fileData)"
                                    >
                                        <span class="sr-only">Öffnen</span>
                                        <ExternalLink class="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="h-7 w-7 p-0"
                                        title="Datei entfernen"
                                        @click="confirmDeleteFile('umsetzungsideen', fileData)"
                                    >
                                        <span class="sr-only">Entfernen</span>
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <input
                            ref="umsetzungsideenInput"
                            type="file"
                            multiple
                            class="hidden"
                            @change="(e) => uploadFiles('umsetzungsideen', e)"
                        />
                        <Button
                            variant="default"
                            size="sm"
                            :disabled="isUploading"
                            @click="umsetzungsideenInput?.click()"
                        >
                            <Loader2
                                v-if="isUploading === 'umsetzungsideen'"
                                class="mr-2 h-4 w-4 animate-spin"
                            />
                            Datei hochladen
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Files / Weitere Abbildungen -->
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-3">Dateien ({{ getAllFilesCount }})</h3>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <!-- Main image -->
                <div v-if="props.object.abbildung" class="group relative">
                    <div
                        class="aspect-square overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center cursor-pointer"
                        @click="openImageInDialog({ directus_files_id: props.object.abbildung })"
                    >
                        <img
                            :src="
                                props.getImageThumbnailUrl(
                                    { directus_files_id: props.object.abbildung },
                                    400,
                                    400
                                )
                            "
                            class="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                            alt="Hauptbild"
                            onerror="
                                this.onerror = null
                                this.src = ''
                                this.classList.add('flex', 'items-center', 'justify-center')
                                this.parentNode.innerHTML =
                                    '<div class=\'flex items-center justify-center h-full w-full\'><span class=\'text-xs text-gray-400\'>Fehler</span></div>'
                            "
                        />
                    </div>
                    <div class="mt-1 flex items-center justify-between text-sm text-gray-500">
                        <div class="truncate text-xs flex-1 px-1">Hauptbild</div>
                        <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 w-7 p-0"
                                title="Datei öffnen"
                                @click="
                                    props.openAssetUrl({
                                        directus_files_id: props.object.abbildung
                                    })
                                "
                            >
                                <span class="sr-only">Öffnen</span>
                                <ExternalLink class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 w-7 p-0"
                                title="Datei herunterladen"
                                @click="
                                    props.openAssetUrl(
                                        { directus_files_id: props.object.abbildung },
                                        true
                                    )
                                "
                            >
                                <span class="sr-only">Download</span>
                                <Download class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Additional files -->
                <div
                    v-for="(fileData, index) in props.object.weitereAbbildungen"
                    :key="typeof fileData === 'object' && 'id' in fileData ? fileData.id : index"
                    class="group relative"
                >
                    <div
                        class="aspect-square overflow-hidden rounded-md border bg-gray-50 flex items-center justify-center"
                        :class="{ 'cursor-pointer': props.getFileType(fileData) === 'image' }"
                        @click="
                            props.getFileType(fileData) === 'image' &&
                            openImageInDialog(fileData, 'weitereAbbildungen')
                        "
                    >
                        <img
                            v-if="props.getFileType(fileData) === 'image'"
                            :src="props.getImageThumbnailUrl(fileData)"
                            class="h-full w-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                            :alt="props.getFileName(fileData)"
                            onerror="
                                this.onerror = null
                                this.src = ''
                                this.classList.add('flex', 'items-center', 'justify-center')
                                this.parentNode.innerHTML =
                                    '<div class=\'flex items-center justify-center h-full w-full\'><span class=\'text-xs text-gray-400\'>Fehler</span></div>'
                            "
                        />
                        <div
                            v-else-if="props.getFileType(fileData) === 'pdf'"
                            class="flex flex-col items-center justify-center text-gray-500"
                        >
                            <FileText class="h-10 w-10" /><span
                                class="text-xs mt-2 max-w-full px-2 truncate"
                                >PDF</span
                            >
                        </div>
                        <div
                            v-else-if="props.getFileType(fileData) === 'video'"
                            class="flex flex-col items-center justify-center text-gray-500"
                        >
                            <Video class="h-10 w-10" /><span
                                class="text-xs mt-2 max-w-full px-2 truncate"
                                >Video</span
                            >
                        </div>
                        <div
                            v-else-if="props.getFileType(fileData) === 'audio'"
                            class="flex flex-col items-center justify-center text-gray-500"
                        >
                            <AudioLines class="h-10 w-10" /><span
                                class="text-xs mt-2 max-w-full px-2 truncate"
                                >Audio</span
                            >
                        </div>
                        <div
                            v-else-if="props.getFileType(fileData) === 'document'"
                            class="flex flex-col items-center justify-center text-gray-500"
                        >
                            <FileText class="h-10 w-10" /><span
                                class="text-xs mt-2 max-w-full px-2 truncate"
                                >Dokument</span
                            >
                        </div>
                        <div v-else class="flex flex-col items-center justify-center text-gray-500">
                            <File class="h-10 w-10" /><span
                                class="text-xs mt-2 max-w-full px-2 truncate"
                                >Datei</span
                            >
                        </div>
                    </div>
                    <div class="mt-1 flex items-center justify-between text-sm text-gray-500">
                        <div class="truncate text-xs flex-1 px-1">
                            {{ props.getFileName(fileData) || `Datei ${index + 1}` }}
                        </div>
                        <div class="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 w-7 p-0"
                                title="Datei öffnen"
                                @click="props.openAssetUrl(fileData)"
                            >
                                <span class="sr-only">Öffnen</span>
                                <ExternalLink class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 w-7 p-0"
                                title="Datei herunterladen"
                                @click="props.openAssetUrl(fileData, true)"
                            >
                                <span class="sr-only">Download</span>
                                <Download class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-7 w-7 p-0"
                                title="Datei entfernen"
                                @click="confirmDeleteFile('weitereAbbildungen', fileData)"
                            >
                                <span class="sr-only">Entfernen</span>
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upload button for weitereAbbildungen -->
            <div class="mt-3">
                <input
                    ref="weitereAbbildungenInput"
                    type="file"
                    multiple
                    class="hidden"
                    @change="(e) => uploadFiles('weitereAbbildungen', e)"
                />
                <Button
                    variant="default"
                    size="sm"
                    :disabled="isUploading === 'weitereAbbildungen'"
                    @click="weitereAbbildungenInput?.click()"
                >
                    <Loader2
                        v-if="isUploading === 'weitereAbbildungen'"
                        class="mr-2 h-4 w-4 animate-spin"
                    />
                    Datei hinzufügen
                </Button>
            </div>
        </div>

        <!-- Image Dialog -->
        <Dialog v-model:open="isDialogOpen">
            <DialogContent class="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <div class="flex-1 overflow-auto p-4">
                    <img
                        v-if="selectedImage"
                        :src="selectedImage"
                        class="w-full max-h-[75vh] object-contain mx-auto"
                        alt="Vergrößertes Bild"
                    />
                </div>
                <div class="flex items-center justify-between gap-2 px-4 py-3 border-t bg-background">
                    <div class="flex gap-2">
                        <Button
                            variant="outline"
                            class="flex items-center gap-2"
                            @click="props.openAssetUrl(selectedImageFileData)"
                        >
                            <ExternalLink class="h-4 w-4" />
                            <span>Öffnen</span>
                        </Button>
                        <Button
                            variant="outline"
                            class="flex items-center gap-2"
                            @click="props.openAssetUrl(selectedImageFileData, true)"
                        >
                            <Download class="h-4 w-4" />
                            <span>Herunterladen</span>
                        </Button>
                    </div>
                    <Button
                        v-if="selectedImageField"
                        variant="destructive"
                        class="flex items-center gap-2"
                        @click="confirmDeleteFromDialog"
                    >
                        <Trash2 class="h-4 w-4" />
                        <span>Löschen</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <!-- Delete image from dialog confirmation -->
        <Dialog v-model:open="isDeleteImageConfirmOpen">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bild löschen</DialogTitle>
                    <DialogDescription>
                        Sind Sie sicher, dass Sie dieses Bild löschen möchten? Diese Aktion kann
                        nicht rückgängig gemacht werden.
                    </DialogDescription>
                </DialogHeader>
                <div class="flex justify-end gap-2">
                    <Button variant="outline" @click="isDeleteImageConfirmOpen = false"
                        >Abbrechen</Button
                    >
                    <Button variant="destructive" @click="deleteFromDialog">Löschen</Button>
                </div>
            </DialogContent>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:open="isDeleteDialogOpen">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Objekt löschen</DialogTitle>
                    <DialogDescription>
                        Sind Sie sicher, dass Sie das Objekt "{{ props.object.name }}" löschen
                        möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                        <p class="mt-2 text-destructive font-medium">
                            Achtung: Alle zugehörigen Dateien und Bilder werden ebenfalls dauerhaft
                            gelöscht!
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <div class="flex justify-end gap-2">
                    <Button variant="outline" @click="isDeleteDialogOpen = false">Abbrechen</Button>
                    <Button variant="destructive" :disabled="isDeleting" @click="deleteObject">
                        <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
                        Löschen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from 'vue'
    import {
        FileText,
        File,
        Video,
        AudioLines,
        ExternalLink,
        Download,
        Trash2,
        Loader2,
        Check
    } from 'lucide-vue-next'
    import type { ItemsObjekt } from '@/client/types.gen'
    import { updateItem, readItem, deleteFile as deleteDirectusFile } from '@directus/sdk'

    import { useObjects } from '@/composables/useObjects'
    import { useAuthStore } from '@/stores/auth'

    import { Button } from '@/components/ui/button'
    import { Textarea } from '@/components/ui/textarea'
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription
    } from '@/components/ui/dialog'

    import HierarchicalMultiSelect from '@/components/objectupload/HierarchicalMultiSelect.vue'

    const props = defineProps<{
        object: ItemsObjekt
        getFileType: (fileData: any) => 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other'
        getFileName: (fileData: any) => string
        getImageThumbnailUrl: (fileData: any, width?: number, height?: number) => string
        openAssetUrl: (fileData: any, download?: boolean) => void
    }>()

    const emit = defineEmits<{
        'update-bewertung': [objekt: ItemsObjekt, value: number, label: string]
        'update-categories': [objekt: ItemsObjekt, categories: string[]]
        'delete-object': [objekt: ItemsObjekt]
    }>()

    const { getFieldOptions, buildCategoryLookup, updateObjectField } = useObjects()

    // ── Debounced text field saver ────────────────────────────────────────────
    type SaveState = 'idle' | 'pending' | 'saving' | 'saved'

    function createFieldSaver(fieldName: string, initialValue: string) {
        const value = ref(initialValue)
        const state = ref<SaveState>('idle')
        let debounceTimer: ReturnType<typeof setTimeout> | null = null
        let savedTimer: ReturnType<typeof setTimeout> | null = null

        watch(value, (v) => {
            state.value = 'pending'
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(async () => {
                if (!props.object.id) return
                state.value = 'saving'
                const success = await updateObjectField(props.object.id, fieldName, v)
                if (success) {
                    state.value = 'saved'
                    if (savedTimer) clearTimeout(savedTimer)
                    savedTimer = setTimeout(() => {
                        state.value = 'idle'
                    }, 2000)
                } else {
                    state.value = 'idle'
                }
            }, 1500)
        })

        return { value, state }
    }

    const anmerkung = createFieldSaver('anmerkung', props.object.anmerkung || '')
    const labelAusstellung = createFieldSaver(
        'label_ausstellung',
        props.object.label_ausstellung || ''
    )
    const infotextAusstellung = createFieldSaver(
        'infotext_ausstellung',
        props.object.infotext_ausstellung || ''
    )

    // ── Delete object ────────────────────────────────────────────────────────
    const isDeleteDialogOpen = ref(false)
    const isDeleting = ref(false)

    const confirmDelete = () => {
        isDeleteDialogOpen.value = true
    }

    const deleteObject = async () => {
        isDeleting.value = true
        try {
            emit('delete-object', props.object)
            isDeleteDialogOpen.value = false
        } finally {
            isDeleting.value = false
        }
    }

    const updateBewertung = (objekt: ItemsObjekt, value: number, label: string) =>
        emit('update-bewertung', objekt, value, label)

    // ── Image preview dialog ─────────────────────────────────────────────────
    const isDialogOpen = ref(false)
    const selectedImage = ref<string | null>(null)
    const selectedImageFileData = ref<any>(null)
    const selectedImageField = ref<'weitereAbbildungen' | 'umsetzungsideen' | null>(null)
    const isDeleteImageConfirmOpen = ref(false)

    const openImageInDialog = (fileData: any, field?: 'weitereAbbildungen' | 'umsetzungsideen') => {
        selectedImage.value = props.getImageThumbnailUrl(fileData, 0, 0)
        selectedImageFileData.value = fileData
        selectedImageField.value = field ?? null
        isDialogOpen.value = true
    }

    const confirmDeleteFromDialog = () => {
        isDeleteImageConfirmOpen.value = true
    }

    const confirmDeleteFile = (field: 'weitereAbbildungen' | 'umsetzungsideen', fileData: any) => {
        selectedImageField.value = field
        selectedImageFileData.value = fileData
        isDeleteImageConfirmOpen.value = true
    }

    const deleteFromDialog = async () => {
        if (selectedImageField.value && selectedImageFileData.value) {
            await deleteFile(selectedImageField.value, selectedImageFileData.value)
        }
        isDeleteImageConfirmOpen.value = false
        isDialogOpen.value = false
    }

    // ── File count ───────────────────────────────────────────────────────────
    const getAllFilesCount = computed(() => {
        let count = 0
        if (props.object.abbildung) count++
        if (props.object.weitereAbbildungen) count += props.object.weitereAbbildungen.length
        return count
    })

    // ── Categories ───────────────────────────────────────────────────────────
    const categoryOptions = ref<any[]>([])
    const categoryLookup = ref<Record<string, string>>({})

    const selectedCategories = ref<string[]>(
        Array.isArray(props.object.kategorie) ? props.object.kategorie : []
    )

    let categoryDebounceTimer: ReturnType<typeof setTimeout> | null = null
    watch(
        selectedCategories,
        (newCategories) => {
            if (categoryDebounceTimer) clearTimeout(categoryDebounceTimer)
            categoryDebounceTimer = setTimeout(() => {
                emit('update-categories', props.object, newCategories)
            }, 500)
        },
        { deep: true }
    )

    onMounted(async () => {
        try {
            const kategorieResult = await getFieldOptions('kategorie')
            if (!kategorieResult.error) {
                categoryOptions.value = kategorieResult.options
                categoryLookup.value = buildCategoryLookup(categoryOptions.value)
            }
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    })

    // ── File upload / delete (shared for weitereAbbildungen & umsetzungsideen) ──
    const authStore = useAuthStore()
    const directus = authStore.getClient()

    const weitereAbbildungenInput = ref<HTMLInputElement | null>(null)
    const umsetzungsideenInput = ref<HTMLInputElement | null>(null)
    const isUploading = ref<'weitereAbbildungen' | 'umsetzungsideen' | false>(false)

    const getDirectusUrl = () => {
        const isDev = import.meta.env.DEV
        return isDev ? window.location.origin + '/directus' : import.meta.env.VITE_DIRECTUS_URL
    }

    async function uploadFiles(field: 'weitereAbbildungen' | 'umsetzungsideen', event: Event) {
        const input = event.target as HTMLInputElement
        if (!input.files || input.files.length === 0 || !props.object.id) return

        isUploading.value = field
        try {
            const token = await authStore.getAuthToken()
            if (!token) throw new Error('Nicht autorisiert')

            for (const file of Array.from(input.files)) {
                const formData = new FormData()
                formData.append('folder', import.meta.env.VITE_FILE_FOLDER)
                formData.append(
                    'title',
                    `${field === 'weitereAbbildungen' ? 'Weitere Abbildung' : 'Umsetzungsidee'}: ${props.object.name || ''}`
                )
                formData.append('file', file)

                const response = await fetch(`${getDirectusUrl()}/files`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                })
                if (!response.ok) throw new Error(`Upload fehlgeschlagen: ${response.status}`)

                const { data } = await response.json()

                await directus.request(
                    updateItem('objekt', props.object.id!, {
                        [field]: {
                            create: [{ directus_files_id: data.id }],
                            update: [],
                            delete: []
                        }
                    } as any)
                )

                // Re-fetch the junction list so local state has real junction IDs
                const updated = await directus.request(
                    readItem('objekt', props.object.id!, {
                        fields: [{ [field]: ['id', { directus_files_id: ['id', 'filename_download', 'type'] }] }] as any
                    })
                )
                ;(props.object as any)[field] = (updated as any)[field]
            }
        } catch (err) {
            console.error(`Fehler beim Hochladen (${field}):`, err)
        } finally {
            isUploading.value = false
            input.value = ''
        }
    }

    async function deleteFile(field: 'weitereAbbildungen' | 'umsetzungsideen', fileData: any) {
        if (!props.object.id) return
        const junctionId = typeof fileData === 'object' ? fileData.id : null
        if (!junctionId) return

        const directusFileId =
            typeof fileData.directus_files_id === 'object'
                ? fileData.directus_files_id?.id
                : fileData.directus_files_id

        try {
            await directus.request(
                updateItem('objekt', props.object.id, {
                    [field]: { create: [], update: [], delete: [junctionId] }
                } as any)
            )

            if (directusFileId) {
                await directus.request(deleteDirectusFile(directusFileId))
            }

            const list = (props.object as any)[field] as any[]
            if (list) {
                const idx = list.findIndex(
                    (item: any) => typeof item === 'object' && item.id === junctionId
                )
                if (idx !== -1) list.splice(idx, 1)
            }
        } catch (err) {
            console.error(`Fehler beim Entfernen (${field}):`, err)
        }
    }
</script>
