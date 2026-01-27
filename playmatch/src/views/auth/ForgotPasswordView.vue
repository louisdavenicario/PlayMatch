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
          <h2 class="text-h5 font-weight-bold">Reset Password</h2>
          <p class="text-body-2 text-grey">Enter your email to receive a reset link</p>
        </div>

        <v-form @submit.prevent="handleResetRequest">
          <v-text-field
            v-model="email"
            label="Email Address"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            type="email"
            required
            rounded="lg"
            :disabled="loading || cooldown > 0"
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            rounded="lg"
            class="mt-4 text-none submit-button"
            :loading="loading"
            :disabled="cooldown > 0"
          >
            {{ cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Reset Link' }}
          </v-btn>
        </v-form>

        <v-alert v-if="message" :type="messageType" class="mt-4" density="compact" closable>
          {{ message }}
        </v-alert>

        <p class="text-center mt-6">
          <router-link to="/signin" class="text-primary text-decoration-none font-weight-bold back-link">
            <v-icon size="small">mdi-arrow-left</v-icon> Back to Signin
          </router-link>
        </p>
      </v-card>
    </div>
  </v-app>
</template>

<script>
import { supabase } from '@/supabaseClient'

export default {
  data: () => ({
    email: '',
    loading: false,
    message: '',
    messageType: 'info',
    cooldown: 0, // Track the seconds
    timerInterval: null // Hold the interval reference
  }),
  methods: {
    startCooldown() {
      this.cooldown = 60; // Start 60 second timer
      this.timerInterval = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown--;
        } else {
          clearInterval(this.timerInterval);
        }
      }, 1000);
    },
    async handleResetRequest() {
      this.loading = true;
      this.message = '';
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(this.email, {
          redirectTo: 'https://play-match-gamma.vercel.app/update-password',
        });

        if (error) throw error;

        this.messageType = 'success';
        this.message = 'Check your email for the password reset link!';
        
        // Trigger the timer on success
        this.startCooldown();

      } catch (err) {
        this.messageType = 'error';
        this.message = err.message || 'Failed to send reset email';
      } finally {
        this.loading = false;
      }
    }
  },
  // Stop the timer if the user leaves the page to prevent memory leaks
  beforeUnmount() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
</script>

<style scoped>
/* Background Animation Logic */
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

/* Logo Rotation Animation */
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

/* Button and Link Effects */
.submit-button {
  transition: all 0.3s ease-in-out;
}
.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.back-link {
  transition: opacity 0.2s;
}
.back-link:hover {
  opacity: 0.8;
}
</style>