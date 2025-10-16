import { createRouter, createWebHistory } from 'vue-router'

// Views
import LandingView from '@/views/auth/LandingView.vue'
import SigninView from '@/views/auth/SigninView.vue'
import Customer_registrationView from '@/views/auth/Customer_registrationView.vue'
import Choose_roleView from '@/views/auth/Choose_roleView.vue'
import Owner_registrationView from '@/views/auth/Owner_registrationView.vue'
import Owner_dashboardView from '@/views/auth/Owner_dashboardView.vue'
import Customer_dashboardv1View from '@/views/auth/Customer_dashboardv1View.vue'
import Facility_detailsView from '@/views/auth/Facility_detailsView.vue'
import Customer_profileView from '@/views/auth/Customer_profileView.vue'
import Play_requestView from '@/views/auth/Play_requestView.vue'
import FavoritesView from '@/views/auth/FavoritesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView,
    },
    {
      path: '/choose-role',
      name: 'choose-role',
      component: Choose_roleView,
    },
    {
      path: '/signin',
      name: 'signin',
      component: SigninView,
    },
    {
      path: '/customer-registration',
      name: 'customer-registration',
      component: Customer_registrationView,
    },
    {
      path: '/owner-registration',
      name: 'owner-registration',
      component: Owner_registrationView,
    },
    {
      path: '/owner-dashboard',
      name: 'owner-dashboard',
      component: Owner_dashboardView,
    },
    {
      path: '/customer_dashboardv1',
      name: 'customer-dashboard',
      component: Customer_dashboardv1View,
    },
    {
      path: '/facility_details/:id',
      name: 'facility-details',
      component: Facility_detailsView,
      props: true,
    },
    {
      path: '/customer_profile',
      name: 'customer-profile',
      component: Customer_profileView,
    },
    {
      path: '/playmate-requests',
      name: 'playmate-requests',
      component: Play_requestView,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
    },
  ],
})

export default router
