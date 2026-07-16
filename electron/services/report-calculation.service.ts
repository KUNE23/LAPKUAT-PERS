import type { PrismaClient } from '@prisma/client'

export type ReportGroup = 'pa' | 'ba' | 'ta'
export interface GroupReportStats { dsppTop: number; nyata: number; bp: number; hadir: number; siap: number; tidakSiap: number; tidakSiapByStatus: Record<string, number>; absentByStatus: Record<string, number> }
export interface LapkuatReport { generatedAt: string; total: number; pa: GroupReportStats; ba: GroupReportStats; ta: GroupReportStats; absent: Record<string, number> }
export interface KekuatanReport extends LapkuatReport { pangkat: Record<string, number>; pangkatSatuan: Record<string, Record<string, number>> }
export interface SatPenggantiReport { generatedAt: string; total: number; byJenis: Record<string, number>; personnelIds: number[] }

const categoryMap: Record<string, ReportGroup> = { PERWIRA: 'pa', PA: 'pa', BINTARA: 'ba', BA: 'ba', TAMTAMA: 'ta', TA: 'ta' }
const absentStatuses = new Set(['SAKIT', 'CUTI', 'TAHANAN', 'LARI', 'PENUGASAN', 'LAIN-LAIN', 'DIRAWAT', 'TIDAK HADIR'])
const readyStatuses = new Set(['SIAP', 'READY', 'SIAP OPERASI', 'SIAP UNTUK TUGAS OPERASI/LATIHAN'])
const bpStatuses = new Set(['BP', 'YA', 'YES', 'TRUE', '1'])
const statusLabels: Record<string, string> = { DSPP_TOP: 'DSPP/TOP', LAIN_LAIN: 'LAIN-LAIN', TUGAS_DAPUR: 'TUGAS DAPUR', TIDAK_SIAP: 'TIDAK SIAP' }
const notReadyAttendanceStatuses = new Set(['JAGA', 'TUGAS DAPUR', 'DIRAWAT', 'DIHUKUM', 'PIKET', 'ISTIRAHAT', 'LAIN-LAIN'])

function normalizeStatus(value: unknown) {
  const raw = String(value || '').trim().toUpperCase()
  return statusLabels[raw] || raw
}

type Snapshot = Awaited<ReturnType<typeof loadSnapshot>>
async function loadSnapshot(prisma: PrismaClient) {
  const personnel = await prisma.personnel.findMany({ select: { id: true, kategoriPangkat: true, pangkat: true, satuan: true, subSatuan: true } })
  const personnelIds = new Set(personnel.map((person) => person.id))
  const statuses = personnelIds.size ? await prisma.personnelStatus.findMany({ orderBy: [{ tanggal: 'desc' }, { id: 'desc' }], select: { personnelId: true, statusAbsen: true, statusKesiapan: true, statusBP: true } }) : []
  const latestStatus = new Map<number, (typeof statuses)[number]>()
  for (const status of statuses) if (personnelIds.has(status.personnelId) && !latestStatus.has(status.personnelId)) latestStatus.set(status.personnelId, status)
  return { personnel, latestStatus }
}

function calculateGroups(snapshot: Snapshot) {
  const groups: Record<ReportGroup, GroupReportStats> = { pa: { dsppTop: 0, nyata: 0, bp: 0, hadir: 0, siap: 0, tidakSiap: 0, tidakSiapByStatus: {}, absentByStatus: {} }, ba: { dsppTop: 0, nyata: 0, bp: 0, hadir: 0, siap: 0, tidakSiap: 0, tidakSiapByStatus: {}, absentByStatus: {} }, ta: { dsppTop: 0, nyata: 0, bp: 0, hadir: 0, siap: 0, tidakSiap: 0, tidakSiapByStatus: {}, absentByStatus: {} } }
  const absent: Record<string, number> = {}
  for (const person of snapshot.personnel) {
    const group = categoryMap[String(person.kategoriPangkat || '').trim().toUpperCase()]
    if (!group) continue
    const stats = groups[group]; stats.nyata++
    const status = snapshot.latestStatus.get(person.id); const absence = normalizeStatus(status?.statusAbsen); const readiness = normalizeStatus(status?.statusKesiapan); const bp = normalizeStatus(status?.statusBP)
    if (absence === 'DSPP/TOP') stats.dsppTop++
    if (bpStatuses.has(bp)) stats.bp++
    if (absence && absentStatuses.has(absence)) { absent[absence] = (absent[absence] || 0) + 1; stats.absentByStatus[absence] = (stats.absentByStatus[absence] || 0) + 1 }
    else stats.hadir++
    if (readyStatuses.has(readiness)) stats.siap++
    else { stats.tidakSiap++; const key = notReadyAttendanceStatuses.has(absence) ? absence : readiness || 'LAIN-LAIN'; stats.tidakSiapByStatus[key] = (stats.tidakSiapByStatus[key] || 0) + 1 }
  }
  return { groups, absent }
}

export async function generateLapkuat(prisma: PrismaClient): Promise<LapkuatReport> {
  const snapshot = await loadSnapshot(prisma); const calculated = calculateGroups(snapshot)
  return { generatedAt: new Date().toISOString(), total: snapshot.personnel.length, pa: calculated.groups.pa, ba: calculated.groups.ba, ta: calculated.groups.ta, absent: calculated.absent }
}

export async function generateKekuatan(prisma: PrismaClient): Promise<KekuatanReport> {
  const snapshot = await loadSnapshot(prisma); const calculated = calculateGroups(snapshot); const pangkat: Record<string, number> = {}; const pangkatSatuan: Record<string, Record<string, number>> = {}
  for (const person of snapshot.personnel) { const rank = String(person.pangkat || '').trim().toUpperCase(); if (!rank) continue; pangkat[rank] = (pangkat[rank] || 0) + 1; const unit = String(person.subSatuan || person.satuan || '').trim().toUpperCase() || 'SAT-SAT B/P'; pangkatSatuan[rank] ||= {}; pangkatSatuan[rank][unit] = (pangkatSatuan[rank][unit] || 0) + 1 }
  return { generatedAt: new Date().toISOString(), total: snapshot.personnel.length, pa: calculated.groups.pa, ba: calculated.groups.ba, ta: calculated.groups.ta, absent: calculated.absent, pangkat, pangkatSatuan }
}

export async function generateSatPengganti(prisma: PrismaClient): Promise<SatPenggantiReport> {
  const assignments = await prisma.personnelAssignment.findMany({ where: { aktif: true, jenisJabatan: { contains: 'PENGGANTI' } }, select: { personnelId: true, jenisJabatan: true } }); const byJenis: Record<string, number> = {}
  for (const assignment of assignments) { const jenis = assignment.jenisJabatan || 'PENGGANTI'; byJenis[jenis] = (byJenis[jenis] || 0) + 1 }
  return { generatedAt: new Date().toISOString(), total: assignments.length, byJenis, personnelIds: assignments.map((item) => item.personnelId) }
}
