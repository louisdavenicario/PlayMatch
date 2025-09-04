import { createRouter, createWebHistory } from 'vue-router'

// Views
import LandingView from '@/views/auth/LandingView.vue'
import UserView from '@/views/auth/UserView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import SigninView from '@/views/auth/SigninView.vue'
import CustomerregistrationView from '@/views/auth/CustomerregistrationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView,
    },
    {
      path: '/user',
      name: 'user',
      component: UserView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signin',
      name: 'sigin',
      component: SigninView,
    },
    {
      path: '/customer-registration',
      name: 'customer-registration',
      component: CustomerregistrationView,
    },
  ],
})

export default router
