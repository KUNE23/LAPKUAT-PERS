<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../../components/base/AppIcon.vue'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)
const personnel = ref<Record<string, any> | null>(null)
const form = ref({ statusAbsen: 'NYATA', statusKesiapan: 'SIAP' })

const attendanceGroups = [
  {
    label: 'Kekuatan',
    options: [
      { value: 'DSPP_TOP', label: 'DSPP/TOP' },
      { value: 'NYATA', label: 'NYATA' },
      { value: 'BP', label: 'B/P' }
    ]
  },
  {
    label: 'Tidak Hadir',
    options: [
      { value: 'PENUGASAN', label: 'PENUGASAN' },
      { value: 'CUTI', label: 'CUTI' },
      { value: 'SAKIT', label: 'SAKIT' },
      { value: 'TAHANAN', label: 'TAHANAN' },
      { value: 'LARI', label: 'LARI' },
      { value: 'LAIN_LAIN', label: 'LAIN-LAIN' }
    ]
  },
  {
    label: 'Tidak Siap Operasi/Latihan',
    options: [
      { value: 'JAGA', label: 'JAGA' },
      { value: 'TUGAS_DAPUR', label: 'TUGAS DAPUR' },
      { value: 'DIRAWAT', label: 'DIRAWAT' },
      { value: 'DIHUKUM', label: 'DIHUKUM' },
      { value: 'PIKET', label: 'PIKET' },
      { value: 'ISTIRAHAT', label: 'ISTIRAHAT' }
    ]
  }
]

const readinessOptions = [
  { value: 'SIAP', label: 'SIAP' },
  { value: 'TIDAK_SIAP', label: 'TIDAK SIAP' }
]
const notReadyAttendanceValues = new Set(['JAGA', 'TUGAS_DAPUR', 'DIRAWAT', 'DIHUKUM', 'PIKET', 'ISTIRAHAT'])

const unit = computed(() => {
  const value = personnel.value?.satminkal || personnel.value?.brigade || personnel.value?.subSatuan || personnel.value?.satuan
  return value || '-'
})

function enumSafe(value: unknown, fallback: string) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\//g, '')
    .replace(/[\s-]+/g, '_')
  return normalized || fallback
}

async function load() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const result = await window.api.getPersonnelStatusEditor(id)
    personnel.value = result.personnel
    form.value.statusAbsen = enumSafe(result.latestStatus?.statusAbsen, 'NYATA')
    form.value.statusKesiapan = enumSafe(result.latestStatus?.statusKesiapan, 'SIAP')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Data personel gagal dimuat.', 'error')
    router.push('/personnel')
  } finally {
    loading.value = false
  }
}

async function submit() {
  const id = Number(route.params.id)
  saving.value = true
  try {
    await window.api.updatePersonnelStatus(id, { ...form.value })
    window.api.calculateReport('lapkuat').catch(() => undefined)
    showToast('Status personel berhasil disimpan.')
    router.push('/personnel')
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Status personel gagal disimpan.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)

watch(() => form.value.statusAbsen, (statusAbsen) => {
  if (notReadyAttendanceValues.has(statusAbsen)) form.value.statusKesiapan = 'TIDAK_SIAP'
})
</script>

<template>
  <div class="module-title">
    <div>
      <h2>Edit Personnel Status</h2>
      <p>Perbarui status kehadiran dan kesiapan personel.</p>
    </div>
    <button class="outline" @click="router.back()">‹ Kembali</button>
  </div>

  <section v-if="loading" class="panel validation-state">
    <AppIcon name="personnel" :size="24" />
    <b>Memuat data personel...</b>
  </section>

  <form v-else-if="personnel" class="personnel-form status-edit-form" @submit.prevent="submit">
    <section class="panel form-panel readonly-panel">
      <h3><AppIcon name="data" :size="15" /> DATA PERSONEL</h3>
      <div class="readonly-grid">
        <div><span>Name</span><b>{{ personnel.nama || '-' }}</b></div>
        <div><span>Rank</span><b>{{ personnel.pangkat || '-' }}</b></div>
        <div><span>NRP</span><b class="mono">{{ personnel.nrp || '-' }}</b></div>
        <div><span>Corps</span><b>{{ personnel.korps || '-' }}</b></div>
        <div><span>Position</span><b>{{ personnel.jabatan || '-' }}</b></div>
        <div><span>Unit</span><b>{{ unit }}</b></div>
      </div>
    </section>

    <section class="panel form-panel">
      <h3><AppIcon name="user-check" :size="15" /> STATUS</h3>
      <div class="form-grid status-grid">
        <label>
          Status
          <select v-model="form.statusAbsen" required>
            <optgroup v-for="group in attendanceGroups" :key="group.label" :label="group.label">
              <option v-for="option in group.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </optgroup>
          </select>
        </label>
        <label>
          Kesiapan
          <select v-model="form.statusKesiapan" required>
            <option v-for="option in readinessOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <div class="form-actions">
      <button type="button" class="outline" @click="router.back()">Batal</button>
      <button type="submit" class="primary" :disabled="saving">
        <AppIcon name="save" :size="15" />
        {{ saving ? 'Menyimpan...' : 'Simpan Status' }}
      </button>
    </div>
  </form>
</template>
