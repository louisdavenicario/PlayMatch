<template>
  <v-app>
    <div
      class="d-flex align-center justify-center animated-background-container"
      style="min-height: 100dvh; background: url('/images/logo.jpg') center/cover no-repeat"
    >
      <v-card
        class="pa-8 mx-auto"
        max-width="450"
        elevation="10"
        style="background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); border-radius: 20px; border: 2px solid #2196f3;"
      >
        <div class="text-center mb-6">
          <v-img src="/images/logo.png" width="80" class="mx-auto mb-6 animated-logo"></v-img>
          <h2 class="text-h5 font-weight-bold">Create New Password</h2>
          <p class="text-body-2 text-grey">Enter your new secure password below</p>
        </div>

        <v-form ref="form" @submit.prevent="handleUpdatePassword">
          <v-text-field
            v-model="newPassword"
            label="New Password"
            prepend-inner-icon="mdi-lock"
            :type="show1 ? 'text' : 'password'"
            @click:append-inner="show1 = !show1"
            :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
            @focus="passwordFocused = true"
            @blur="passwordFocused = false"
            variant="outlined"
            required
            rounded="lg"
          ></v-text-field>

          <div v-if="newPassword || passwordFocused || confirmFocused" class="password-rules mb-4">
            <p class="text-caption font-weight-bold">Password must contain:</p>
            <ul>
              <li :class="hasMinLength ? 'text-green-darken-2' : 'text-red-darken-2'">
                <v-icon :color="hasMinLength ? 'green' : 'red'">
                  {{ hasMinLength ? 'mdi-check-circle' : 'mdi-circle' }}
                </v-icon>
                At least 8 characters
              </li>
              <li :class="hasUppercase ? 'text-green-darken-2' : 'text-red-darken-2'">
                <v-icon :color="hasUppercase ? 'green' : 'red'">
                  {{ hasUppercase ? 'mdi-check-circle' : 'mdi-circle' }}
                </v-icon>
                One uppercase letter
              </li>
              <li :class="hasLowercase ? 'text-green-darken-2' : 'text-red-darken-2'">
                <v-icon :color="hasLowercase ? 'green' : 'red'">
                  {{ hasLowercase ? 'mdi-check-circle' : 'mdi-circle' }}
                </v-icon>
                One lowercase letter
              </li>
              <li :class="hasSymbol ? 'text-green-darken-2' : 'text-red-darken-2'">
                <v-icon :color="hasSymbol ? 'green' : 'red'">
                  {{ hasSymbol ? 'mdi-check-circle' : 'mdi-circle' }}
                </v-icon>
                One symbol (!@#$%)
              </li>
            </ul>
          </div>

          <v-text-field
            v-model="confirmPassword"
            label="Confirm New Password"
            prepend-inner-icon="mdi-lock-check"
            :type="show2 ? 'text' : 'password'"
            @click:append-inner="show2 = !show2"
            :append-inner-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
            @focus="confirmFocused = true"
            @blur="confirmFocused = false"
            :rules="confirmPasswordRule"
            variant="outlined"
            required
            rounded="lg"
            validate-on="input"
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            class="mt-2 text-none"
            rounded="lg"
            :loading="loading"
            :disabled="!isFormValid || loading"
          >
            Update Password
          </v-btn>
        </v-form>

        <v-alert v-if="message" :type="messageType" class="mt-4" density="compact" closable>
          {{ message }}
        </v-alert>
      </v-card>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const show1 = ref(false)
const show2 = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref('error')

const passwordFocused = ref(false)
const confirmFocused = ref(false)

// Requirement Logic
const hasMinLength = computed(() => (newPassword.value?.length || 0) >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value))
const hasLowercase = computed(() => /[a-z]/.test(newPassword.value))
const hasSymbol = computed(() => /[!@#$%^&*()]/.test(newPassword.value))

// Rules for the Confirm Password Field (Positions text below field as in your image)
const confirmPasswordRule = [
  (v) => !!v || 'Confirmation is required',
  (v) => v === newPassword.value || 'Passwords do not match',
]

// Logic for Button Disabled State
const isFormValid = computed(() => {
  return hasMinLength.value && 
         hasUppercase.value && 
         hasLowercase.value && 
         hasSymbol.value && 
         confirmPassword.value === newPassword.value &&
         confirmPassword.value.length > 0
})

const handleUpdatePassword = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) throw error

    messageType.value = "success"
    message.value = "Success! Your password has been updated."
    
    setTimeout(() => {
      router.push({ name: 'signin' })
    }, 2500)
  } catch (err) {
    messageType.value = "error"
    message.value = err.message || "An error occurred"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.password-rules {
  background-color: rgba(0, 0, 0, 0.03);
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.password-rules ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.password-rules li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  margin-bottom: 4px;
}
.password-rules .v-icon {
  font-size: 0.9rem;
}

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
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes logoRotate {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}

.animated-logo {
  animation: logoRotate 4s ease-in-out infinite;
  transform-style: preserve-3d;
  perspective: 1000px;
}
</style>