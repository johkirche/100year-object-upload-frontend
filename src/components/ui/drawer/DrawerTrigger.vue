<script setup lang="ts">
import { inject } from 'vue'

defineProps<{
  asChild?: boolean
}>()

// Inject drawer context from parent Drawer component
const drawer = inject('drawer', {
  isOpen: { value: false },
  onOpenChange: (_: boolean) => { }
})

const onClick = () => {
  drawer.onOpenChange(!drawer.isOpen.value)
}
</script>

<template>
  <div @click="onClick">
    <slot v-if="asChild" />
    <button v-else type="button">Open</button>
  </div>
</template>
