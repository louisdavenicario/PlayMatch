import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabaseClient' // 1. Import your supabase client

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
import CustomerBookingsView from '@/views/auth/CustomerBookingsView.vue'
import PrivacyView from '@/views/auth/PrivacyView.vue'
import TermsView from '@/views/auth/TermsView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import UpdatePasswordView from '@/views/auth/UpdatePasswordView.vue'

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
      meta: { requiresAuth: true }
    },
    {
      path: '/customer_dashboardv1',
      name: 'customer-dashboard',
      component: Customer_dashboardv1View,
      meta: { requiresAuth: true }
    },
    {
      path: '/facility_details/:id',
      name: 'facility-details',
      component: Facility_detailsView,
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/customer_profile',
      name: 'customer-profile',
      component: Customer_profileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/playmate-requests',
      name: 'playmate-requests',
      component: Play_requestView,
      meta: { requiresAuth: true }
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/customer-bookings',
      name: 'customer-bookings',
      component: CustomerBookingsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsView,
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyView
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: UpdatePasswordView,
      meta: { requiresAuth: true }
    },
  ],
})

// 3. THE NAVIGATION GUARD
router.beforeEach(async (to, from, next) => {
  //Get the current session to check if the user is logged in
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session
  //Check if the route requires authentication and if the user is not logged in
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'home' })
  } 
  //If the user is logged in and tries to access the home or signin page, redirect them based on their role
  else if (isLoggedIn && (to.name === 'home' || to.name === 'signin')) {
    // 1. Fetch the role from the session or database
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // 2. Redirect based on their ACTUAL role
    if (profile?.role?.toLowerCase() === 'owner') {
      next({ name: 'owner-dashboard' })
    } else {
      next({ name: 'customer-dashboard' })
    }
  } 
  else {
    next()
  }
})

export default router
