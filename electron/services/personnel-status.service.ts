import type { PrismaClient } from '@prisma/client'
import { logActivity } from './activity-log.service'
import { generateKekuatan, generateLapkuat } from './report-calculation.service'

const attendanceStatusValues = new Set([
  'DSPP_TOP',
  'NYATA',
  'BP',
  'PENUGASAN',
  'CUTI',
  'SAKIT',
  'TAHANAN',
  'LARI',
  'LAIN_LAIN',
  'JAGA',
  'TUGAS_DAPUR',
  'DIRAWAT',
  'DIHUKUM',
  'PIKET',
  'ISTIRAHAT'
])

const readinessValues = new Set(['SIAP', 'TIDAK_SIAP'])
const notReadyAttendanceValues = new Set(['JAGA', 'TUGAS_DAPUR', 'DIRAWAT', 'DIHUKUM', 'PIKET', 'ISTIRAHAT'])
const perwiraRanks = new Set(['JENDERAL', 'LETJEN', 'MAYJEN', 'BRIGJEN', 'KOLONEL', 'LETKOL', 'MAYOR', 'KAPTEN', 'LETTU', 'LETDA'])
const bintaraRanks = new Set(['PELTU', 'PELDA', 'SERMA', 'SERKA', 'SERTU', 'SERDA'])
const tamtamaRanks = new Set(['KOPKA', 'KOPTU', 'KOPDA', 'PRAKA', 'PRATU', 'PRADA'])

function todayKey() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function normalizeEnumValue(value: unknown) {
  return String(value || '').trim().toUpperCase()
}

function inferKategoriPangkat(pangkat: unknown) {
  const rank = String(pangkat || '').trim().toUpperCase().split(/\s+/)[0]
  if (perwiraRanks.has(rank)) return 'PERWIRA'
  if (bintaraRanks.has(rank)) return 'BINTARA'
  if (tamtamaRanks.has(rank)) return 'TAMTAMA'
  return null
}

export async function getPersonnelStatusEditor(prisma: PrismaClient, personnelId: number) {
  const personnel = await prisma.personnel.findUnique({
    where: { id: personnelId },
    select: {
      id: true,
      nama: true,
      pangkat: true,
      nrp: true,
      korps: true,
      jabatan: true,
      satminkal: true,
      brigade: true,
      satuan: true,
      subSatuan: true
    }
  })
  if (!personnel) throw new Error('Data personel tidak ditemukan.')

  const latestStatus = await prisma.personnelStatus.findFirst({
    where: { personnelId },
    orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      tanggal: true,
      statusAbsen: true,
      statusKesiapan: true,
      statusBP: true,
      keterangan: true
    }
  })

  return { personnel, latestStatus }
}

export async function updatePersonnelStatus(
  prisma: PrismaClient,
  personnelId: number,
  input: { statusAbsen?: unknown; statusKesiapan?: unknown }
) {
  const statusAbsen = normalizeEnumValue(input.statusAbsen)
  let statusKesiapan = normalizeEnumValue(input.statusKesiapan)

  if (!attendanceStatusValues.has(statusAbsen)) throw new Error('Status kehadiran tidak valid.')
  if (!readinessValues.has(statusKesiapan)) throw new Error('Status kesiapan tidak valid.')
  if (notReadyAttendanceValues.has(statusAbsen)) statusKesiapan = 'TIDAK_SIAP'

  const personnel = await prisma.personnel.findUnique({
    where: { id: personnelId },
    select: { id: true, nama: true, pangkat: true, kategoriPangkat: true }
  })
  if (!personnel) throw new Error('Data personel tidak ditemukan.')

  if (!String(personnel.kategoriPangkat || '').trim()) {
    const kategoriPangkat = inferKategoriPangkat(personnel.pangkat)
    if (kategoriPangkat) await prisma.personnel.update({ where: { id: personnelId }, data: { kategoriPangkat } })
  }

  const tanggal = todayKey()
  const status = await prisma.personnelStatus.upsert({
    where: { personnelId_tanggal: { personnelId, tanggal } },
    create: {
      personnelId,
      tanggal,
      statusAbsen,
      statusKesiapan,
      statusBP: statusAbsen === 'BP' ? 'BP' : null
    },
    update: {
      statusAbsen,
      statusKesiapan,
      statusBP: statusAbsen === 'BP' ? 'BP' : null
    }
  })

  await logActivity(prisma, {
    type: 'SUCCESS',
    title: 'Personnel Status Updated',
    description: `Status ${personnel.nama} diperbarui`,
    performedBy: 'Operator',
    metadata: { personnelId, statusAbsen, statusKesiapan }
  })

  try {
    await generateLapkuat(prisma)
    await generateKekuatan(prisma)
  } catch (error) {
    console.error('Report recalculation failed after personnel status update:', error)
  }

  return { status }
}
