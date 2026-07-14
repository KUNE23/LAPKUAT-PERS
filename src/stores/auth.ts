import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginService } from '../services/authService'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')
  const isAuthenticated = ref(false)

  async function login(nrp: string) {
    loading.value = true; error.value = ''
    try {
      const result = await loginService(nrp)
      if (!result.success || !result.personnel) { error.value = result.message || 'NRP tidak ditemukan.'; return false }
      user.value = result.personnel; isAuthenticated.value = true; return true
    } catch { error.value = 'Database belum siap. Silakan restart aplikasi.'; return false }
    finally { loading.value = false }
  }
  function logout() { user.value = null; isAuthenticated.value = false }
  return { user, loading, error, isAuthenticated, login, logout }
})
