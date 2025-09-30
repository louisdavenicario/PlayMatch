<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const email = ref('')
const password = ref('')
const role = ref(null)
const showPassword = ref(false)
const errorMessage = ref(null)

const router = useRouter()

const handleLogin = async () => {
  errorMessage.value = null // Clear previous errors

  if (!email.value || !password.value || !role.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

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
      router.push('/owner-dashboard')
    } else if (role.value.toLowerCase() === 'customer') {
      router.push('/customer_dashboardv1')
    }
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || 'An unexpected error occurred.'
  }
}
</script>

<template>
  <div
    class="d-flex align-center justify-center"
    style="
      min-height: 100dvh;
      background:
        linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6)),
        url('/images/logo.jpg') center/cover no-repeat;
    "
  >
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card
          class="mx-auto pa-8"
          max-width="600"
          elevation="10"
          style="
            background-color: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(4px);
            border: 2px solid #2196f3;
            border-radius: 20px;
          "
        >
          <div class="d-flex align-center mb-4">
            <v-btn icon @click="$router.go(-1)" class="mr-2">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <div class="flex-grow-1"></div>
          </div>

          <div class="text-center">
            <v-img
              class="mx-auto mb-6"
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
            ></v-select>

            <v-btn type="submit" color="primary" size="large" block rounded="lg" class="my-4">
              Sign In
            </v-btn>
          </v-form>
          <v-alert v-if="errorMessage" type="error" closable class="mt-4">
            {{ errorMessage }}
          </v-alert>

          <div class="text-center text-body">
            Don't have an account?
            <v-btn
              variant="text"
              color="primary"
              class="font-weight-bold"
              @click="$router.push('/choose-role')"
            >
              Register here
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
