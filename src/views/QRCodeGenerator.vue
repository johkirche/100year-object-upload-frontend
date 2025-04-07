<template>
  <div class="min-h-screen p-4 sm:p-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">QR Code Login Generator</h1>

      <div class="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 class="text-xl font-semibold mb-4">Create Auto-Login QR Code</h2>

        <form @submit.prevent="generateQRCode" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              {{ isUsernameLogin ? 'Benutzername' : 'Username (Email)' }}
            </label>
            <Input id="username" v-model="username" :type="isUsernameLogin ? 'text' : 'email'" required
              :placeholder="isUsernameLogin ? 'Benutzername eingeben' : 'E-Mail eingeben'" />
            <div v-if="isUsernameLogin" class="text-xs text-gray-500 mt-1">
              {{ defaultEmailDomain ? `@${defaultEmailDomain} wird automatisch ergänzt` : '' }}
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input id="password" v-model="password" type="password" required placeholder="Enter user password" />
          </div>

          <div class="pt-2">
            <Button type="submit" class="w-full">Generate QR Code</Button>
          </div>
        </form>
      </div>

      <div v-if="qrCodeUrl" class="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 class="text-xl font-semibold mb-4">Generated QR Code</h2>

        <div class="mb-4">
          <qrcode-vue :value="qrCodeUrl" :size="200" level="H" class="mx-auto" />
        </div>

        <div class="mb-4 text-sm bg-gray-100 p-3 rounded overflow-x-auto">
          <code>{{ qrCodeUrl }}</code>
        </div>

        <div class="flex space-x-2">
          <Button @click="copyToClipboard" variant="outline" class="flex-1">
            Copy Link
          </Button>
          <Button @click="downloadQRCode" variant="outline" class="flex-1">
            Download QR Code
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast/use-toast'
import QrcodeVue from 'qrcode.vue'
import CryptoJS from 'crypto-js'

const { toast } = useToast()

const username = ref('')
const password = ref('')
const qrCodeUrl = ref('')

// Username to email feature settings
const isUsernameLogin = computed(() => import.meta.env.VITE_ENABLE_USERNAME_TO_EMAIL === 'true')
const defaultEmailDomain = computed(() => import.meta.env.VITE_DEFAULT_EMAIL_DOMAIN || '')

// Secret key for encryption - in a real app, this should be stored securely
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'default-secret-key'

// Get the base URL of the application
const baseUrl = window.location.origin

function generateQRCode() {
  if (!username.value || !password.value) {
    toast({
      title: 'Error',
      description: 'Please enter both username and password',
      variant: 'destructive'
    })
    return
  }

  try {
    // Create credentials object
    const credentials = {
      username: username.value,
      password: password.value
    }

    // Encrypt the credentials
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(credentials),
      SECRET_KEY
    ).toString()

    // Create the auto-login URL
    qrCodeUrl.value = `${baseUrl}/autologin?code=${encodeURIComponent(encrypted)}`

    toast({
      title: 'Success',
      description: 'QR code generated successfully'
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    toast({
      title: 'Error',
      description: 'Failed to generate QR code',
      variant: 'destructive'
    })
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(qrCodeUrl.value)
    .then(() => {
      toast({
        title: 'Copied',
        description: 'Link copied to clipboard'
      })
    })
    .catch(err => {
      console.error('Failed to copy:', err)
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    })
}

function downloadQRCode() {
  const canvas = document.querySelector('canvas')
  if (!canvas) {
    toast({
      title: 'Error',
      description: 'QR code canvas not found',
      variant: 'destructive'
    })
    return
  }

  const link = document.createElement('a')
  link.download = 'autologin-qrcode.png'
  link.href = canvas.toDataURL('image/png')
  link.click()

  toast({
    title: 'Downloaded',
    description: 'QR code downloaded successfully'
  })
}
</script>
