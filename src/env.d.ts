export { }

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare global {
  interface Window {
    api: {
      getAppInfo: () => Promise<{ name: string; offline: boolean }>
      login: (nrp: string) => Promise<{ success: boolean; message?: string; personnel?: { id: number; nrp: string; nama: string; pangkat: string | null } }>
      getPersonnelCount: () => Promise<number>
      getPersonnelSummary: () => Promise<{ total: number; perwira: number; bintara: number; tamtama: number }>
      getPersonnelList: (params: Record<string, unknown>) => Promise<{ items: Array<Record<string, any>>; total: number; page: number; pageSize: number; totalPages: number }>
      importExcel: () => Promise<{ canceled?: boolean; totalRows?: number; successRows?: number; failedRows?: number }>
      createPersonnel: (input: Record<string, unknown>) => Promise<{ id: number }>
      generateReport: (input: Record<string, unknown>) => Promise<{ fileName: string; filePath: string }>
      getLatestActivities: (limit?: number) => Promise<Array<{ id: number; type: string; title: string; description: string; performedBy: string; createdAt: string }>>
      getAllActivities: () => Promise<Array<{ id: number; type: string; title: string; description: string; performedBy: string; createdAt: string }>>
    }
  }
}
