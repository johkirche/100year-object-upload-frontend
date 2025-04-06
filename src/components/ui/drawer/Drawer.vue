<script lang="ts" setup>
import { DrawerRoot } from 'vaul-vue'

defineProps({
  modelValue: Boolean,
  shouldScaleBackground: {
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(['update:modelValue'])
</script>

<template>
  <DrawerRoot :modelValue="modelValue" :shouldScaleBackground="shouldScaleBackground"
    @update:modelValue="(val: boolean) => emits('update:modelValue', val)">
    <slot />
  </DrawerRoot>
</template>
