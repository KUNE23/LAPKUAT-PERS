<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppIcon from '../../components/base/AppIcon.vue'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const { showToast } = useToast()
const loading = ref(false)
const generating = ref(false)
const error = ref('')
const reportType = ref('lapkuat')
const report = ref<Record<string, any> | null>(null)
const generatedDate = ref('')

const reportName = computed(() => reportType.value === 'kekuatan' ? 'KEKUATAN BRIGIF' : reportType.value === 'satPengganti' ? 'SAT PENGGANTI' : 'LAPORAN KEKUATAN (LAPKUAT)')
const groups = computed(() => report.value ? ['pa', 'ba', 'ta'].map((key) => report.value?.[key] || {}) : [])
const rows = computed(() => { const keys = new Set<string>(); groups.value.forEach((group) => Object.keys(group).forEach((key) => keys.add(key))); return [...keys].filter((key) => !['generatedAt', 'total', 'tidakSiapByStatus', 'absentByStatus'].includes(key)) })
const totalPersonnel = computed(() => Number(report.value?.total || 0))
const readyPersonnel = computed(() => groups.value.reduce((sum, group) => sum + Number(group.siap || 0), 0))
const notReadyPersonnel = computed(() => Math.max(totalPersonnel.value - readyPersonnel.value, 0))
const reportStatus = computed(() => error.value ? 'Calculation Error' : loading.value ? 'Need Refresh' : report.value ? 'Data Valid' : 'Need Refresh')

async function refresh() {
  loading.value = true; error.value = ''
  try { report.value = await window.api.calculateReport(reportType.value); generatedDate.value = new Date().toLocaleString('id-ID') }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Kalkulasi laporan gagal.'; showToast(error.value, 'error') }
  finally { loading.value = false }
}
async function generateDocx() {
  generating.value = true
  try { const names: Record<string, string> = { lapkuat: 'Laporan Kekuatan (Lapkuat)', kekuatan: 'Kekuatan Brigif', satPengganti: 'Sat Pengganti' }; const result = await window.api.generateReport({ type: names[reportType.value], date: new Date().toLocaleDateString('id-ID') }); showToast(`Laporan berhasil dibuat: ${result.fileName}`) }
  catch (cause) { showToast(cause instanceof Error ? cause.message : 'Generate laporan gagal.', 'error') }
  finally { generating.value = false }
}
onMounted(refresh)
</script>

<template><div class="report-page"><div class="report-page-top"><button class="back-button" @click="router.back()">‹ Kembali</button><select v-model="reportType" class="filter-select" @change="refresh"><option value="lapkuat">LAPKUAT</option><option value="kekuatan">KEKUATAN BRIGIF</option><option value="satPengganti">SAT PENGGANTI</option></select></div><header class="report-official-header"><span class="report-kicker">SISTEM INFORMASI ADMINISTRASI PERSONEL SATGAS</span><h2>{{ reportName }}</h2><p>VERIFIKASI PERHITUNGAN KEKUATAN PERSONEL</p></header><section class="report-info-panel panel"><div><span>REPORT NAME</span><b>{{ reportName }}</b></div><div><span>REPORT TYPE</span><b>{{ reportType === 'lapkuat' ? 'Laporan Kekuatan' : reportType === 'kekuatan' ? 'Rekapitulasi Kekuatan Brigif' : 'Satuan Pengganti' }}</b></div><div><span>MILITARY UNIT</span><b>BRIGIF 1 / TNI AD</b></div><div><span>GENERATED</span><b>{{ generatedDate || '—' }}</b></div><div><span>OPERATOR</span><b>{{ auth.user?.nama || 'Operator' }}</b></div><div><span>PERSONNEL</span><b>{{ totalPersonnel }}</b></div><div><span>SOURCE</span><b><AppIcon name="database" :size="14" /> SQLite</b></div><div><span>STATUS</span><strong :class="['report-status', reportStatus.toLowerCase().replace(/ /g, '-')]">{{ reportStatus === 'Data Valid' ? '✓' : reportStatus === 'Calculation Error' ? '✕' : '⚠' }} {{ reportStatus }}</strong></div></section><section class="report-summary-cards"><article><span>Total Personnel</span><strong>{{ totalPersonnel }}</strong></article><article><span>Ready Personnel</span><strong>{{ readyPersonnel }}</strong></article><article><span>Not Ready</span><strong>{{ notReadyPersonnel }}</strong></article><article><span>Last Refresh</span><strong>{{ generatedDate ? generatedDate.split(' ').slice(-2).join(' ') : '—' }}</strong></article></section><section v-if="loading" class="panel validation-state"><AppIcon name="reports" :size="24" /><b>Menghitung data dari SQLite...</b></section><section v-else-if="error" class="panel validation-state error"><AppIcon name="alert" :size="24" /><b>{{ error }}</b><button class="outline" @click="refresh">Coba Lagi</button></section><section v-else-if="report && reportType !== 'satPengganti'" class="panel report-preview-table"><div class="preview-title">{{ reportName }}</div><table><thead><tr><th>URAIAN</th><th>PERWIRA (PA)</th><th>BINTARA (BA)</th><th>TAMTAMA (TA)</th></tr></thead><tbody><tr v-for="row in rows" :key="row"><td>{{ row.replace(/([A-Z])/g, ' $1').trim().toUpperCase() }}</td><td>{{ groups[0][row] ?? 0 }}</td><td>{{ groups[1][row] ?? 0 }}</td><td>{{ groups[2][row] ?? 0 }}</td></tr></tbody></table></section><section v-else-if="report" class="panel report-preview-table"><div class="preview-title">SAT PENGGANTI</div><table><thead><tr><th>JENIS PENUGASAN</th><th>JUMLAH</th></tr></thead><tbody><tr v-for="(value,key) in report.byJenis" :key="key"><td>{{ key }}</td><td>{{ value }}</td></tr><tr v-if="!Object.keys(report.byJenis || {}).length"><td colspan="2">Belum ada penugasan pengganti.</td></tr></tbody></table></section><div class="report-preview-actions"><button class="outline" :disabled="loading || generating" @click="refresh"><AppIcon name="reports" :size="15" /> Refresh Data</button><button class="primary" :disabled="loading || generating || !report" @click="generateDocx"><AppIcon name="save" :size="15" /> {{ generating ? 'Membuat...' : 'Generate DOCX' }}</button></div></div></template>
