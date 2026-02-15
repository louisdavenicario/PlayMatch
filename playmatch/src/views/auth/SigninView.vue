<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const loading = ref(false)
const email = ref('')
const password = ref('')
const role = ref(null)
const showPassword = ref(false)
const errorMessage = ref(null)
const theme = ref('light')

const router = useRouter()

const handleLogin = async () => {
  errorMessage.value = null

  if (!email.value || !password.value || !role.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  loading.value = true

  try {
    // 1. Sign in with email and password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (signInError) throw signInError

    const user = signInData.user || signInData.session?.user
    if (!user) {
      errorMessage.value = 'Login failed. No user found.'
      return
    }

    // 2. Fetch the user's profile safely
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profile) {
      errorMessage.value = 'Profile not found. Please complete your registration.'
      await supabase.auth.signOut()
      return
    }

    // 3. Check role
    if (profile.role.toLowerCase() !== role.value.toLowerCase()) {
      errorMessage.value = `You are registered as a ${profile.role}. Please log in with the correct role.`
      await supabase.auth.signOut()
      return
    }

    // 4. Redirect based on role
    if (role.value.toLowerCase() === 'owner') {
      router.push({ name: 'owner-dashboard' })
    } else if (role.value.toLowerCase() === 'customer') {
      router.push({ name: 'customer-dashboard' })
    }
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-app :theme="theme">
    <div
      class="d-flex align-center justify-center animated-background-container"
      style="min-height: 100dvh; background: url('/images/logo.jpg') center/cover no-repeat"
    >
      <v-row
        justify="center"
        align="center"
        style="max-width: 1100px; width: 100%"
        class="mx-auto pa-4 pa-md-10"
      >
        <v-col cols="12" md="6" class="hidden-sm-and-down">
          <div class="text-white text-md-left text-center pa-4">
            <h1 class="text-h2 font-weight-bold text-white mb-2">PlayMatch</h1>
            <p class="text-h5 font-weight-light">
              Connect with sports enthusiasts and book available courts around you.
            </p>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <v-card
            class="mx-auto pa-8"
            max-width="500"
            elevation="10"
            style="
              background-color: rgba(255, 255, 255, 0.88);
              backdrop-filter: blur(4px);
              border: 2px solid #2196f3;
              border-radius: 20px;
              z-index: 10;
            "
          >
            <div class="d-flex align-center mb-4">
              <v-btn icon @click="$router.push('/')" class="mb-4">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <div class="flex-grow-1"></div>
            </div>

            <div class="text-center">
              <v-img
                class="mx-auto mb-6 animated-logo"
                src="/images/logo.png"
                width="100"
                alt="Playmatch Logo"
              ></v-img>
              <h2 class="text-h5 font-weight-bold mb-2">PlayMatch</h2>
              <p class="text-subtitle-1 text-grey mb-6">Sign in to your account</p>
            </div>

            <v-form @submit.prevent="handleLogin">
              <v-text-field
                label="Email Address"
                v-model="email"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="compact"
                required
                class="mb-4"
                rounded="lg"
              ></v-text-field>

              <v-text-field
                label="Password"
                v-model="password"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                density="compact"
                required
                class="mb-4"
                rounded="lg"
              ></v-text-field>

              <v-select
                label="Role"
                v-model="role"
                :items="['Customer', 'Owner']"
                prepend-inner-icon="mdi-account-group"
                variant="outlined"
                density="compact"
                required
                class="mb-4"
                rounded="lg"
              ></v-select>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                rounded="lg"
                class="my-4 text-none"
                :loading="loading"
              >
                Sign In
              </v-btn>
            </v-form>

            <v-alert v-if="errorMessage" type="error" closable class="mt-4" density="compact">
              {{ errorMessage }}
            </v-alert>

            <p class="text-center text-body-2 mt-4">
              <router-link
                :to="{ path: '/forgot-password' }"
                class="text-primary font-weight-bold text-decoration-none"
              >
                Forgot your password?
              </router-link>
            </p>

            <p class="text-center text-body-2 mt-4">
              Don't have an account?
              <router-link
                :to="{ path: '/choose-role' }"
                class="text-primary font-weight-bold text-decoration-none"
              >
                Register here
              </router-link>
            </p>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-app>
</template>

<style scoped>
.animated-background-container {
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.animated-background-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(225deg, #1a65a2 0%, #779ae5 50%, #1a65a2 100%);
  background-size: 400% 400%;
  opacity: 0.85;
  animation: smoothBackgroundShift 20s ease infinite;
}

@keyframes smoothBackgroundShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes logoRotate {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.animated-logo {
  animation: logoRotate 4s ease-in-out infinite;
  transform-style: preserve-3d;
  perspective: 1000px;
}
</style>
