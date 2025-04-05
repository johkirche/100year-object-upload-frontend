<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'

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

const selectedValues = computed({
    get: () => props.modelValue,
    set: (value: string[]) => emit('update:modelValue', value)
})

// Check if parent is checked (all children are selected)
const isParentChecked = (option: Option): boolean => {
    return selectedValues.value.includes(option.value)
}

// Check if child is checked
const isChildChecked = (child: Option): boolean => {
    return selectedValues.value.includes(child.value)
}

// Toggle parent and all its children
const toggleParent = (option: Option): void => {
    let updatedValues = [...selectedValues.value]

    if (selectedValues.value.includes(option.value)) {
        // If checked, uncheck only the parent
        updatedValues = updatedValues.filter(value => value !== option.value)
    } else {
        // If unchecked, check only the parent
        updatedValues.push(option.value)
    }

    selectedValues.value = updatedValues
}

// Toggle child
const toggleChild = (child: Option): void => {
    let updatedValues = [...selectedValues.value]

    if (selectedValues.value.includes(child.value)) {
        // If checked, uncheck it
        updatedValues = updatedValues.filter(value => value !== child.value)
    } else {
        // If unchecked, check it
        updatedValues.push(child.value)
    }

    selectedValues.value = updatedValues
}
</script>

<template>
    <div class="w-full">
        <Popover>
            <PopoverTrigger as-child>
                <Button variant="outline" role="combobox" class="w-full justify-between">
                    <span v-if="selectedValues.length === 0" class="text-muted-foreground">
                        {{ placeholder }}
                    </span>
                    <span v-else class="truncate">
                        {{ selectedValues.length }} ausgewählt
                    </span>
                    <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-full p-0 max-h-[500px] overflow-y-auto">
                <Command>
                    <CommandInput :placeholder="'Suchen...'" />
                    <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
                    <CommandGroup>
                        <div v-for="option in options" :key="option.value">
                            <CommandItem :value="option.text" class="p-0">
                                <div class="flex items-center space-x-2 p-2 w-full">
                                    <Checkbox
:id="option.value" :model-value="isParentChecked(option)"
                                        @update:model-value="toggleParent(option)" />
                                    <label
:for="option.value"
                                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                        {{ option.text }}
                                    </label>
                                </div>
                            </CommandItem>

                            <!-- Render children if they exist -->
                            <div v-if="option.children && option.children.length > 0" class="ml-6">
                                <CommandItem
v-for="child in option.children" :key="child.value" :value="child.text"
                                    class="p-0">
                                    <div class="flex items-center space-x-2 p-2 w-full">
                                        <Checkbox
:id="child.value" :model-value="isChildChecked(child)"
                                            @update:model-value="toggleChild(child)" />
                                        <label
:for="child.value"
                                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                            {{ child.text }}
                                        </label>
                                    </div>
                                </CommandItem>
                            </div>
                        </div>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
</template>