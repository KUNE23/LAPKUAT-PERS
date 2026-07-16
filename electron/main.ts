import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { importPersonnelWorkbook } from './services/import.service'
import { generateReport } from './services/report.service'
import { getAllActivities, getLatestActivities, logActivity } from './services/activity-log.service'
import { generateKekuatan, generateLapkuat, generateSatPengganti } from './services/report-calculation.service'
import { getPersonnelStatusEditor, updatePersonnelStatus } from './services/personnel-status.service'

let prisma: PrismaClient

async function ensureDatabaseSchema(db: PrismaClient) {
  const schemaPath = path.join(app.isPackaged ? app.getAppPath() : process.cwd(), 'prisma', 'init.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')
  for (const statement of sql.split(';').map((item) => item.trim()).filter(Boolean)) if (!statement.toUpperCase().startsWith('PRAGMA')) await db.$executeRawUnsafe(statement)
}
async function ensureDevelopmentSeed(db: PrismaClient) {
  if (app.isPackaged) return
  const admin = await db.$queryRawUnsafe('SELECT COUNT(*) as count FROM "Personnel" WHERE "nrp" = ?', 'ADMIN') as Array<{ count: bigint }>
  if (Number(admin[0]?.count || 0) === 0) await db.$executeRawUnsafe(`INSERT INTO "Personnel" ("nrp","nama","pangkat","kategoriPangkat","korps","jabatan") VALUES ('ADMIN','Administrator Development','KAPTEN','PERWIRA','INF','OPERATOR ADMINISTRATOR')`)
}
function createWindow() { const win = new BrowserWindow({ width: 1440, height: 900, minWidth: 1100, minHeight: 700, webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), contextIsolation: true, nodeIntegration: false } }); if (process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL); else win.loadFile(path.join(__dirname, '../renderer/index.html')) }

app.whenReady().then(async () => {
  const dbPath = path.join(app.getPath('userData'), 'data', 'project-satgas.db'); fs.mkdirSync(path.dirname(dbPath), { recursive: true }); process.env.DATABASE_URL = `file:${dbPath}`; prisma = new PrismaClient(); await ensureDatabaseSchema(prisma); await ensureDevelopmentSeed(prisma)
  ipcMain.handle('app:get-info', () => ({ name: 'SISTEM INFORMASI ADMINISTRASI PERSONEL SATGAS', offline: true }))
  ipcMain.handle('auth:login', async (_event, nrp) => { const value = String(nrp || '').trim(); if (!value) return { success: false, message: 'NRP wajib diisi.' }; const personnel = await prisma.personnel.findFirst({ where: { nrp: value }, select: { id: true, nrp: true, nama: true, pangkat: true } }); if (!personnel) return { success: false, message: 'NRP tidak ditemukan.' }; await logActivity(prisma, { type: 'INFO', title: 'Login', description: `${personnel.nama} berhasil masuk`, performedBy: personnel.nama }); return { success: true, personnel } })
  ipcMain.handle('personnel:summary', () => Promise.all([prisma.personnel.count(), prisma.personnel.count({ where: { kategoriPangkat: 'PERWIRA' } }), prisma.personnel.count({ where: { kategoriPangkat: 'BINTARA' } }), prisma.personnel.count({ where: { kategoriPangkat: 'TAMTAMA' } })]).then(([total, perwira, bintara, tamtama]) => ({ total, perwira, bintara, tamtama })))
  ipcMain.handle('personnel:count', () => prisma.personnel.count())
  ipcMain.handle('personnel:list', async (_event, params = {}) => {
    const page = Math.max(1, Number(params.page) || 1)
    const pageSize = Math.min(100, Math.max(5, Number(params.pageSize) || 20))
    const search = String(params.search || '').trim()
    const rank = String(params.kategoriPangkat || '').trim()
    const where: any = {}
    const conditions: any[] = []
    if (search) conditions.push({ OR: [{ nrp: { contains: search } }, { nama: { contains: search } }] })
    if (rank) conditions.push({ OR: [{ pangkat: { contains: rank } }, { kategoriPangkat: rank }] })
    if (conditions.length) where.AND = conditions
    const [items, total] = await Promise.all([
      prisma.personnel.findMany({ where, orderBy: { nama: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.personnel.count({ where })
    ])
    const ids = items.map((item) => item.id)
    const statuses = ids.length ? await prisma.personnelStatus.findMany({
      where: { personnelId: { in: ids } },
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      select: { personnelId: true, statusAbsen: true, statusKesiapan: true, statusBP: true }
    }) : []
    const latestStatus = new Map<number, (typeof statuses)[number]>()
    for (const status of statuses) if (!latestStatus.has(status.personnelId)) latestStatus.set(status.personnelId, status)
    return {
      items: items.map((item) => {
        const status = latestStatus.get(item.id)
        return {
          ...item,
          statusAbsen: status?.statusAbsen || status?.statusBP || null,
          statusKesiapan: status?.statusKesiapan || null
        }
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  })
  ipcMain.handle('personnel:status-editor', (_event, id) => getPersonnelStatusEditor(prisma, Number(id)))
  ipcMain.handle('personnel:update-status', (_event, id, input) => updatePersonnelStatus(prisma, Number(id), input))
  ipcMain.handle('personnel:create', async (_event, input) => { const created = await (prisma as any).personnel.create({ data: { ...input, nrp: String(input.nrp).trim(), nama: String(input.nama).trim() } }); await logActivity(prisma, { type: 'SUCCESS', title: 'Personnel Added', description: `${created.nama} ditambahkan`, performedBy: 'Operator' }); return { id: created.id } })
  ipcMain.handle('import:excel', async () => { const selected = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }] }); if (selected.canceled || !selected.filePaths[0]) return { canceled: true }; const result = await importPersonnelWorkbook(prisma, selected.filePaths[0]); await logActivity(prisma, { type: 'SUCCESS', title: 'Import Excel', description: `${result.successRows} personel berhasil diimpor`, performedBy: 'Operator' }); return result })
  ipcMain.handle('report:generate', async (_event, input) => { const type = String(input.type || ''); const reportData = type === 'Kekuatan Brigif' || type === 'Laporan Kekuatan (Lapkuat)' ? await generateKekuatan(prisma) : type === 'Sat Pengganti' ? await generateSatPengganti(prisma) : null; const result = await generateReport(prisma, type, { ...input, reportData }); await logActivity(prisma, { type: 'SUCCESS', title: 'Generate Report', description: `${result.fileName} berhasil dibuat`, performedBy: 'Operator' }); return result })
  ipcMain.handle('report:calculate', async (_event, type) => { if (type === 'kekuatan') return generateKekuatan(prisma); if (type === 'satPengganti') return generateSatPengganti(prisma); return generateLapkuat(prisma) })
  ipcMain.handle('activity:latest', (_event, limit) => getLatestActivities(prisma, Number(limit) || 10)); ipcMain.handle('activity:all', () => getAllActivities(prisma)); createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
