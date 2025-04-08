<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { CommandItem } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'

// Self-import for recursion
import TreeNode from './TreeNode.vue'

interface Option {
    value: string;
    text: string;
    children?: Option[];
}

const props = defineProps<{
    option: Option;
    level: number;
    selectedValues: string[];
    expandedItems: Record<string, boolean>;
    searchQuery?: string;
}>()

const emit = defineEmits<{
    'update:selected': [option: Option];
    'toggle-expand': [optionValue: string, event: Event];
}>()

const isExpanded = computed(() => {
    return !!props.expandedItems[props.option.value]
})

const isChecked = computed(() => {
    return props.selectedValues.includes(props.option.value)
})

const handleToggleExpand = (event: Event) => {
    emit('toggle-expand', props.option.value, event)
}

const handleToggleSelect = () => {
    emit('update:selected', props.option)
}

const searchQueryEmpty = computed(() => {
    return !props.searchQuery || !props.searchQuery.trim()
})

const hasChildren = computed(() => {
    return props.option.children && props.option.children.length > 0
})

const paddingLeft = computed(() => {
    return searchQueryEmpty.value ? `${props.level * 0.5 + 0.5}rem` : '0.5rem'
})

// Generate a unique and consistent ID for this node
const nodeId = computed(() => {
    return `tree-node-${props.option.value.replace(/[^a-zA-Z0-9]/g, '-')}`
})

// Determine if the current node matches the search query
const matchesSearch = computed(() => {
    if (!props.searchQuery || !props.searchQuery.trim()) return false

    return props.option.text.toLowerCase().includes(props.searchQuery.toLowerCase())
})

// Create highlighted text with matching part in bold
const highlightedText = computed(() => {
    if (!props.searchQuery || !props.searchQuery.trim()) return props.option.text

    const regex = new RegExp(`(${props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return props.option.text.replace(regex, '<strong class="bg-yellow-100 dark:bg-yellow-800">$1</strong>')
})
</script>

<template>
    <CommandItem :value="option.text" class="p-0" :id="nodeId">
        <div class="flex items-center space-x-2 p-2 w-full" :style="{ paddingLeft }"
            :class="{ 'bg-accent/20': matchesSearch }">
            <!-- Expand/collapse icon for items with children -->
            <div v-if="hasChildren && searchQueryEmpty" class="w-4 h-4 flex items-center justify-center cursor-pointer"
                @click.stop="handleToggleExpand">
                <ChevronDown v-if="isExpanded" class="h-4 w-4" />
                <ChevronRight v-else class="h-4 w-4" />
            </div>
            <div v-else class="w-4"></div>

            <!-- Checkbox for selection -->
            <Checkbox :id="option.value" :model-value="isChecked" @update:model-value="handleToggleSelect" />

            <!-- Label with highlighted text if matching search -->
            <label :for="option.value"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                v-html="searchQuery ? highlightedText : option.text">
            </label>
        </div>
    </CommandItem>

    <!-- Recursively render children if they exist and are expanded -->
    <div v-if="hasChildren" v-show="isExpanded">
        <TreeNode v-for="child in option.children" :key="child.value" :option="child" :level="level + 1"
            :selected-values="selectedValues" :expanded-items="expandedItems" :search-query="searchQuery"
            @update:selected="$emit('update:selected', $event)"
            @toggle-expand="(value, event) => $emit('toggle-expand', value, event)" />
    </div>
</template>

<style scoped>
/* Flash highlight animation effect */
:global(.flash-highlight) {
    animation: flash-animation 0.5s ease-in-out;
}

@keyframes flash-animation {

    0%,
    100% {
        background-color: transparent;
    }

    20%,
    80% {
        background-color: hsl(var(--primary) / 0.15);
    }

    40% {
        background-color: hsl(var(--primary) / 0.25);
    }
}
</style>