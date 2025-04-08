<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import { ShieldCheck, LogOut, FileText, UploadIcon, Search, QrCode } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface MenuItem {
  value: string
  label: string
  icon: any
  action: () => void
  description?: string
  hoverTextColor?: string
  path: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Handle logout
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Navigate to admin objects view
const viewObjects = () => {
  router.push('/admin')
}

// Navigate to similar objects demo
const viewSimilarObjects = () => {
  router.push('/similar')
}

const menuItems: MenuItem[] = [
  {
    value: 'form',
    label: 'Formular',
    icon: UploadIcon,
    action: () => router.push('/'),
    path: '/'
  },
  {
    value: 'objects',
    label: 'Objekt-Tabelle',
    icon: FileText,
    action: viewObjects,
    path: '/admin'
  },
  {
    value: 'similar',
    label: 'Ähnliche Objekte',
    icon: Search,
    action: viewSimilarObjects,
    description: 'Demo',
    path: '/similar'
  },
  {
    value: 'qr',
    label: 'QR Code Generator',
    icon: QrCode,
    action: () => router.push('/qr-generator'),
    path: '/qr-generator'
  },
  {
    value: 'logout',
    label: 'Abmelden',
    hoverTextColor: 'text-red-500',
    icon: LogOut,
    action: handleLogout,
    path: '/logout'
  }
]

// Check if menu item is active
const isItemActive = (item: MenuItem): boolean => {
  if (item.value === 'logout') return false
  return route.path === item.path
}

const [UseTemplate, MenuList] = createReusableTemplate()
const isDesktop = useMediaQuery('(min-width: 768px)')

const isOpen = ref(false)
const selectedItem = ref<MenuItem | null>(null)

function onItemSelect(item: MenuItem) {
  selectedItem.value = item
  isOpen.value = false
  item.action()
}
</script>

<template>
  <div>
    <UseTemplate>
      <Command>
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          <CommandGroup>
            <CommandItem v-for="item of menuItems" :key="item.value" :value="item.value" @select="onItemSelect(item)"
              :class="{ 'bg-accent': isItemActive(item), 'hover:bg-accent hover:cursor-pointer': !isItemActive(item), 'hover:text-red-500': item.hoverTextColor === 'text-red-500' }">
              <div class="flex items-center gap-2">
                <component :is="item.icon" class="h-4 w-4" :class="isItemActive(item) ? 'text-primary' : ''" />
                <div class="flex flex-col items-start">
                  <span :class="isItemActive(item) ? 'font-medium' : ''">{{ item.label }}</span>
                  <span v-if="item.description" class="text-xs text-gray-500">{{ item.description }}</span>
                </div>
              </div>
              <div v-if="isItemActive(item)" class="ml-auto">
                <div class="h-2 w-2 rounded-full bg-primary"></div>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </UseTemplate>

    <Popover v-if="isDesktop" v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button size="icon" class="rounded-full">
          <ShieldCheck class="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-56 p-0" align="end">
        <div class="grid gap-2">
          <MenuList />
        </div>
      </PopoverContent>
    </Popover>

    <Drawer v-else v-model:open="isOpen">
      <DrawerTrigger as-child>
        <Button size="icon" class="rounded-full">
          <ShieldCheck class="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <MenuList />
      </DrawerContent>
    </Drawer>
  </div>
</template>
