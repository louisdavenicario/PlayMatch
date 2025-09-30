<template>
  <v-app :theme="theme">
    <div
      class="d-flex align-center justify-center"
      style="
        min-height: 100dvh;
        background:
          linear-gradient(to bottom right,rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6)),
          url('/images/logo.jpg') center/cover no-repeat;
      "
    >
      <v-row justify="center" align="center" style="max-width: 1100px; width: 100%;" class="mx-auto pa-4 pa-md-10">
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
              <v-btn icon @click="$router.push('/')" class="mr-2">
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
            <p class="text-center text-body-2 mt-4">
                    Don't have an account? 
                    <router-link :to="{ path: '/choose-role' }" class="text-primary font-weight-bold text-decoration-none">
                      Register here
                    </router-link>
                  </p>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const email = ref('')
const password = ref('')
const role = ref(null)
const showPassword = ref(false)
const errorMessage = ref(null) // State to store error messages

const router = useRouter()

const handleLogin = async () => {
  errorMessage.value = null // Clear any previous errors

  if (!email.value || !password.value || !role.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  try {
    const {
      data: { user },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (signInError) {
      throw signInError
    }

    if (user) {
      // Fetch the user's role from the 'profiles' table using their Supabase user ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      // Check if the selected role matches the role in the database
      if (profile.role.toLowerCase() === role.value.toLowerCase()) {
        if (role.value.toLowerCase() === 'owner') {
          router.push('/owner-dashboard')
        } else if (role.value.toLowerCase() === 'customer') {
          router.push('/customer-dashboard')
        }
      } else {
        // Mismatch between selected role and database role
        errorMessage.value = `You are a registered as a ${profile.role}. Please log in with the correct role.`
        // Sign out the user to prevent them from accessing unauthorized routes
        await supabase.auth.signOut()
      }
    }
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message
  }
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
