<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { createItem, readField } from '@directus/sdk'
import type { ItemsObjekt } from '@/client/types.gen'
import { UploadIcon, ArrowLeftIcon, ArrowRightIcon, ImageIcon, MessageSquareIcon } from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group/'
import type { ComponentPublicInstance } from 'vue'

import { useAuthStore } from '@/stores/auth'

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

// Form type and step state
type SubmissionType = 'object' | 'wish' | null;
type FormStep = 'type-selection' | 'object-info' | 'submitter-info';

const submissionType = ref<SubmissionType>(null);
const currentStep = ref<FormStep>('type-selection');

// Base schema for validation
const commonSchema = {
    name: z.string({ required_error: 'Name ist erforderlich' })
        .min(2, { message: 'Name muss mindestens 2 Zeichen haben' })
        .max(128, { message: 'Name darf maximal 128 Zeichen haben' }),
    beschreibung: z.string().min(5, { message: 'Beschreibung muss mindestens 5 Zeichen haben' }).max(4096, { message: 'Beschreibung darf maximal 4096 Zeichen haben' }),
    einreicherName: z.string({ required_error: 'Einreicher Name ist erforderlich' })
        .min(2, { message: 'Einreicher Name muss mindestens 2 Zeichen haben' }),
    einreicherGemeinde: z.string().optional().default('keineAngabe'),
    kontaktRueckfrage: z.string().email({ message: 'Gültige E-Mail-Adresse erforderlich' }).optional(),
};

// Object-specific schema (only for 'object' submission type)
const objectSchema = {
    datierung: z.string().optional(),
    kategorie: z.array(z.string()).optional(),
    art: z.string().optional(),
    format: z.string().optional(),
    objektAusleihenFuerAusstellung: z.boolean().optional(),
    aktuellerStandort: z.string().optional(),
};

// Combined schema for full validation
const fullObjectSchema = toTypedSchema(z.object({
    ...commonSchema,
    ...objectSchema
}));

// Wish-only schema (simplified)
const wishSchema = toTypedSchema(z.object(commonSchema));

// Step validation schemas
const typeSelectionSchema = toTypedSchema(z.object({
    submissionType: z.enum(['object', 'wish'])
}));

const objectInfoSchema = toTypedSchema(
    z.object({
        name: commonSchema.name,
        beschreibung: commonSchema.beschreibung,
        datierung: objectSchema.datierung,
        kategorie: objectSchema.kategorie,
        art: objectSchema.art,
        format: objectSchema.format,
    })
);

const wishInfoSchema = toTypedSchema(
    z.object({
        name: commonSchema.name,
        beschreibung: commonSchema.beschreibung,
    })
);

const submitterInfoSchema = computed(() => {
    return toTypedSchema(
        z.object({
            einreicherName: commonSchema.einreicherName,
            einreicherGemeinde: commonSchema.einreicherGemeinde,
            kontaktRueckfrage: commonSchema.kontaktRueckfrage,
            ...(submissionType.value === 'object' ? {
                objektAusleihenFuerAusstellung: objectSchema.objektAusleihenFuerAusstellung,
                aktuellerStandort: objectSchema.aktuellerStandort
            } : {})
        })
    );
});

// Reactive validation schema based on current step and submission type
const formValidationSchema = computed(() => {
    if (currentStep.value === 'type-selection') {
        return typeSelectionSchema;
    } else if (currentStep.value === 'object-info') {
        return submissionType.value === 'object' ? objectInfoSchema : wishInfoSchema;
    } else if (currentStep.value === 'submitter-info') {
        return submitterInfoSchema.value;
    }
    return submissionType.value === 'object' ? fullObjectSchema : wishSchema;
});

// Form data
const formData = reactive({
    // Common fields
    name: '',
    beschreibung: '',
    einreicherName: '',
    einreicherGemeinde: 'keineAngabe',
    kontaktRueckfrage: '',
    
    // Object-specific fields
    datierung: '',
    kategorie: [] as string[],
    art: '',
    format: '',
    objektAusleihenFuerAusstellung: false,
    aktuellerStandort: '',
    
    // Selection field
    submissionType: null as SubmissionType
});

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

// From Refs
type FormRef = ComponentPublicInstance & { resetForm: (values?: any) => void }
const typeSelectionFormRef = ref<FormRef | null>(null)
const objectInfoFormRef = ref<FormRef | null>(null)
const submitterInfoFormRef = ref<FormRef | null>(null)

// Add state for the field options from Directus
const categoryOptions = ref<any[]>([])
const gemeindeOptions = ref<any[]>([])
const categoryLookup = ref<Record<string, string>>({})

// Computed property to control FileManager dropzone visibility
const disableFileManagerUploadArea = computed(() => isUploading.value || uploadSuccess.value)

// Navigation functions
function nextStep() {
    if (currentStep.value === 'type-selection') {
        submissionType.value = formData.submissionType;
        currentStep.value = 'object-info';
    } else if (currentStep.value === 'object-info') {
        currentStep.value = 'submitter-info';
    }
}

function prevStep() {
    if (currentStep.value === 'object-info') {
        currentStep.value = 'type-selection';
    } else if (currentStep.value === 'submitter-info') {
        currentStep.value = 'object-info';
    }
}

function resetAllForms() {
  // Reset all vee-validate forms
  if (typeSelectionFormRef.value) {
    typeSelectionFormRef.value.resetForm({
      values: {
        submissionType: null
      }
    })
  }
  
  if (objectInfoFormRef.value) {
    objectInfoFormRef.value.resetForm({
      values: {
        name: null,
        beschreibung: null,
        datierung: null,
        kategorie: null,
        art: null,
        format: null
      }
    })
  }
  
  if (submitterInfoFormRef.value) {
    submitterInfoFormRef.value.resetForm({
      values: {
        einreicherName: null,
        einreicherGemeinde: 'keineAngabe',
        kontaktRueckfrage: null,
        objektAusleihenFuerAusstellung: false,
        aktuellerStandort: null
      }
    })
  }
}

// Function to fully reset state for a new upload
function startNewUpload() {
    uploadSuccess.value = false
    isUploading.value = false
    uploadError.value = null
    currentStep.value = 'type-selection'
    submissionType.value = null
    formData.submissionType = null
    
    // Reset form data
    Object.keys(formData).forEach(key => {
        if (key === 'kategorie') {
            formData[key] = [];
        } else if (key === 'einreicherGemeinde') {
            formData[key] = 'keineAngabe';
        } else if (key === 'objektAusleihenFuerAusstellung') {
            formData[key] = false;
        } else {
            // @ts-ignore - dont need to check if key is a string
            formData[key] = '';
        }
    });
    
    // Clean up any object URLs to prevent memory leaks
    files.value.forEach(file => {
        if (file.preview) {
            URL.revokeObjectURL(file.preview)
        }
    })
    files.value = []
    submittedValues.value = null

    // Reset all vee-validate forms
    resetAllForms()
}

// Function to build the category lookup for display text
function buildCategoryLookup(options: any[]) {
    const lookup: Record<string, string> = {}
    
    function processOption(option: any) {
        lookup[option.value] = option.text
        if (option.children && option.children.length > 0) {
            option.children.forEach(processOption)
        }
    }
    
    options.forEach(processOption)
    return lookup
}

// Submit function for each step
function onStepSubmit(values: any) {
    console.log(values);
    
    // Update form data with values from this step
    Object.assign(formData, values);
    
    if (currentStep.value === 'type-selection') {
        submissionType.value = values.submissionType;
        nextStep();
    } else if (currentStep.value === 'object-info') {
        nextStep();
    } else if (currentStep.value === 'submitter-info') {
        // This is the final step, submit the complete form
        onSubmit(formData);
    }
}

// Final submit function
async function onSubmit(values: any) {
    submittedValues.value = values; // Store submitted values to show summary
    isUploading.value = true        // Show uploading state
    uploadSuccess.value = false     // Reset success state
    uploadError.value = null        // Reset error state

    try {
        let hauptbildId = null;
        let additionalFileIds: string[] = [];
        
        // Upload files if any exist and this is an object submission (not a wish)
        if (submissionType.value === 'object' && files.value.length > 0 && fileManagerRef.value) {
            const uploadResult = await fileManagerRef.value.uploadAllFiles(values.name);
            hauptbildId = uploadResult.hauptbildId;
            additionalFileIds = uploadResult.additionalFileIds;
        }

        // Create the object data
        const objekt: Partial<ItemsObjekt> = {
            status: 'uploaded',
            name: values.name,
            beschreibung: values.beschreibung,
            einreicherName: values.einreicherName,
            einreicherGemeinde: values.einreicherGemeinde,
            kontaktRueckfrage: values.kontaktRueckfrage,
            // Add a field to track if this is a wish or actual object
            type: submissionType.value
        }
        
        // Add object-specific fields only if this is an object submission
        if (submissionType.value === 'object') {
            console.log(values);
            
            objekt.datierung = values.datierung;
            objekt.kategorie = values.kategorie;
            objekt.art = values.art;
            objekt.format = values.format;
            objekt.objektAusleihenFuerAusstellung = values.objektAusleihenFuerAusstellung;
            objekt.aktuellerStandort = values.aktuellerStandort;
            
            // Only add abbildung if a main image was uploaded
            if (hauptbildId) {
                objekt.abbildung = hauptbildId;
            }

            // Add weitereAbbildungen only if additional files were uploaded
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

onMounted(async () => {
    try {
        // Fetch gemeinde options
        const gemeindeField = await client.request(
            readField("objekt", "einreicherGemeinde")
        );
        
        if (gemeindeField.meta?.options?.choices) {
            gemeindeOptions.value = gemeindeField.meta.options.choices;
        }
        
        // Fetch category options
        const kategorieField = await client.request(
            readField("objekt", "kategorie")
        );
        
        if (kategorieField.meta?.options?.choices) {
            categoryOptions.value = kategorieField.meta.options.choices;
            categoryLookup.value = buildCategoryLookup(categoryOptions.value);
        }
    } catch (error) {
        console.error('Error fetching field options:', error);
        uploadError.value = 'Fehler beim Laden der Formulardaten. Bitte laden Sie die Seite neu.';
    }
})
</script>

<template>
    <div>
        <!-- General Error Message (Shown only with the form) -->
        <div v-if="uploadError && !isUploading && !uploadSuccess"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {{ uploadError }}
        </div>

        <!-- Success Card (shown after submission) -->
        <Card v-if="submittedValues && (isUploading || uploadSuccess)">
            <CardHeader>
                <CardTitle>
                    <template v-if="isUploading">
                        <span v-if="submissionType === 'object'">Objekt wird hochgeladen...</span>
                        <span v-else>Wunsch wird hochgeladen...</span>
                    </template>
                    <template v-else-if="uploadSuccess">
                        <span v-if="submissionType === 'object'">Objekt erfolgreich hochgeladen!</span>
                        <span v-else>Wunsch erfolgreich hochgeladen!</span>
                    </template>
                </CardTitle>
                <CardDescription>
                    <p>
                        Die folgenden Informationen wurden erfolgreich gespeichert:
                    </p>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <!-- Display Summary Data -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong>Name:</strong> {{ submittedValues.name }}</div>
                    <div v-if="submissionType === 'object' && submittedValues.datierung"><strong>Datierung:</strong> {{ submittedValues.datierung }}</div>
                    <div v-if="submissionType === 'object' && submittedValues.kategorie && submittedValues.kategorie.length">
                        <strong>Kategorien:</strong> 
                        {{ submittedValues.kategorie.map((k: string) => categoryLookup[k] || k).join(', ') }}
                    </div>
                    <div v-if="submissionType === 'object' && submittedValues.art"><strong>Art:</strong> {{ submittedValues.art }}</div>
                    <div v-if="submissionType === 'object' && submittedValues.format"><strong>Format:</strong> {{ submittedValues.format }}</div>
                    <div><strong>Einreicher:</strong> {{ submittedValues.einreicherName }} <span
                            v-if="submittedValues.einreicherGemeinde && submittedValues.einreicherGemeinde !== 'keineAngabe'">({{
                            gemeindeOptions.find(g => g.value === submittedValues.einreicherGemeinde)?.text }})</span></div>
                    <div v-if="submittedValues.kontaktRueckfrage"><strong>Kontakt:</strong> {{
                        submittedValues.kontaktRueckfrage }}</div>
                    <div v-if="submissionType === 'object' && submittedValues.aktuellerStandort"><strong>Akt. Standort:</strong> {{
                        submittedValues.aktuellerStandort }}</div>
                    <div v-if="submissionType === 'object'"><strong>Ausleihen?:</strong> {{ submittedValues.objektAusleihenFuerAusstellung ? 'Ja' : 'Nein' }}</div>
                </div>

                <div v-if="submittedValues.beschreibung" class="mt-4">
                    <strong class="block mb-1">Beschreibung:</strong>
                    <p class="text-sm text-muted-foreground whitespace-pre-wrap bg-gray-50 p-2 rounded border">{{
                        submittedValues.beschreibung }}</p>
                </div>

                <!-- FileManager shown during upload and after success (only for objects, not wishes) -->
                <div v-if="submissionType === 'object'">
                    <FileManager v-model="files" :error="uploadError" @error="uploadError = $event" ref="fileManagerRef"
                        :is-uploading="isUploading" :disable-upload-area="disableFileManagerUploadArea" :files-optional="true" />
                </div>

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
                        <span v-if="submissionType === 'object' && files.length">Dateien werden hochgeladen...</span>
                        <span v-else>Daten werden gespeichert...</span>
                    </Button>
                </div>
            </CardContent>
            <CardFooter>
                <Button @click="startNewUpload">Neuen Eintrag erstellen</Button>
            </CardFooter>
        </Card>

        <!-- Multi-step Form View (Only when not uploading and not successfully submitted yet) -->
        <div v-show="!isUploading && !uploadSuccess">
            <!-- Step Progress Indicator -->
            <div v-if="currentStep !== 'type-selection'" class="mb-6">
                <div class="flex justify-between">
                <div class="text-sm font-medium">
                        <span class="text-gray-400">1. Auswahl</span>
                    </div>
                    <div class="text-sm font-medium">
                        <span :class="{'text-primary': currentStep === 'object-info', 'text-gray-400': currentStep !== 'object-info'}">2. Objektinformationen</span>
                    </div>
                    <div class="text-sm font-medium">
                        <span :class="{'text-primary': currentStep === 'submitter-info', 'text-gray-400': currentStep !== 'submitter-info'}">3. Kontaktinformationen</span>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div class="bg-primary h-2.5 rounded-full" 
                        :style="{width: currentStep === 'object-info' ? '50%' : currentStep === 'submitter-info' ? '100%' : '0%'}"></div>
                </div>
            </div>

            <!-- Step 1: Type Selection -->
            <Form v-show="currentStep === 'type-selection'" @submit="onStepSubmit" :validation-schema="formValidationSchema" ref="typeSelectionFormRef" class="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Was möchten Sie einreichen?</CardTitle>
                        <CardDescription>
                            Wählen Sie zwischen einem konkreten Objektvorschlag oder einem Ausstellungswunsch
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField name="submissionType" v-slot="{ field, errorMessage }">
                            <FormItem class="space-y-4">
                                <FormControl>
                                    <RadioGroup 
                                        :model-value="field.value" 
                                        @update:model-value="field.onChange"
                                        class="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        <div 
                                            class="flex flex-col p-6 border rounded-md cursor-pointer hover:bg-gray-50"
                                            :class="{'border-primary border-2 shadow-sm': field.value === 'object', 'border-input': field.value !== 'object'}"
                                            @click="field.onChange('object')"
                                        >
                                            <FormControl>
                                                <RadioGroupItem value="object" class="sr-only" />
                                            </FormControl>
                                            <div class="flex flex-col items-center text-center">
                                                <div class="p-2 rounded-full bg-primary/10 mb-4">
                                                    <ImageIcon class="h-6 w-6 text-primary" />
                                                </div>
                                                <FormLabel class="font-medium text-lg mb-2">Objektvorschlag</FormLabel>
                                                <FormDescription>
                                                    Ich besitze ein konkretes Objekt und möchte es für die Ausstellung vorschlagen
                                                </FormDescription>
                                            </div>
                                        </div>
                                        
                                        <div 
                                            class="flex flex-col p-6 border rounded-md cursor-pointer hover:bg-gray-50"
                                            :class="{'border-primary border-2 shadow-sm': field.value === 'wish', 'border-input': field.value !== 'wish'}"
                                            @click="field.onChange('wish')"
                                        >
                                            <FormControl>
                                                <RadioGroupItem value="wish" class="sr-only" />
                                            </FormControl>
                                            <div class="flex flex-col items-center text-center">
                                                <div class="p-2 rounded-full bg-primary/10 mb-4">
                                                    <MessageSquareIcon class="h-6 w-6 text-primary" />
                                                </div>
                                                <FormLabel class="font-medium text-lg mb-2">Ausstellungswunsch</FormLabel>
                                                <FormDescription>
                                                    Ich möchte ein Objekt vorschlagen, das in der Ausstellung gezeigt werden sollte
                                                </FormDescription>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage>{{ errorMessage }}</FormMessage>
                            </FormItem>
                        
                            <CardFooter class="px-0 pb-0 pt-4 justify-end">
                                <Button type="submit" :disabled="!field.value">
                                    Weiter
                                    <ArrowRightIcon class="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </FormField>
                    </CardContent>
                </Card>
            </Form>

            <!-- Step 2: Object Information -->
            <Form v-show="currentStep === 'object-info'" @submit="onStepSubmit" :validation-schema="formValidationSchema" ref="objectInfoFormRef" class="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <span v-if="submissionType === 'object'">Objektinformationen</span>
                            <span v-else>Objektwunsch</span>
                        </CardTitle>
                        <CardDescription>
                            <span v-if="submissionType === 'object'">Bitte geben Sie Informationen zu Ihrem Objekt an</span>
                            <span v-else>Bitte beschreiben Sie das gewünschte Ausstellungsobjekt</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">
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
                                <FormDescription>
                                    <span v-if="submissionType === 'object'">Detaillierte Beschreibung des Objekts und seiner Geschichte</span>
                                    <span v-else>Warum sollte dieses Objekt in der Ausstellung gezeigt werden?</span>
                                </FormDescription>
                                <FormMessage>{{ errorMessage }}</FormMessage>
                            </FormItem>
                        </FormField>

                        <!-- Additional fields only for Object Submissions -->
                        <div v-if="submissionType === 'object'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                        
                        <!-- File Upload section only for object submissions -->
                        <div v-if="submissionType === 'object'" class="pt-4">
                            <h3 class="text-lg font-medium mb-2">Bilder oder Dokumente des Objekts</h3>
                            <FileManager v-model="files" :error="uploadError" @error="uploadError = $event" ref="fileManagerRef"
                                :is-uploading="isUploading" :disable-upload-area="disableFileManagerUploadArea" :files-optional="true" />
                        </div>
                    </CardContent>
                    <CardFooter class="flex justify-between">
                        <Button type="button" variant="outline" @click="prevStep">
                            <ArrowLeftIcon class="mr-2 h-4 w-4" />
                            Zurück
                        </Button>
                        <Button type="submit">
                            Weiter
                            <ArrowRightIcon class="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </Form>

            <!-- Step 3: Submitter Information -->
            <Form v-show="currentStep === 'submitter-info'" @submit="onStepSubmit" :validation-schema="formValidationSchema" ref="submitterInfoFormRef" class="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Ihre Kontaktinformationen</CardTitle>
                        <CardDescription>
                            Bitte geben Sie Ihre Kontaktdaten an
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">
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
                                                <SelectItem v-for="gemeinde in gemeindeOptions" :key="gemeinde.value" :value="gemeinde.value">
                                                    {{ gemeinde.text }}
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

                            <!-- Object-specific fields -->
                            <div v-if="submissionType === 'object'">
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
                        </div>

                        <div v-if="submissionType === 'object'">
                            <FormField name="objektAusleihenFuerAusstellung" v-slot="{ field, errorMessage }">
                                <FormItem class="flex flex-row items-start gap-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox :model-value="field.value" @update:model-value="field.onChange" />
                                    </FormControl>
                                    <div class="space-y-1 leading-none">
                                        <FormLabel>Ich würde das Objekt für eine Ausstellung zur Verfügung stellen</FormLabel>
                                        <FormDescription>
                                            Bei Zustimmung kann das Objekt für zukünftige Ausstellungen angefragt werden
                                        </FormDescription>
                                    </div>
                                    <FormMessage>{{ errorMessage }}</FormMessage>
                                </FormItem>
                            </FormField>
                        </div>
                    </CardContent>
                    <CardFooter class="flex justify-between">
                        <Button type="button" variant="outline" @click="prevStep">
                            <ArrowLeftIcon class="mr-2 h-4 w-4" />
                            Zurück
                        </Button>
                        <Button type="submit" :disabled="isUploading">
                            <UploadIcon class="w-4 h-4 mr-2" />
                            Absenden
                        </Button>
                    </CardFooter>
                </Card>
            </Form>
        </div>
    </div>
</template>