import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/Login.vue'
import Subscriptions from '@/pages/Subscriptions.vue'
import Settings from '@/pages/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/subscriptions'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresAuth: false }
    },
    {
      path: '/subscriptions',
      name: 'Subscriptions',
      component: Subscriptions,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守衛 (之後可加入認證邏輯)
router.beforeEach((to, from, next) => {
  // 暫時跳過認證檢查
  next()
})

export default router