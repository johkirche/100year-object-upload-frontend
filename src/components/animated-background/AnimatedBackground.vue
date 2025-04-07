<template>
    <div class="animated-bg">
        <div v-for="(blob, index) in blobs" :key="index" class="blob" :style="{
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            width: `${blob.size}px`,
            height: `${blob.size}px`,
            backgroundColor: blob.color,
            opacity: blob.opacity,
            animationDuration: `${blob.duration}s`,
            filter: `blur(${blur}px)`,
            animationDelay: `${blob.delay}s`,
        }"></div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface BlobItem {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    duration: number;
    delay: number;
}

// Predefined color palettes as constant
const DEFAULT_COLOR_PALETTES: string[][] = [
    // Blue and purple - more varied hues and contrast
    ['#1D4ED8', '#7E22CE', '#3B82F6', '#A855F7', '#60A5FA'],

    // Green and teal - wider range of values
    ['#047857', '#34D399', '#065F46', '#5EEAD4', '#14B8A6'],

    // Warm sunset - more color separation
    ['#B45309', '#F97316', '#EF4444', '#F59E0B', '#EC4899'],

    // Ocean - better contrast between blues
    ['#0369A1', '#22D3EE', '#0EA5E9', '#0891B2', '#7DD3FC'],

    // Forest - more distinctive greens
    ['#166534', '#4ADE80', '#15803D', '#86EFAC', '#059669'],

    // Berry - more varied pink/purple tones
    ['#9D174D', '#F472B6', '#701A75', '#E879F9', '#BE185D'],

    // Electric - high contrast vibrant colors
    ['#4C1D95', '#8B5CF6', '#2563EB', '#6D28D9', '#A855F7'],

    // Earth tones - more varied browns and ambers
    ['#78350F', '#F59E0B', '#92400E', '#FBBF24', '#B45309'],

    // New: Jewel tones
    ['#1E40AF', '#BE185D', '#047857', '#7E22CE', '#B45309'],

    // New: Pastel
    ['#93C5FD', '#C4B5FD', '#A7F3D0', '#FED7AA', '#FBCFE8'],

    // New: Monochromatic blue with strong contrast
    ['#1E3A8A', '#3B82F6', '#93C5FD', '#DBEAFE', '#0C4A6E'],

    // New: Autumn
    ['#B45309', '#CA8A04', '#15803D', '#7F1D1D', '#4B5563'],
];

// Safe default color
const DEFAULT_COLOR = '#3B82F6';

// Define props with Vue 3 type-based declaration
const props = withDefaults(defineProps<{
    blobCount?: number;
    minSize?: number;
    maxSize?: number;
    minDuration?: number;
    maxDuration?: number;
    blur?: number;
    colors?: string[];
    useRandomPalette?: boolean;
}>(), {
    blobCount: 10,
    minSize: 100,
    maxSize: 400,
    minDuration: 20,
    maxDuration: 40,
    blur: 60,
    colors: () => [],
    useRandomPalette: true
})

// The active color palette
const activePalette = ref<string[]>([]);

// Select a random palette or use the provided one
const selectColorPalette = () => {
    // Always make sure we have a default
    const defaultPalette = DEFAULT_COLOR_PALETTES[0];

    if (props.useRandomPalette && (!props.colors || props.colors.length === 0)) {
        // Choose a random palette from predefined options
        const randomIndex = Math.floor(Math.random() * DEFAULT_COLOR_PALETTES.length);
        activePalette.value = [...(DEFAULT_COLOR_PALETTES[randomIndex] as string[])];
    } else if (props.colors && props.colors.length > 0) {
        // Use provided colors if they exist
        activePalette.value = [...props.colors];
    } else {
        // Fallback to default palette
        activePalette.value = [...(defaultPalette as string[])];
    }
}

const blobs = ref<BlobItem[]>([]);
const animationFrameId = ref<number | null>(null);

const generateRandomBlob = (): BlobItem => {
    // Safety check - ensure we have colors
    if (activePalette.value.length === 0) {
        activePalette.value = [...(DEFAULT_COLOR_PALETTES[0] as string[])];
    }

    // Get a random color from our palette with fallback
    const colorIndex = Math.floor(Math.random() * activePalette.value.length);
    const randomColor = activePalette.value[colorIndex] || DEFAULT_COLOR;

    return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (props.maxSize - props.minSize) + props.minSize,
        color: randomColor,
        opacity: Math.random() * 0.4 + 0.2, // Between 0.2 and 0.6
        duration: Math.random() * (props.maxDuration - props.minDuration) + props.minDuration,
        delay: Math.random() * 10 // Stagger the animations
    }
}

const initBlobs = () => {
    // Select color palette first
    selectColorPalette();
    // Then create blobs with the selected palette
    blobs.value = Array(props.blobCount).fill(null).map(() => generateRandomBlob());
}

const animateBlobs = () => {
    blobs.value = blobs.value.map(blob => {
        // Occasionally update the blob's direction
        if (Math.random() > 0.995) {
            return {
                ...blob,
                x: Math.random() * 100,
                y: Math.random() * 100
            }
        }
        return blob
    })

    animationFrameId.value = requestAnimationFrame(animateBlobs);
}

onMounted(() => {
    initBlobs();
    animationFrameId.value = requestAnimationFrame(animateBlobs);
})

onBeforeUnmount(() => {
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value);
    }
})
</script>

<style scoped>
.animated-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: -1;
}

.blob {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: float 30s ease-in-out infinite;
    transition: left 30s ease-in-out, top 30s ease-in-out;
}

@keyframes float {
    0% {
        transform: translate(-50%, -50%) scale(1);
    }

    50% {
        transform: translate(-50%, -50%) scale(1.2);
    }

    100% {
        transform: translate(-50%, -50%) scale(1);
    }
}
</style>