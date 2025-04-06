<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <AnimatedBackground :blobCount="maxBlobCountDependingOnWidth" :minSize="250" :maxSize="500" :minDuration="25" :maxDuration="45" :blur="60"
      :useRandomPalette="true" />
    <Card class="max-w-md w-full relative z-10 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle class="text-2xl font-bold tracking-tight">
          100 Jahre | 100 Objekte
        </CardTitle>
        <CardDescription class="mt-2 text-lg font-bold tracking-tight">
          Formular für die Sammlung von 100 Objekten für die Ausstellung zu 100 Jahre Johannische Kirche
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Alert v-if="authStore.error" variant="destructive">
          <AlertCircle class="w-4 h-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            {{ authStore.error }}
          </AlertDescription>
        </Alert>

        <Form class="space-y-6" @submit="handleSubmit">
          <div class="space-y-4">
            <FormField name="username">
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input v-model="username" type="email" required autocomplete="email" placeholder="E-Mail-Adresse"
                    :disabled="authStore.isLoading" />
                </FormControl>
              </FormItem>
            </FormField>

            <FormField name="password">
              <FormItem>
                <FormLabel>Passwort</FormLabel>
                <FormControl>
                  <Input v-model="password" type="password" required autocomplete="current-password"
                    placeholder="Passwort" :disabled="authStore.isLoading" />
                </FormControl>
              </FormItem>
            </FormField>
          </div>

          <div class="mt-6">
            <Button type="submit" class="w-full" :disabled="authStore.isLoading">
              <span v-if="authStore.isLoading">Anmeldung läuft...</span>
              <span v-else>Anmelden</span>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedBackground } from '@/components/ui/animated-background'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})

const maxBlobCountDependingOnWidth = computed(() => {
  const width = window.innerWidth
  if (width < 640) {
    return 4
  } else if (width < 768) {
    return 5
  } else if (width < 1024) {
    return 8
  } else {
    return 10
  }
})

const handleSubmit = async () => {
  // Call the login method from the auth store
  await authStore.login(username.value, password.value)

  // If login is successful, redirect to home page
  if (authStore.isAuthenticated) {
    router.push('/')
  }
}
</script>
