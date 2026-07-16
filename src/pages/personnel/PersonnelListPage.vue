<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { Personnel } from "../../types";
import AppIcon from "../../components/base/AppIcon.vue";
const rows = ref<Personnel[]>([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const search = ref("");
const category = ref("");
const router = useRouter();
const statusLabels: Record<string, string> = {
  DSPP_TOP: "DSPP/TOP",
  NYATA: "NYATA",
  BP: "B/P",
  PENUGASAN: "PENUGASAN",
  CUTI: "CUTI",
  SAKIT: "SAKIT",
  TAHANAN: "TAHANAN",
  LARI: "LARI",
  LAIN_LAIN: "LAIN-LAIN",
  "LAIN-LAIN": "LAIN-LAIN",
  JAGA: "JAGA",
  TUGAS_DAPUR: "TUGAS DAPUR",
  DIRAWAT: "DIRAWAT",
  DIHUKUM: "DIHUKUM",
  PIKET: "PIKET",
  ISTIRAHAT: "ISTIRAHAT",
  SIAP: "SIAP",
  TIDAK_SIAP: "TIDAK SIAP",
};
function displayStatus(value: unknown) {
  const key = String(value || "").trim().toUpperCase();
  return key ? statusLabels[key] || key.replace(/_/g, " ") : "-";
}
async function load() {
  const result = await window.api.getPersonnelList({
    page: page.value,
    pageSize: 20,
    search: search.value,
    kategoriPangkat: category.value,
  });
  rows.value = result.items as Personnel[];
  total.value = result.total;
  totalPages.value = result.totalPages;
}
async function filter() {
  page.value = 1;
  await load();
}
async function move(next: number) {
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
  await load();
}
onMounted(load);
</script>
<template>
  <div class="module-title">
    <div>
      <h2>Data Pelaku</h2>
      <p>Kelola data pelaku dan susunan organisasi satuan.</p>
    </div>
    <button class="primary" @click="router.push('/personnel/create')">
      ＋ Tambah Data Pelaku
    </button>
  </div>
  <section class="panel table-panel">
    <div class="table-toolbar">
      <select v-model="category" class="filter-select" @change="filter">
        <option value="">Semua Pangkat</option>
        <option>JENDERAL</option>
        <option>LETJEN</option>
        <option>MAYJEN</option>
        <option>BRIGJEN</option>
        <option>KOLONEL</option>
        <option>LETKOL</option>
        <option>MAYOR</option>
        <option>KAPTEN</option>
        <option>LETTU</option>
        <option>LETDA</option>
        <option>PELTU</option>
        <option>PELDA</option>
        <option>SERMA</option>
        <option>SERKA</option>
        <option>SERTU</option>
        <option>SERDA</option>
        <option>KOPKA</option>
        <option>KOPTU</option>
        <option>KOPDA</option>
        <option>PRAKA</option>
        <option>PRATU</option>
        <option>PRADA</option>
      </select>
      <div class="search-field">
        <input
          v-model="search"
          placeholder="Cari NRP atau nama..."
          @keyup.enter="filter"
        /><button aria-label="Cari" @click="filter">
          <AppIcon name="search" :size="17" />
        </button>
      </div>
    </div>
    <div v-if="rows.length" class="personnel-table-wrap">
      <table class="personnel-table">
        <thead>
          <tr>
            <th>NO</th>
            <th>NAMA</th>
            <th>PKT/KORP</th>
            <th>PKT</th>
            <th>PKT1</th>
            <th>NRP</th>
            <th>KORPS</th>
            <th>JAB ORGANIK</th>
            <th>JAB DLM LAT</th>
            <th>DIVISI</th>
            <th>BRIGADE</th>
            <th>KELOMPOK</th>
            <th>SATMINKAL</th>
            <th>BAG/KOMPI</th>
            <th>TON</th>
            <th>RU</th>
            <th>KET</th>
            <th>STATUS</th>
            <th>KESIAPAN</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id">
            <td>{{ (page - 1) * 20 + index + 1 }}</td>
            <td>{{ row.nama }}</td>
            <td>{{ row.pktKorp || "—" }}</td>
            <td>{{ row.pangkat || "—" }}</td>
            <td>{{ row.kodePangkat || "—" }}</td>
            <td class="mono">{{ row.nrp }}</td>
            <td>{{ row.korps || "—" }}</td>
            <td>{{ row.jabatan || "—" }}</td>
            <td>{{ row.jabDalamLat || "—" }}</td>
            <td>{{ row.divisi || "—" }}</td>
            <td>{{ row.brigade || row.satuan || "—" }}</td>
            <td>{{ row.kelompok || row.subSatuan || "—" }}</td>
            <td>{{ row.satminkal || row.mako || "—" }}</td>
            <td>{{ row.bagKompi || "—" }}</td>
            <td>{{ row.ton || "—" }}</td>
            <td>{{ row.ru || "—" }}</td>
            <td>{{ row.keterangan || "—" }}</td>
            <td>{{ displayStatus(row.statusAbsen) }}</td>
            <td>{{ displayStatus(row.statusKesiapan) }}</td>
            <td>
              <button class="outline table-action" @click="router.push(`/personnel/edit/${row.id}`)">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state compact">
      <span>♙</span><b>Belum ada data pelaku</b
      ><small
        >Import file Excel atau tambahkan data pelaku secara manual.</small
      >
    </div>
    <div v-if="total" class="pagination">
      <small
        >Menampilkan {{ (page - 1) * 20 + 1 }}–{{
          Math.min(page * 20, total)
        }}
        dari {{ total }} data pelaku</small
      >
      <div>
        <button class="outline" :disabled="page === 1" @click="move(page - 1)">
          ‹</button
        ><span>Halaman {{ page }} / {{ totalPages }}</span
        ><button
          class="outline"
          :disabled="page === totalPages"
          @click="move(page + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>
