<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <Alert variant="destructive" v-if="error">
        <AlertCircle class="w-4 h-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
        {{ error }}
        </AlertDescription>
    </Alert>
      <Form @submit="handleSubmit" class="mt-8 space-y-6">
        <div class="space-y-4">
          <FormField name="username" v-slot="{ field }">
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input 
                  v-model="username" 
                  type="text" 
                  required 
                  autocomplete="username" 
                  placeholder="Username" 
                />
              </FormControl>
            </FormItem>
          </FormField>

          <FormField name="password" v-slot="{ field }">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input 
                  v-model="password" 
                  type="password" 
                  required 
                  autocomplete="current-password" 
                  placeholder="Password" 
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <div>
          <Button type="submit" class="w-full">Sign in</Button>
        </div>
      </Form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
const error = ref('')

const handleSubmit = () => {
  error.value = ''
  
  if (authStore.login(username.value, password.value)) {
    router.push('/')
  } else {
    error.value = 'Invalid username or password'
  }
}
</script> 