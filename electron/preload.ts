import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  login: (nrp: string) => ipcRenderer.invoke('auth:login', nrp),
  getPersonnelCount: () => ipcRenderer.invoke('personnel:count'),
  getPersonnelSummary: () => ipcRenderer.invoke('personnel:summary'),
  getPersonnelList: (params: Record<string, unknown>) => ipcRenderer.invoke('personnel:list', params),
  getPersonnelStatusEditor: (id: number) => ipcRenderer.invoke('personnel:status-editor', id),
  updatePersonnelStatus: (id: number, input: Record<string, unknown>) => ipcRenderer.invoke('personnel:update-status', id, input),
  importExcel: () => ipcRenderer.invoke('import:excel'),
  createPersonnel: (input: Record<string, unknown>) => ipcRenderer.invoke('personnel:create', input),
  generateReport: (input: Record<string, unknown>) => ipcRenderer.invoke('report:generate', input),
  calculateReport: (type: string) => ipcRenderer.invoke('report:calculate', type),
  getLatestActivities: (limit = 10) => ipcRenderer.invoke('activity:latest', limit),
  getAllActivities: () => ipcRenderer.invoke('activity:all')
})
