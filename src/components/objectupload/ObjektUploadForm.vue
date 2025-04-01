<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { createItem } from '@directus/sdk'
import type { ItemsObjekt } from '@/client/types.gen'
import { UploadIcon } from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useAuthStore } from '@/stores/auth'

import { categoryOptions, gemeindeOptions } from '@/assets/Options'

import FileManager from '@/components/objectupload/FileManager.vue'
import HierarchicalMultiSelect from '@/components/objectupload/HierarchicalMultiSelect.vue'

// Set custom error messages in German
z.setErrorMap((issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_type) {
        if (issue.expected === 'string') {
            return { message: 'Dieses Feld ist erforderlich' };
        }
    }
    return { message: ctx.defaultError };
});

// Get authentication from store
const authStore = useAuthStore()
const client = authStore.getClient()

// Form schema with validation
const formSchema = toTypedSchema(
    z.object({
        name: z.string({ required_error: 'Name ist erforderlich' })
            .min(2, { message: 'Name muss mindestens 2 Zeichen haben' })
            .max(128, { message: 'Name darf maximal 128 Zeichen haben' }),
        datierung: z.string().optional(),
        beschreibung: z.string().max(4096, { message: 'Beschreibung darf maximal 4096 Zeichen haben' }),
        kategorie: z.array(z.string()).optional(),
        art: z.string().optional(),
        format: z.string().optional(),
        einreicherName: z.string({ required_error: 'Einreicher Name ist erforderlich' }).min(2, { message: 'Einreicher Name muss mindestens 2 Zeichen haben' }),
        einreicherGemeinde: z.string().optional().default('--keine Angabe--'),
        kontaktRueckfrage: z.string().email({ message: 'Gültige E-Mail-Adresse erforderlich' }).optional(),
        objektAusleihenFuerAusstellung: z.boolean().optional(),
        aktuellerStandort: z.string().optional(),
    })
)

// File handling state
interface FileItem {
    file: File;
    preview?: string;
    isMain: boolean;
    id?: string;
    uploaded?: boolean;
    progress?: number;
    isImage: boolean;
}

const files = ref<FileItem[]>([])
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref(false)
const fileManagerRef = ref<InstanceType<typeof FileManager> | null>(null)
const submittedValues = ref<any>(null)

// Computed property to control FileManager dropzone visibility
const disableFileManagerUploadArea = computed(() => isUploading.value || uploadSuccess.value)

// Function to fully reset state for a new upload
function startNewUpload() {
    uploadSuccess.value = false
    isUploading.value = false
    uploadError.value = null
    // Clean up any object URLs to prevent memory leaks
    files.value.forEach(file => {
        if (file.preview) {
            URL.revokeObjectURL(file.preview)
        }
    })
    files.value = []
    submittedValues.value = null
    // TODO: Consider adding form.reset() if using vee-validate's useForm hook directly
}

// Submit function
async function onSubmit(values: any) {
    submittedValues.value = values; // Store submitted values to show summary
    isUploading.value = true        // Show uploading state
    uploadSuccess.value = false     // Reset success state
    uploadError.value = null        // Reset error state

    try {
        // Upload all files using the FileManager component
        if (!fileManagerRef.value) {
            throw new Error('File manager not initialized')
        }

        const { hauptbildId, additionalFileIds } = await fileManagerRef.value.uploadAllFiles(values.name)

        // Create the object data
        const objekt: Partial<ItemsObjekt> = {
            status: 'uploaded',
            name: values.name,
            datierung: values.datierung,
            abbildung: hauptbildId,
            beschreibung: values.beschreibung,
            kategorie: values.kategorie,
            art: values.art,
            format: values.format,
            einreicherName: values.einreicherName,
            einreicherGemeinde: values.einreicherGemeinde,
            kontaktRueckfrage: values.kontaktRueckfrage,
            objektAusleihenFuerAusstellung: values.objektAusleihenFuerAusstellung,
            aktuellerStandort: values.aktuellerStandort,
        }

        // Add weitereAbbildungen in the required format
        if (additionalFileIds.length > 0) {
            objekt.weitereAbbildungen = {
                // @ts-ignore - Type is not correctly defined in the auto-generated types file
                create: additionalFileIds.map(id => ({
                    objekt_id: "+",
                    directus_files_id: {
                        id: id
                    }
                })),
                update: [],
                delete: []
            }
        }

        // Create item in the objekt collection using Directus SDK
        await client.request(createItem('objekt', objekt))

        // Success!
        uploadSuccess.value = true
        // Keep submittedValues and files to show in the summary view

    } catch (error) {
        console.error('Upload error:', error)
        uploadError.value = error instanceof Error ? error.message : "Fehler beim Hochladen. Bitte versuchen Sie es erneut."
        // On error, clear submitted values to return to the form view
        submittedValues.value = null
    } finally {
        isUploading.value = false // Upload attempt finished (success or fail)
    }
}
</script>

<template>
    <div>
        <!-- General Error Message (Shown only with the form) -->
        <div v-if="uploadError && !isUploading && !uploadSuccess"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {{ uploadError }}
        </div>

        <Card v-if="submittedValues && (isUploading || uploadSuccess)">
            <CardHeader>
                <CardTitle>
                    <template v-if="isUploading">
                        Objekt wird hochgeladen...
                    </template>
                    <template v-else-if="uploadSuccess">
                        Objekt erfolgreich hochgeladen!
                    </template>
                </CardTitle>
                <CardDescription>
                    <p>
                        Die folgenden Informationen wurden erfolgreich gespeichert:
                    </p>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <!-- Title changes based on state -->


                <!-- Display Summary Data -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {{ submittedValues.name }}</div>
                    <div v-if="submittedValues.datierung"><strong>Datierung:</strong> {{ submittedValues.datierung }}
                    </div>
                    <div v-if="submittedValues.kategorie && submittedValues.kategorie.length"><strong>Kategorien:</strong> {{
                        submittedValues.kategorie.join(', ') }}</div>
                    <div v-if="submittedValues.art"><strong>Art:</strong> {{ submittedValues.art }}</div>
                    <div v-if="submittedValues.format"><strong>Format:</strong> {{ submittedValues.format }}</div>
                    <div><strong>Einreicher:</strong> {{ submittedValues.einreicherName }} <span
                            v-if="submittedValues.einreicherGemeinde && submittedValues.einreicherGemeinde !== '--keine Angabe--'">({{
                            submittedValues.einreicherGemeinde }})</span></div>
                    <div v-if="submittedValues.kontaktRueckfrage"><strong>Kontakt:</strong> {{
                        submittedValues.kontaktRueckfrage }}
                    </div>
                    <div v-if="submittedValues.aktuellerStandort"><strong>Akt. Standort:</strong> {{
                        submittedValues.aktuellerStandort }}</div>
                    <div><strong>Ausleihen?:</strong> {{ submittedValues.objektAusleihenFuerAusstellung ? 'Ja' : 'Nein'
                        }}</div>
                </div>

                <div v-if="submittedValues.beschreibung" class="mt-4">
                    <strong class="block mb-1">Beschreibung:</strong>
                    <p class="text-sm text-muted-foreground whitespace-pre-wrap bg-gray-50 p-2 rounded border">{{
                        submittedValues.beschreibung }}</p>
                </div>

                <!-- FileManager shown during upload and after success -->
                <FileManager v-model="files" :error="uploadError" @error="uploadError = $event" ref="fileManagerRef"
                    :is-uploading="isUploading" :disable-upload-area="disableFileManagerUploadArea" />

                <!-- Error during upload -->
                <div v-if="uploadError && isUploading"
                    class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
                    Upload Fehler: {{ uploadError }}
                </div>

                <!-- Uploading Spinner -->
                <div class="flex justify-center mt-6" v-if="isUploading">
                    <Button type="button" :disabled="true" class="w-full md:w-auto opacity-75 cursor-not-allowed">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                            fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        Wird hochgeladen...
                    </Button>
                </div>

            </CardContent>
            <CardFooter>
                <Button @click="startNewUpload">Neues Objekt hochladen</Button>
            </CardFooter>
        </Card>

        <!-- Form View (Only when not uploading and not successfully submitted yet) -->
        <Form v-if="!isUploading && !uploadSuccess" @submit="onSubmit" :validation-schema="formSchema"
            class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Name des Objekts -->
                <FormField name="name" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Name des Objekts</FormLabel>
                        <FormControl>
                            <div class="relative">
                                <Input v-bind="field" placeholder="z.B. Bibel aus der Gemeinde Berlin"
                                    maxlength="128" />
                                <div class="absolute bottom-1 right-2 text-xs text-muted-foreground">
                                    {{ (field.value?.length || 0) }}/128
                                </div>
                            </div>
                        </FormControl>
                        <FormDescription>Der Name oder Titel des Objekts</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="datierung" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Datierung</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="z.B. 1926 oder um 1930" />
                        </FormControl>
                        <FormDescription>Entstehungszeitraum oder Alter des Objekts</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="art" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Objektart / Material / Medium</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="z.B. Foto, Broschüre, Gegenstand, Kleidungsstück, Filmaufnahme, ..." />
                        </FormControl>
                        <FormDescription>Material, Medium oder Art des Objekts</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="format" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Format / Größe</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="z.B. 10x15x5cm, ca. DIN A4, digital, ..." />
                        </FormControl>
                        <FormDescription>Größe, Maße oder Format des Objekts</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>
            </div>

            <FormField name="kategorie" v-slot="{ field, errorMessage }">
                <FormItem>
                    <FormLabel>Kategorien</FormLabel>
                    <FormControl>
                        <HierarchicalMultiSelect :options="categoryOptions" :model-value="field.value"
                            @update:model-value="field.onChange($event)" placeholder="Kategorie(n) auswählen ..." />
                    </FormControl>
                    <FormDescription>
                        Wählen Sie eine oder mehrere Kategorien aus
                    </FormDescription>
                    <FormMessage>{{ errorMessage }}</FormMessage>
                </FormItem>
            </FormField>

            <FormField name="beschreibung" v-slot="{ field, errorMessage }">
                <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                        <div class="relative">
                            <textarea v-bind="field"
                                class="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Beschreiben Sie das Objekt und seine Bedeutung"></textarea>
                            <div class="absolute bottom-1 right-2 text-xs text-muted-foreground">
                                {{ (field.value?.length || 0) }}/4096
                            </div>
                        </div>
                    </FormControl>
                    <FormDescription>Detaillierte Beschreibung des Objekts und seiner Geschichte</FormDescription>
                    <FormMessage>{{ errorMessage }}</FormMessage>
                </FormItem>
            </FormField>

            <FileManager v-model="files" :error="uploadError" @error="uploadError = $event" ref="fileManagerRef"
                :is-uploading="isUploading" :disable-upload-area="disableFileManagerUploadArea" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField name="einreicherName" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Name des Einreichers</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="Vor- und Nachname" />
                        </FormControl>
                        <FormDescription>Ihr vollständiger Name</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="einreicherGemeinde" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Gemeinde des Einreichers</FormLabel>
                        <FormControl>
                            <Select :model-value="field.value" @update:model-value="field.onChange($event)">
                                <SelectTrigger class="w-full">
                                    <SelectValue placeholder="Gemeinde auswählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem v-for="gemeinde in gemeindeOptions" :key="gemeinde" :value="gemeinde">
                                        {{ gemeinde }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormControl>
                        <FormDescription>Zu welcher Gemeinde gehören Sie?</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="kontaktRueckfrage" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Kontakt für Rückfragen</FormLabel>
                        <FormControl>
                            <Input v-bind="field" type="email" placeholder="E-Mail-Adresse" />
                        </FormControl>
                        <FormDescription>Ihre E-Mail-Adresse für eventuelle Rückfragen</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>

                <FormField name="aktuellerStandort" v-slot="{ field, errorMessage }">
                    <FormItem>
                        <FormLabel>Aktueller Standort</FormLabel>
                        <FormControl>
                            <Input v-bind="field" placeholder="z.B. Privatbesitz, Gemeindearchiv" />
                        </FormControl>
                        <FormDescription>Wo befindet sich das Objekt aktuell?</FormDescription>
                        <FormMessage>{{ errorMessage }}</FormMessage>
                    </FormItem>
                </FormField>
            </div>

            <FormField name="objektAusleihenFuerAusstellung" v-slot="{ field }">
                <FormItem>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" :checked="field.value" @update:checked="field.onChange"
                            id="objektAusleihen"
                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label for="objektAusleihen"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Ich würde das Objekt für eine Ausstellung zur Verfügung stellen
                        </label>
                    </div>
                </FormItem>
            </FormField>

            <Button type="submit" :disabled="isUploading || files.length === 0 || !files.some(f => f.isMain)"
                class="w-full md:w-auto">
                <UploadIcon class="w-4 h-4" />
                Objekt hochladen
            </Button>
        </Form>
    </div>
</template>

<style scoped>
/* We no longer need the dropzone styles here as they are in the ImageDropzone component */
</style>