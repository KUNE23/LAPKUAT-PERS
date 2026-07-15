import { createRouter, createWebHashHistory } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
import MainLayout from '../layouts/MainLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import DashboardPage from '../pages/dashboard/DashboardPage.vue'
import PersonnelListPage from '../pages/personnel/PersonnelListPage.vue'
import PersonnelCreatePage from '../pages/personnel/PersonnelCreatePage.vue'
import ImportExcelPage from '../pages/import/ImportExcelPage.vue'
import ActivityPage from '../pages/activity/ActivityPage.vue'
import ReportValidationPage from '../pages/reports/ReportValidationPage.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: AuthLayout, children: [{ path: '', component: LoginPage }] },
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: MainLayout, children: [{ path: '', component: DashboardPage }] },
    { path: '/activity', component: MainLayout, children: [{ path: '', component: ActivityPage }] },
    { path: '/personnel', component: MainLayout, children: [{ path: '', component: PersonnelListPage }] },
    { path: '/personnel/create', component: MainLayout, children: [{ path: '', component: PersonnelCreatePage }] },
    { path: '/personnel/edit/:id', component: MainLayout, children: [{ path: '', component: PersonnelListPage }] },
    { path: '/import', component: MainLayout, children: [{ path: '', component: ImportExcelPage }] },
    { path: '/reports', redirect: '/report-validation' },
    { path: '/report-validation', component: MainLayout, children: [{ path: '', component: ReportValidationPage }] },
    { path: '/backup', component: MainLayout, children: [{ path: '', component: DashboardPage }] },
    { path: '/settings', component: MainLayout, children: [{ path: '', component: DashboardPage }] }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isAuthenticated) return '/login'
  if (to.path === '/login' && auth.isAuthenticated) return '/dashboard'
})
