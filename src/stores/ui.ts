import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toast = ref('')
  const toastType = ref<'success' | 'error'>('success')
  const loading = ref(false)
  let timer: number | undefined
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast.value = message; toastType.value = type
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => { toast.value = '' }, 3200)
  }
  return { toast, toastType, loading, showToast }
})
