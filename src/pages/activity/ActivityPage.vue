<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ActivityTimeline from '../../components/feedback/ActivityTimeline.vue'
const activities = ref<any[]>([]); onMounted(async () => { activities.value = await window.api.getAllActivities() })
</script>
<template><div class="module-title"><div><h2>Semua Aktivitas</h2><p>Riwayat aktivitas pengguna di aplikasi.</p></div></div><section class="panel table-panel"><ActivityTimeline :activities="activities" /></section></template>
