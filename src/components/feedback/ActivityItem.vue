<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'
defineProps<{ activity: { type: string; title: string; description: string; performedBy: string; createdAt: string } }>()
function icon(type: string) { return type === 'DANGER' ? 'alert' : type === 'WARNING' ? 'badge' : type === 'INFO' ? 'personnel' : type === 'SUCCESS' ? 'check' : 'data' }
function relativeTime(value: string) { const diff = Date.now() - new Date(value).getTime(); const minutes = Math.floor(diff / 60000); if (minutes < 1) return 'Just now'; if (minutes < 60) return `${minutes} menit lalu`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} jam lalu`; if (hours < 48) return 'Kemarin'; return new Date(value).toLocaleDateString('id-ID') }
</script>
<template><article :class="['activity-item', `activity-${activity.type.toLowerCase()}`]"><span class="activity-icon"><AppIcon :name="icon(activity.type)" :size="15" /></span><div class="activity-body"><div class="activity-heading"><b>{{ activity.title }}</b><span class="activity-badge">{{ activity.type }}</span></div><p>{{ activity.description }}</p><small>{{ relativeTime(activity.createdAt) }} <i>•</i> Operator: {{ activity.performedBy }}</small></div></article></template>
