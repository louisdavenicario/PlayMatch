<script setup>
import { ref } from 'vue'
const theme = ref('light')
</script>

<template>
  <v-app :theme="theme">
    <v-main
      class="d-flex align-center justify-center"
      style="
        min-height: 100vh;
        background: linear-gradient(
          to bottom right,
          rgba(26, 101, 162, 0.6),
          rgba(119, 154, 229, 0.6)
        );
      "
    >
      <v-container>
        <v-row class="d-flex justify-center mb-6 d-md-none">
          <v-col cols="12" class="text-center">
            <h1 class="text-h4 font-weight-bold text-white mb-2">PlayMatch</h1>
            <p class="text-subtitle-1 text-white">
              Connect with sports enthusiasts and book available courts around you.
            </p>
          </v-col>
        </v-row>

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

          <v-col
            cols="12"
            md="6"
            lg="4"
            class="d-flex justify-center justify-md-start mx-auto flex-column"
            style="max-width: 400px; padding: 0"
          >
            <v-card
              class="pt-10 text-center"
              elevation="10"
              style="
                background-color: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(4px);
                border: 2px solid #2196f3;
                border-radius: 20px;
              "
            >
              <v-img class="mx-auto mb-6" src="/images/logo.png" width="100" alt="Playmatch Logo" />
              <h1 class="text-h4 font-weight-bold mb-2">PlayMatch</h1>
              <p class="text-body-1 text-grey mb-6 px-4 px-sm-6">
                Book sports facilities or register your facilities
              </p>

              <div class="px-6 pb-6">
                <v-btn
                  class="mb-6"
                  block
                  color="primary"
                  size="large"
                  @click="$router.push('/choose-role')"
                >
                  Get Started
                  <v-icon right>mdi-arrow-right</v-icon>
                </v-btn>

                <p class="text-center text-body-2 mt-6">
                  Already have an account?
                  <router-link
                    :to="{ path: '/signin' }"
                    class="text-primary font-weight-bold text-decoration-none"
                  >
                    Sign In
                  </router-link>
                </p>
              </div>
            </v-card>

            <div class="mt-4 text-center text-white text-body-2 px-4">
              By signing in or creating an account, you agree with our
              <router-link to="/terms" class="text-white font-weight-bold text-decoration-none">
                Terms of Service
              </router-link>
              and
              <router-link to="/privacy" class="text-white font-weight-bold text-decoration-none">
                Privacy Policy
              </router-link>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer
      app
      class="text-center"
      style="background-color: transparent !important; color: white"
    >
      <v-col class="text-center text-white text-body-2">© 2025 Playmatch</v-col>  
    </v-footer>
  </v-app>
</template>
