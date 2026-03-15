import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabaseClient'

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
import DevLoginView from '@/views/auth/DevloginView.vue'
import DeveloperDashboardView from '@/views/auth/DeveloperdashboardView.vue'

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
      meta: { requiresAuth: true },
    },
    {
      path: '/customer_dashboardv1',
      name: 'customer-dashboard',
      component: Customer_dashboardv1View,
      meta: { requiresAuth: true },
    },
    {
      path: '/facility_details/:id',
      name: 'facility-details',
      component: Facility_detailsView,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/customer_profile',
      name: 'customer-profile',
      component: Customer_profileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/playmate-requests',
      name: 'playmate-requests',
      component: Play_requestView,
      meta: { requiresAuth: true },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/customer-bookings',
      name: 'customer-bookings',
      component: CustomerBookingsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/terms',
      name: 'terms',
      component: TermsView,
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyView,
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: UpdatePasswordView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dev',
      name: 'dev-login',
      component: DevLoginView,
    },
    {
      path: '/dev/dashboard',
      name: 'developer-dashboard',
      component: DeveloperDashboardView,
      meta: { requiresAuth: true, role: 'developer' },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  // 1. Route requires auth but user is not logged in
  if (to.meta.requiresAuth && !isLoggedIn) {
    if (to.meta.role === 'developer') {
      return next({ name: 'dev-login' })
    }
    return next({ name: 'home' })
  }

  // 2. If logged in, fetch profile role
  if (isLoggedIn) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const userRole = profile?.role?.toLowerCase()

    // 3. Block non-developers from /dev/dashboard
    if (to.meta.role === 'developer' && userRole !== 'developer') {
      return next({ name: 'dev-login' })
    }

    // 4. Redirect logged-in users away from home/signin to their dashboard
    if (to.name === 'home' || to.name === 'signin') {
      if (userRole === 'owner') return next({ name: 'owner-dashboard' })
      if (userRole === 'developer') return next({ name: 'developer-dashboard' })
      return next({ name: 'customer-dashboard' })
    }
  }

  next()
})

export default router
