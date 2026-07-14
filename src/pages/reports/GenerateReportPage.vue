<script setup lang="ts">
import AppIcon from '../../components/base/AppIcon.vue'
import { useToast } from '../../composables/useToast'
const { showToast } = useToast()
const reports = [
  { name: 'Laporan Kekuatan (Lapkuat)', type: 'Harian', description: 'Laporan kekuatan personel harian mencakup jumlah perwira, bintara, dan tamtama beserta status kesiapan masing-masing golongan.', icon: 'reports', tone: 'green' },
  { name: 'Kekuatan Brigif', type: 'Mingguan', description: 'Rekapitulasi kekuatan Brigade Infanteri secara menyeluruh per satuan organik termasuk satuan bawah.', icon: 'shield', tone: 'blue' },
  { name: 'Sat Pengganti', type: 'Bulanan', description: 'Laporan personel satuan pengganti yang sedang dalam proses rotasi dan penugasan baru ke satuan berbeda.', icon: 'backup', tone: 'purple' },
  { name: 'Dinamika Brigif Gugur', type: 'Insidental', description: 'Laporan dinamika personel kategori gugur dalam tugas, termasuk keterangan resmi dan administrasi yang terkait.', icon: 'alert', tone: 'red' },
  { name: 'Dinamika Brigif Ganti', type: 'Insidental', description: 'Laporan dinamika pergantian personel mencakup mutasi, promosi jabatan, dan penugasan ke satuan lain.', icon: 'reports', tone: 'gold' }
]
async function generate(name: string) { try { const result = await window.api.generateReport({ type: name, date: new Date().toLocaleDateString('id-ID') }); showToast(`Laporan berhasil dibuat: ${result.fileName}`) } catch (error) { showToast(error instanceof Error ? error.message : 'Generate laporan gagal.', 'error') } }
</script>
<template><div class="module-title"><div><h2>Generate Laporan</h2><p>Generate dan export laporan personel ke format DOCX atau PDF.</p></div><button class="outline">◷ &nbsp; Periode: <b>Juli 2026</b></button></div><section class="report-list"><article v-for="report in reports" :key="report.name" :class="['panel','report-row',`report-${report.tone}`]"><span class="report-icon"><AppIcon :name="report.icon" :size="20" /></span><div><h3>{{ report.name }} <em>{{ report.type }}</em></h3><p>{{ report.description }}</p></div><button class="primary" @click="generate(report.name)"><AppIcon name="save" :size="14" /> Generate</button></article></section></template>
