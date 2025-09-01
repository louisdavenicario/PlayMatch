<script setup>
import { ref } from 'vue'
</script>

<template>
  <v-app :theme="theme">
    <v-main>
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
              class="mx-auto pt-10 text-center"
              max-width="600"
              elevation="10"
              style="
                background-color: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(4px);
                border: 2px solid #2196f3;
                border-radius: 20px;
              "
            >
              <!-- Logo -->
              <v-img
                class="mx-auto mb-6"
                src="/images/logo.png"
                width="100"
                alt="Playmatch Logo"
              ></v-img>

              <!-- Title -->
              <h1 class="text-h4 font-weight-bold mb-2">Playmatch</h1>
              <p class="text-body-1 text-grey mb-6">
                Book sports facilities or register your facilities
              </p>

              <!-- Buttons -->
              <div class="px-6 pb-6">
                <v-btn
                  class="mb-4"
                  block
                  color="primary"
                  size="large"
                  @click="$router.push('/register')"
                >
                  Get Started
                  <v-icon right>mdi-arrow-right</v-icon>
                </v-btn>

                <v-btn
                  outlined
                  block
                  color="rgba(255, 255, 255, 0.88)"
                  size="large"
                  :to="{ path: '/login' }"
                >
                  Already have an account? <span class="text-primary">Sign In</span>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-main>

    <v-footer border app class="text-center">
      <v-col class="text-center">© 2025 Playmatch</v-col>
    </v-footer>
  </v-app>
</template>
