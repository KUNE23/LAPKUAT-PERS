<script setup lang="ts">
import { useRouter, useRoute, RouterView } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AppIcon from "../components/base/AppIcon.vue";
import { useToast } from "../composables/useToast";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { toast, toastType } = useToast();
function iconName(label: string) { return ({ Dashboard: 'dashboard', Personel: 'personnel', 'Import Excel': 'import', Laporan: 'reports', 'Backup & Restore': 'backup', Pengaturan: 'settings' } as Record<string, string>)[label] || 'settings' }
const links = [
  { label: "Dashboard", path: "/dashboard"},
  { label: "Personel", path: "/personnel", icon: "♙" },
  { label: "Import Excel", path: "/import", icon: "▤" },
  { label: "Laporan", path: "/reports", icon: "▥" },
  { label: "Backup & Restore", path: "/backup", icon: "▰" },
  { label: "Pengaturan", path: "/settings", icon: "⚙" },
];
function logout() {
  auth.logout();
  router.replace("/login");
}
</script>
<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div class="brand text-center">
        <p>LOGO</p>
      </div>
      <div class="nav-label">MENU UTAMA</div>
      <nav>
        <button
          v-for="link in links"
          :key="link.path"
          :class="[
            'nav-item',
            {
              active:
                route.path === link.path ||
                route.path.startsWith(`${link.path}/`),
            },
          ]"
          @click="router.push(link.path)"
        >
          ><span class="nav-icon"><AppIcon :name="iconName(link.label)" /></span
          >{{ link.label
          }}<i
            v-if="
              route.path === link.path || route.path.startsWith(`${link.path}/`)
            "
          />
        </button>
      </nav>
      <div class="sidebar-user">
        <span class="avatar">{{ auth.user?.nama?.slice(0, 1) || "O" }}</span
        ><span
          ><b>{{ auth.user?.nama || "Operator" }}</b
          ><small>{{ auth.user?.nrp || "OPERATOR" }}</small></span
        ><button class="logout" aria-label="Keluar" @click="logout"><AppIcon name="logout" size="16" /></button>
      </div>
    </aside>
    <section class="content">
      <header class="topbar">
        <div>
          <h1>LAPKUAT PERS</h1>
        </div>
        <div class="top-actions">
          <div class="profile">
            <span class="avatar small">{{
              auth.user?.nama?.slice(0, 1) || "O"
            }}</span
            >{{ auth.user?.nama || "Operator" }}
          </div>
        </div>
      </header>
      <RouterView />
    </section>
    <Transition name="toast"><div v-if="toast" :class="['toast', toastType]">{{ toast }}</div></Transition>
  </main>
</template>
