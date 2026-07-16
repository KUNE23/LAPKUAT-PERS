import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import PizZip from 'pizzip'
import type { PrismaClient } from '@prisma/client'

const templates: Record<string, string> = { 'Laporan Kekuatan (Lapkuat)': 'PRINT OUT LAPKUAT.docx', 'Kekuatan Brigif': 'KEKUATAN BRIGIF.docx', 'Sat Pengganti': 'SAT PENGGANTI.docx', 'Dinamika Brigif Gugur': 'DINAMIKA BRIGIF GUGUR.docx', 'Dinamika Brigif Ganti': 'DINAMIKA BRIGIF GATI.docx' }

function resolveTemplatePath(type: string) {
  const fileName = templates[type]
  if (!fileName) throw new Error(`Jenis laporan tidak dikenal: ${type}`)
  const roots = app.isPackaged
    ? [app.getAppPath(), process.resourcesPath]
    : [process.cwd(), app.getAppPath(), path.resolve(__dirname, '../..')]
  const candidates = roots.map((root) => path.join(root, 'dataset', fileName))
  const templatePath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!templatePath) throw new Error(`Template laporan tidak ditemukan: ${fileName}. Letakkan file tersebut di folder dataset.`)
  return templatePath
}

function xmlEscape(value: unknown) {
  return String(value ?? 0).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function replaceCellText(cell: string, value: unknown) {
  let replaced = false
  return cell.replace(/<w:t(?:\s[^>]*)?>.*?<\/w:t>/g, (_match) => {
    if (replaced) return ''
    replaced = true
    return `<w:t>${xmlEscape(value)}</w:t>`
  })
}

function cellText(cell: string) {
  return [...cell.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((match) => match[1]).join('').trim()
}

function populateLapkuatTable(xml: string, reportData: any) {
  const groups = [reportData?.pa || {}, reportData?.ba || {}, reportData?.ta || {}]
  const totalAbsent = groups.map((group) => Object.values(group.absentByStatus || {}).reduce((sum: number, value) => sum + Number(value || 0), 0))
  const rows: Record<string, (group: any, index: number) => number> = {
    'DSPP/TOP': (group) => Number(group.dsppTop || 0),
    'NYATA': (group) => Number(group.nyata || 0),
    'B/P': (group) => Number(group.bp || 0),
    'JUMLAH NYATA+BP': (group) => Number(group.nyata || 0) + Number(group.bp || 0),
    'JUMLAH TIDAK HADIR': (_group, index) => totalAbsent[index] ?? 0,
    'HADIR UTK TUGAS': (group) => Number(group.hadir || 0),
    'JUMLAH TIDAK SIAP OPERASI/LATIHAN': (group) => Number(group.tidakSiap || 0),
    'SIAP UNTUK TUGAS OPERASI/LATIHAN': (group) => Number(group.siap || 0)
  }
  const absentLabels = ['PENUGASAN', 'CUTI', 'SAKIT', 'TAHANAN', 'LARI', 'LAIN-LAIN']
  const readinessLabels = ['JAGA', 'TUGAS DAPUR', 'DIRAWAT', 'DIHUKUM', 'PIKET', 'ISTIRAHAT', 'LAIN-LAIN']
  for (const label of absentLabels) rows[label] = (group) => Number(group.absentByStatus?.[label] || 0)
  for (const label of readinessLabels) rows[label] = (group) => Number(group.tidakSiapByStatus?.[label] || 0)
  const tables = xml.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g) || []
  if (!tables.length) return xml
  const firstTableXml = tables[0]!
  const firstTable = firstTableXml.replace(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g, (row) => {
    const cells = [...row.matchAll(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g)].map((match) => match[0])
    const text = cells.map(cellText).join(' ').toUpperCase()
    const label = Object.keys(rows).sort((a, b) => b.length - a.length).find((key) => text.includes(key))
    if (!label) return row
    const valueCells = cells.length >= 7 ? [4, 5, 6] : [3, 4, 5]
    const updated = cells.map((cell, index) => valueCells.includes(index) ? replaceCellText(cell, rows[label](groups[valueCells.indexOf(index)], valueCells.indexOf(index))) : cell)
    let cursor = 0
    return row.replace(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g, () => updated[cursor++])
  })
  return xml.replace(firstTableXml, firstTable)
}

function populateKekuatanTable(xml: string, reportData: any) {
  const tables = xml.match(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g) || []
  if (tables.length < 2) return xml
  const rankCounts = reportData?.pangkat || {}
  const rankUnits = reportData?.pangkatSatuan || {}
  const groups: Record<string, any> = { PERWIRA: reportData?.pa, BINTARA: reportData?.ba, TAMTAMA: reportData?.ta }
  const rankValue = (label: string) => { const key = Object.keys(rankCounts).find((candidate) => candidate === label || candidate.startsWith(`${label} `)); return Number(key ? rankCounts[key] : 0) }
  let category = ''
  const secondTableXml = tables[1]!
  const secondTable = secondTableXml.replace(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g, (row) => {
    const cells = [...row.matchAll(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g)].map((match) => match[0])
    const text = cells.map(cellText).join(' ').toUpperCase()
    const categoryLabel = Object.keys(groups).find((key) => text.includes(key))
    if (categoryLabel) category = categoryLabel
    const rankLabels = ['LETKOL', 'MAYOR', 'KAPTEN', 'LETTU', 'LETDA', 'PELTU', 'PELDA', 'SERMA', 'SERKA', 'SERTU', 'SERDA', 'KOPKA', 'KOPTU', 'KOPDA', 'PRAKA', 'PRATU', 'PRADA']
    const rank = rankLabels.find((label) => text.includes(label))
    const updates: Record<number, unknown> = {}
    if (rank) { const rankKey = Object.keys(rankCounts).find((candidate) => candidate === rank || candidate.startsWith(`${rank} `)) || ''; const units = rankUnits[rankKey] || {}; const aliases = ['MAYON', 'KIMA', 'KI A', 'KI B', 'KI C', 'KIBAN', 'SAT-SAT B/P']; for (let index = 0; index < aliases.length; index++) { const unit = Object.keys(units).find((candidate) => candidate.includes(aliases[index])); updates[4 + index] = unit ? units[unit] : 0 } updates[11] = rankValue(rank) }
    if (text.includes('JUMLAH') && category) { const aliases = ['MAYON', 'KIMA', 'KI A', 'KI B', 'KI C', 'KIBAN', 'SAT-SAT B/P']; const categoryUnits = (Object.values(rankUnits) as Array<Record<string, number>>).reduce((result: Record<string, number>, units) => { for (const [unit, count] of Object.entries(units)) { const alias = aliases.find((item) => unit.includes(item)); if (alias) result[alias] = (result[alias] || 0) + Number(count || 0) } return result }, {}); aliases.forEach((alias, index) => { updates[4 + index] = categoryUnits[alias] || 0 }); updates[11] = Number(groups[category]?.nyata || 0) }
    if (!Object.keys(updates).length) return row
    const updated = cells.map((cell, index) => updates[index] === undefined ? cell : replaceCellText(cell, updates[index]))
    let cursor = 0
    return row.replace(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g, () => updated[cursor++])
  })
  return xml.replace(secondTableXml, secondTable)
}

export async function generateReport(_prisma: PrismaClient, type: string, options: { location?: string; date?: string; reportData?: unknown }) {
  const templatePath = resolveTemplatePath(type)
  const outputDir = path.join(app.isPackaged ? app.getPath('userData') : process.cwd(), 'output', 'reports')
  await fsPromises.mkdir(outputDir, { recursive: true })
  const fileName = `${type.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}.docx`
  const outputPath = path.join(outputDir, fileName)
  const zip = new PizZip(fs.readFileSync(templatePath))
  let xml = zip.file('word/document.xml')?.asText() || ''
  xml = xml.replace('TANGGAL : ', `TANGGAL : ${options.date || new Date().toLocaleDateString('id-ID')} `).replace('LOKASI SEKARANG : ', `LOKASI SEKARANG : ${options.location || '—'} `)
  if (options.reportData && (type === 'Laporan Kekuatan (Lapkuat)' || type === 'Kekuatan Brigif')) { xml = populateLapkuatTable(xml, options.reportData); xml = populateKekuatanTable(xml, options.reportData) }
  zip.file('word/document.xml', xml)
  await fsPromises.writeFile(outputPath, zip.generate({ type: 'nodebuffer' }))
  return { fileName, filePath: outputPath }
}
