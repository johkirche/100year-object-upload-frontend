<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <Alert variant="destructive" v-if="authStore.error">
        <AlertCircle class="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
        {{ authStore.error }}
        </AlertDescription>
      </Alert>
      <Form @submit="handleSubmit" class="mt-8 space-y-6">
        <div class="space-y-4">
          <FormField name="username">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  v-model="username" 
                  type="email" 
                  required 
                  autocomplete="email" 
                  placeholder="Email address" 
                  :disabled="authStore.isLoading"
                />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  v-model="password" 
                  type="password" 
                  required 
                  autocomplete="current-password" 
                  placeholder="Password" 
                  :disabled="authStore.isLoading"
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <div>
          <Button type="submit" class="w-full" :disabled="authStore.isLoading">
            <span v-if="authStore.isLoading">Signing in...</span>
            <span v-else>Sign in</span>
          </Button>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormControl, FormItem, FormLabel } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
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