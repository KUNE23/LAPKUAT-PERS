<script setup lang="ts">
import ActivityItem from './ActivityItem.vue'
defineProps<{ activities: Array<{ id: number; type: string; title: string; description: string; performedBy: string; createdAt: string }> }>()
</script>
<template><div v-if="activities.length" class="activity-timeline"><ActivityItem v-for="activity in activities" :key="activity.id" :activity="activity" /></div><div v-else class="empty-state activity-empty"><span>⌁</span><b>No activities yet.</b><small>Import, edit, backup, and report activities will appear here.</small></div></template>
