import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/ui'

export function useToast() {
  const store = useUiStore(); const { toast, toastType } = storeToRefs(store)
  return { toast, toastType, showToast: store.showToast }
}
