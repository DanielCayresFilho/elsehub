import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authService } from '@/services/auth.service'
import { UserRole } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'blank' }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/conversas',
    name: 'Conversations',
    component: () => import('@/views/conversations/ConversationsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contatos',
    name: 'Contacts',
    component: () => import('@/views/contacts/ContactsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/historico',
    name: 'History',
    component: () => import('@/views/history/HistoryView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/campanhas',
    children: [
      {
        path: '',
        name: 'Campaigns',
        component: () => import('@/views/campaigns/CampaignsListView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'nova',
        name: 'NewCampaign',
        component: () => import('@/views/campaigns/NewCampaignView.vue'),
        meta: { requiresAuth: true, roles: [UserRole.ADMIN, UserRole.SUPERVISOR] }
      },
      {
        path: ':id',
        name: 'CampaignDetails',
        component: () => import('@/views/campaigns/CampaignDetailsView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/relatorios',
    name: 'Reports',
    component: () => import('@/views/reports/ReportsView.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN, UserRole.SUPERVISOR] }
  },
  {
    path: '/configuracoes',
    name: 'Settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios',
    name: 'Users',
    component: () => import('@/views/users/UsersView.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN] }
  },
  {
    path: '/instancias',
    name: 'Instances',
    component: () => import('@/views/instances/InstancesView.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN] }
  },
  {
    path: '/templates',
    name: 'Templates',
    component: () => import('@/views/templates/TemplatesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tabulacoes',
    name: 'Tabulations',
    component: () => import('@/views/tabulations/TabulationsView.vue'),
    meta: { requiresAuth: true, roles: [UserRole.ADMIN, UserRole.SUPERVISOR] }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authService.isAuthenticated()

  // Redirect to login if not authenticated
  if (requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
    return
  }

  // Redirect to dashboard if already authenticated and trying to access login
  if (to.name === 'Login' && isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  // Check role-based access
  if (requiresAuth && to.meta.roles) {
    const user = authService.getStoredUser()
    const allowedRoles = to.meta.roles as UserRole[]
    
    if (user && !allowedRoles.includes(user.role)) {
      next({ name: 'Dashboard' })
      return
    }
  }

  next()
})

export default router

