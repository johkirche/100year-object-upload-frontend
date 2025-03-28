import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  username: string
  isAdmin: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)

  function login(username: string, password: string): boolean {
    const normalUsername = import.meta.env.VITE_NORMAL_USERNAME
    const normalPassword = import.meta.env.VITE_NORMAL_PASSWORD
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

    if (username === normalUsername && password === normalPassword) {
      user.value = {
        username,
        isAdmin: false
      }
      isAuthenticated.value = true
      return true
    } else if (username === adminUsername && password === adminPassword) {
      user.value = {
        username,
        isAdmin: true
      }
      isAuthenticated.value = true
      return true
    }

    return false
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
}) 