import type { User } from '../types'

export async function login(nrp: string): Promise<{ success: boolean; message?: string; personnel?: User }> {
  return window.api.login(nrp)
}
