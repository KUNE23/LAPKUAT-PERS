<script setup lang="ts">
import { AlertTriangle, BadgeCheck, Bell, Building2, ChartNoAxesColumn, Check, ClipboardList, DatabaseBackup, FileUp, LayoutDashboard, LogIn, LogOut, Search, Save, Settings, Shield, UserCheck, Users } from 'lucide-vue-next'
import type { Component } from 'vue'

const props = defineProps<{ name: string; size?: number | string }>()
const icons: Record<string, Component> = { dashboard: LayoutDashboard, personnel: Users, import: FileUp, reports: ChartNoAxesColumn, backup: DatabaseBackup, settings: Settings, login: LogIn, logout: LogOut, bell: Bell, search: Search, shield: Shield, badge: BadgeCheck, 'user-check': UserCheck, check: Check, alert: AlertTriangle, data: ClipboardList, unit: Building2, save: Save }
</script>
<template><component :is="icons[props.name] || Shield" :size="props.size || 18" :stroke-width="2" aria-hidden="true" /></template>
