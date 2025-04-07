<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-vue-next'
// Register TreeNode component
import TreeNode from './TreeNode.vue'

import { useObjects } from '@/composables/useObjects'

interface Option {
    value: string;
    text: string;
    children?: Option[];
}

const props = defineProps({
    options: {
        type: Array as () => Option[],
        required: true
    },
    modelValue: {
        type: Array as () => string[],
        default: () => []
    },
    placeholder: {
        type: String,
        default: 'Bitte auswählen...'
    }
})

const emit = defineEmits<{
    'update:modelValue': [value: string[]];
}>()

// Reference to the trigger button for width calculation
const triggerRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const triggerWidth = ref<number>(300) // Default width as fallback

// Function to update the trigger width
const updateTriggerWidth = async () => {
    // Wait for DOM to be updated
    await nextTick();

    // Get the container width first as fallback
    if (containerRef.value) {
        triggerWidth.value = containerRef.value.offsetWidth;
    }

    // Then try to get the actual button width if available
    if (triggerRef.value) {
        // Use getBoundingClientRect for more accurate measurement
        const rect = triggerRef.value.getBoundingClientRect();
        if (rect.width > 0) {
            triggerWidth.value = rect.width;
        }
    }
};

// Update width when popover opens
const popoverOpen = ref(false);
watch(popoverOpen, async (isOpen) => {
    if (isOpen) {
        await updateTriggerWidth();
    }
});

// Watch for changes in the trigger element to update the width
watch(() => triggerRef.value, async (newTrigger) => {
    if (newTrigger) {
        await updateTriggerWidth();
    }
}, { immediate: true });

// Update the trigger width when mounted and on window resize
onMounted(async () => {
    await updateTriggerWidth();
    window.addEventListener('resize', updateTriggerWidth);
});

// Computed style for popover content with a guaranteed width
const popoverStyle = computed(() => {
    return {
        width: `${triggerWidth.value}px`
    };
});

const selectedValues = computed({
    get: () => props.modelValue,
    set: (value: string[]) => emit('update:modelValue', value)
})

const { buildCategoryLookup } = useObjects()

// Track expanded state for each parent
const expandedItems = ref<Record<string, boolean>>({})

// Track search query
const searchQuery = ref('')

// Function to expand all parents of matching items when searching
const expandParentsOfMatches = (query: string) => {
    if (!query.trim()) return

    const lowerQuery = query.toLowerCase()

    // Find all matching items and their parents
    const matchingParents = new Set<string>()

    // Recursive function to find matches in the tree
    const findMatches = (options: Option[], parentPaths: string[] = []) => {
        for (const option of options) {
            // Check if this option matches the search
            const isMatch = option.text.toLowerCase().includes(lowerQuery)

            // If this item or any of its children match, add all parents to the set
            if (isMatch) {
                // Add all parents to the set of nodes to expand
                parentPaths.forEach(parent => matchingParents.add(parent))
            }

            // Process children recursively
            if (option.children && option.children.length > 0) {
                findMatches(
                    option.children,
                    [...parentPaths, option.value]
                )
            }
        }
    }

    // Start the search from the root options
    findMatches(props.options)

    // Expand all parents of matching items
    matchingParents.forEach(parent => {
        expandedItems.value[parent] = true
    })
}

// Watch for changes in search query
watch(searchQuery, (newQuery) => {
    if (!newQuery.trim()) {
        // Optionally collapse all when search is cleared
        // expandedItems.value = {}
    } else {
        expandParentsOfMatches(newQuery)
    }
})

// Toggle expanded state for an item
const toggleExpand = (optionValue: string, event: Event) => {
    event.stopPropagation()
    expandedItems.value[optionValue] = !expandedItems.value[optionValue]
}

// Toggle item selection
const toggleSelection = (option: Option): void => {
    let updatedValues = [...selectedValues.value]

    if (selectedValues.value.includes(option.value)) {
        // If checked, uncheck it
        updatedValues = updatedValues.filter(value => value !== option.value)
    } else {
        // If unchecked, check it
        updatedValues.push(option.value)
    }

    selectedValues.value = updatedValues
}

const formattedCategories = computed(() => {
    if (!props.modelValue || !Array.isArray(props.modelValue) || props.modelValue.length === 0) {
        return 'Keine Kategorien'
    }

    const categoryLookup = buildCategoryLookup(props.options)

    return props.modelValue
        .map((cat: string) => categoryLookup[cat] || cat)
        .join(', ')
})

// Get display text for a specific value
const getDisplayText = (value: string) => {
    const categoryLookup = buildCategoryLookup(props.options)
    return categoryLookup[value] || value
}

// Remove a specific item from selection
const removeItem = (value: string, event?: Event) => {
    if (event) {
        event.stopPropagation()
    }
    selectedValues.value = selectedValues.value.filter(v => v !== value)
}

// Determine if we should show a badge with count instead of the full text
const showBadgeCount = computed(() => {
    return selectedValues.value.length > 1
})
</script>

<template>
    <div class="w-full" ref="containerRef">
        <Popover v-model:open="popoverOpen">
            <PopoverTrigger as-child>
                <Button variant="outline" role="combobox" class="w-full justify-between" ref="triggerRef">
                    <span v-if="selectedValues.length === 0" class="text-muted-foreground">
                        {{ placeholder }}
                    </span>
                    <div v-else class="flex items-center gap-2 flex-grow min-w-0">
                        <span class="truncate min-w-0">
                            {{ formattedCategories }}
                        </span>
                        <div class="flex-grow"></div>
                        <Badge v-if="showBadgeCount" variant="secondary" class="shrink-0">{{ selectedValues.length }}
                            ausgewählt</Badge>
                    </div>
                    <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent class="p-0 max-h-[500px] overflow-y-auto" :style="popoverStyle">
                <Command class="w-full">
                    <CommandInput :placeholder="'Suchen...'" v-model="searchQuery" />
                    <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
                    <CommandGroup>
                        <div class="flex flex-wrap gap-1 pb-2 pt-1 border-b mb-2" v-if="selectedValues.length > 0">
                            <Badge v-for="value in selectedValues" :key="value" variant="outline"
                                class="flex items-center flex-grow gap-1 px-2 py-1 h-auto justify-between max-w-[250px]">
                                <span class="truncate">{{ getDisplayText(value) }}</span>
                                <button @click.stop="removeItem(value, $event)"
                                    class="inline-flex rounded-full hover:bg-muted ml-1">
                                    <X class="h-3 w-3" />
                                </button>
                            </Badge>
                        </div>
                        <TreeNode v-for="option in options" :key="option.value" :option="option" :level="0"
                            :selected-values="selectedValues" :expanded-items="expandedItems"
                            :search-query="searchQuery" @update:selected="toggleSelection"
                            @toggle-expand="toggleExpand" />
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
</template>