<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const selectedRole = ref('')
const router = useRouter()

function continueAction() {
  if (!selectedRole.value) return

  if (selectedRole.value === 'customer') {
    // Correctly navigate to the customer registration page using Vue Router
    router.push('/customer-registration')
  } else if (selectedRole.value === 'owner') {
    // Navigate to the owner registration page
    router.push('/owner-registration')
  }
}
</script>

<template>
  <div class="d-flex align-center justify-center h-screen bg-blue-grey-lighten-5">
    <v-card
      class="rounded-xl pa-8"
      elevation="4"
      min-width="400"
      max-width="1000"
      color="white"
      style="border: 2px solid #2196f3"
    >
      <v-btn icon @click="router.push({ name: 'home' })" class="mb-4">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div class="text-center mb-8">
        <h2 class="text-h4 font-weight-bold mb-2">Choose Your Role</h2>
        <p class="text-medium-emphasis">
          Are you a customer looking to book facilities or a facility owner?
        </p>
      </div>

      <v-row justify="center" class="mb-8">
        <v-col cols="12">
          <v-card
            :elevation="selectedRole === 'customer' ? 6 : 2"
            :variant="selectedRole === 'customer' ? 'tonal' : 'outlined'"
            color="green"
            class="pa-4 cursor-pointer"
            @click="selectedRole = 'customer'"
          >
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-avatar color="green-lighten-4" size="56" class="mr-4">
                  <v-icon color="green">mdi-account</v-icon>
                </v-avatar>
              </v-col>
              <v-col>
                <h3 class="text-h6 font-weight-bold">Customer</h3>
                <p class="text-body-2 text-medium-emphasis">Book and play at sports facilities</p>
              </v-col>
              <v-col cols="auto" v-if="selectedRole === 'customer'">
                <v-icon color="primary">mdi-check-circle</v-icon>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            :elevation="selectedRole === 'owner' ? 6 : 2"
            :variant="selectedRole === 'owner' ? 'tonal' : 'outlined'"
            color="blue"
            class="pa-4 cursor-pointer"
            @click="selectedRole = 'owner'"
          >
            <v-row align="center" no-gutters>
              <v-col cols="auto">
                <v-avatar color="blue-lighten-4" size="56" class="mr-4">
                  <v-icon color="blue">mdi-office-building</v-icon>
                </v-avatar>
              </v-col>
              <v-col>
                <h3 class="text-h6 font-weight-bold">Owner</h3>
                <p class="text-body-2 text-medium-emphasis">
                  List and manage your sports facilities
                </p>
              </v-col>
              <v-col cols="auto" v-if="selectedRole === 'owner'">
                <v-icon color="primary">mdi-check-circle</v-icon>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-card class="mb-8" variant="outlined">
        <v-card-text>
          <h4 class="font-weight-medium mb-3">
            {{
              selectedRole === 'customer'
                ? 'As a Customer:'
                : selectedRole === 'owner'
                  ? 'As a Facility Owner:'
                  : 'Benefits:'
            }}
          </h4>
          <div v-if="selectedRole === 'customer'">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="green" class="mr-2">mdi-check-circle</v-icon>
              <span>Browse and book sports facilities</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="green" class="mr-2">mdi-check-circle</v-icon>
              <span>Secure payments and booking history</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="18" color="green" class="mr-2">mdi-check-circle</v-icon>
              <span>Rate and review facilities</span>
            </div>
          </div>
          <div v-else-if="selectedRole === 'owner'">
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="blue" class="mr-2">mdi-check-circle</v-icon>
              <span>List your facilities for booking</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon size="18" color="blue" class="mr-2">mdi-check-circle</v-icon>
              <span>Manage bookings and revenue</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="18" color="blue" class="mr-2">mdi-check-circle</v-icon>
              <span>Analytics and business insights</span>
            </div>
          </div>
          <div v-else class="text-medium-emphasis font-italic">Select a role to see benefits</div>
        </v-card-text>
      </v-card>
      <v-btn block color="primary" size="large" :disabled="!selectedRole" @click="continueAction">
        Continue as
        {{
          selectedRole === 'customer'
            ? ' Customer'
            : selectedRole === 'owner'
              ? ' Facility Owner'
              : ' ...'
        }}
      </v-btn>
    </v-card>
  </div>
</template>
