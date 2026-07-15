<script setup lang="ts">
defineProps<{ label: string; value: unknown }>()
</script>
<template><div class="report-value-row"><span>{{ label }}</span><strong>{{ typeof value === 'object' && value !== null ? '—' : String(value ?? '—') }}</strong></div></template>
