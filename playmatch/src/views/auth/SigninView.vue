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
            <!-- Empty div for spacing -->
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

          <div class="text-center text-body-2">
            Don't have an account?
            <span class="text-primary font-weight-bold" @click="$router.push('/choose-role')"
              >Register here</span
            >
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const role = ref(null)
const showPassword = ref(false)

const router = useRouter()

const handleLogin = () => {
  // This is where we'll add the Firebase authentication logic later
  console.log('Login attempt:', {
    email: email.value,
    password: password.value,
    role: role.value,
  })
  // Navigate to a dashboard or home page after successful login
  router.push('/dashboard')
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
