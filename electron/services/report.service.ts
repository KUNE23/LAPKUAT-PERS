import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import PizZip from 'pizzip'
import type { PrismaClient } from '@prisma/client'

const templates: Record<string, string> = { 'Laporan Kekuatan (Lapkuat)': 'PRINT OUT LAPKUAT.docx', 'Kekuatan Brigif': 'KEKUATAN BRIGIF.docx', 'Sat Pengganti': 'SAT PENGGANTI.docx', 'Dinamika Brigif Gugur': 'DINAMIKA BRIGIF GUGUR.docx', 'Dinamika Brigif Ganti': 'DINAMIKA BRIGIF GATI.docx' }
export async function generateReport(_prisma: PrismaClient, type: string, options: { location?: string; date?: string }) { const templatePath = path.join(app.isPackaged ? app.getAppPath() : process.cwd(), 'dataset', templates[type]); if (!fs.existsSync(templatePath)) throw new Error('Template laporan tidak ditemukan.'); const outputDir = path.join(app.isPackaged ? app.getPath('userData') : process.cwd(), 'output', 'reports'); await fsPromises.mkdir(outputDir, { recursive: true }); const fileName = `${type.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}.docx`; const outputPath = path.join(outputDir, fileName); const zip = new PizZip(fs.readFileSync(templatePath)); let xml = zip.file('word/document.xml')?.asText() || ''; xml = xml.replace('TANGGAL : ', `TANGGAL : ${options.date || new Date().toLocaleDateString('id-ID')} `).replace('LOKASI SEKARANG : ', `LOKASI SEKARANG : ${options.location || '—'} `); zip.file('word/document.xml', xml); await fsPromises.writeFile(outputPath, zip.generate({ type: 'nodebuffer' })); return { fileName, filePath: outputPath } }
