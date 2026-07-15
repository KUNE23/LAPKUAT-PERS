<script setup lang="ts">
import ReportCard from './ReportCard.vue'
import ReportValueRow from './ReportValueRow.vue'
defineProps<{ title: string; data: Record<string, unknown> }>()
</script>
<template><section class="report-validation-section"><div class="panel-head"><h3>{{ title }}</h3></div><div class="report-validation-grid"><template v-for="(value,key) in data" :key="key"><ReportCard v-if="value && typeof value === 'object' && !Array.isArray(value)" :title="key" :data="value as Record<string, unknown>" /><ReportValueRow v-else :label="key" :value="value" /></template></div></section></template>
