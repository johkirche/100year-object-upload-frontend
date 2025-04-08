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
// Reference to the popover content for scrolling
const popoverContentRef = ref<HTMLElement | null>(null)

// Function to update the trigger width
const updateTriggerWidth = async () => {
    // Wait for DOM to be updated
    await nextTick();
    if (containerRef.value) {
        triggerWidth.value = containerRef.value.offsetWidth;
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

// Function to find and expand all parents of a specific item
const expandPathToItem = async (itemValue: string) => {
    // Find all parents of the item
    const parents: string[] = []

    // Recursive function to find item and collect its parents
    const findItemParents = (options: Option[], currentPath: string[] = []): boolean => {
        for (const option of options) {
            // Check if this is the item we're looking for
            if (option.value === itemValue) {
                // We found it, add all parents to our list
                parents.push(...currentPath)
                return true
            }

            // If this item has children, check them recursively
            if (option.children && option.children.length > 0) {
                const found = findItemParents(
                    option.children,
                    [...currentPath, option.value]
                )

                // If found in children, return true
                if (found) return true
            }
        }

        // Not found in this branch
        return false
    }

    // Start the search from root options
    findItemParents(props.options)

    // Expand all parents
    parents.forEach(parent => {
        expandedItems.value[parent] = true
    })

    // Make sure popover is open to see the expanded path
    popoverOpen.value = true

    // Wait for DOM to update after expanding nodes
    await nextTick()

    // Scroll to the target element
    scrollToElement(itemValue)
}

// Function to scroll to an element in the tree
const scrollToElement = async (itemValue: string) => {
    // Wait for DOM updates to complete to ensure elements are rendered
    await nextTick()

    // Create an element ID format from the value
    const elementId = `tree-node-${itemValue.replace(/[^a-zA-Z0-9]/g, '-')}`

    // Find the element directly in the DOM using its ID
    const targetElement = document.getElementById(elementId)
    if (!targetElement || !popoverContentRef.value) return

    // Scroll the target element into view
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    })

    // Add flash animation effect
    targetElement.classList.add('flash-highlight')

    // Remove the class after animation completes
    setTimeout(() => {
        targetElement.classList.remove('flash-highlight')
    }, 1500) // Animation duration + a little extra time
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
        event.preventDefault()
    }
    selectedValues.value = selectedValues.value.filter(v => v !== value)
}

// Handle clicking on a badge to show the item in the tree
const onBadgeClick = (value: string, event: Event) => {
    event.stopPropagation()
    event.preventDefault()

    // Expand the path to this item
    expandPathToItem(value)
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
            <PopoverContent class="p-0 max-h-[500px] overflow-y-auto" :style="popoverStyle" ref="popoverContentRef">
                <Command class="w-full">
                    <CommandInput :placeholder="'Suchen...'" v-model="searchQuery" />
                    <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
                    <CommandGroup>
                        <div class="flex flex-wrap gap-1 pb-2 pt-1 border-b mb-2" v-if="selectedValues.length > 0">
                            <Badge v-for="value in selectedValues" :key="value" variant="outline"
                                @click="onBadgeClick(value, $event)"
                                class="flex items-center flex-grow gap-1 px-2 py-1 h-auto justify-between max-w-[250px] cursor-pointer hover:bg-muted">
                                <span class="truncate">{{
                                    getDisplayText(value) }}</span>
                                <button @click.stop="removeItem(value, $event)"
                                    class="inline-flex hover:text-red-500 ml-1 pl-2 -my-1 py-1 border-l">
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