<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "../../components/base/AppIcon.vue";
import { useToast } from "../../composables/useToast";
const { showToast } = useToast();
const importing = ref(false);
const lastResult = ref<{ successRows?: number; failedRows?: number } | null>(
  null,
);
async function chooseFile() {
  if (importing.value) return;
  importing.value = true;
  try {
    const result = await window.api.importExcel();
    if (!result.canceled) {
      lastResult.value = result;
      showToast(`Import selesai: ${result.successRows ?? 0} data berhasil.`);
    }
  } catch {
    showToast("Import Excel gagal. Periksa format file.", "error");
  } finally {
    importing.value = false;
  }
}
</script>
<template>
  <div class="module-title">
    <div>
      <h2>Import Data Excel</h2>
      <p>Upload file Excel untuk mengimpor data pelaku secara massal.</p>
    </div>
  </div>
  <section class="dropzone panel" :class="{ importing }" @click="chooseFile">
    <span class="drop-icon"><AppIcon name="import" :size="34" /></span>
    <h3>
      {{ importing ? "Memproses file Excel..." : "Drag & drop file Excel" }}
    </h3>
    <p>atau klik untuk memilih file</p>
    <small>.XLSX / .XLS — MAKS. 10 MB</small
    ><button class="outline" type="button" @click.stop="chooseFile">
      {{ importing ? "Mengimpor..." : "Pilih File Excel" }}
    </button>
  </section>
</template>
