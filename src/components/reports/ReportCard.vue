<script setup lang="ts">
import ReportValueRow from './ReportValueRow.vue'
defineProps<{ title: string; data: Record<string, unknown> }>()
</script>
<template><article class="report-validation-card"><h4>{{ title }}</h4><ReportValueRow v-for="(value,key) in data" :key="key" :label="key" :value="value" /></article></template>
