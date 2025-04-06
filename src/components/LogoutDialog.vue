<script setup lang="ts">
import { defineEmits } from 'vue'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

defineProps<{
    open: boolean
}>()

const emits = defineEmits<{
    'update:open': [value: boolean]
    'confirm': []
    'cancel': []
}>()

const handleConfirm = () => {
    emits('confirm')
    emits('update:open', false)
}

const handleCancel = () => {
    emits('cancel')
    emits('update:open', false)
}
</script>

<template>
    <Dialog :open="open" @update:open="(val) => emits('update:open', val)">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Abmelden bestätigen</DialogTitle>
                <DialogDescription>
                    Sind Sie sicher, dass Sie sich abmelden möchten? Um wieder auf das Formular zugreifen zu können,
                    müssen Sie den QR-Code erneut scannen.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="flex gap-2 justify-end">
                <Button variant="outline" @click="handleCancel">Abbrechen</Button>
                <Button variant="destructive" @click="handleConfirm">Abmelden</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>