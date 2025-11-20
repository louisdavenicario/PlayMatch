<script setup>
import { ref } from 'vue'
const theme = ref('light')
</script>

<template>
  <v-app :theme="theme">
    <v-main
      class="d-flex justify-center"
      style="
        min-height: 100vh;
        background: linear-gradient(
          to bottom right,
          rgba(26, 101, 162, 0.6),
          rgba(119, 154, 229, 0.6)
        );
      "
    >
      <v-container class="my-10" style="max-width: 900px">
        <v-card
          class="pa-6 pa-md-10 rounded-xl"
          elevation="10"
          style="background-color: rgba(255, 255, 255, 0.95)"
        >
          <h1 class="text-h4 text-md-h3 font-weight-bold mb-6 text-center text-primary">
            PlayMatch Terms of Service
          </h1>
          <p class="text-caption text-grey-darken-1 text-center mb-10">
            Effective Date: November 10, 2025
          </p>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">1. Acceptance of Terms</h2>
            <p class="text-body-2">
              By accessing or using the PlayMatch booking and administration system (the "Service"),
              you agree to be bound by these Terms of Service. If you disagree with any part of the
              terms, then you do not have permission to access the Service.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">2. Booking and Facility Use</h2>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-check-circle</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  The Service acts solely as a platform to facilitate bookings between users and
                  facility administrators.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-check-circle</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  The final decision to Accept or Reject a booking rests entirely with the facility
                  administrator.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-check-circle</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  Once a customer has utilized a booked facility, the customer agrees to mark the
                  accepted booking as Completed within the Service.
                </p>
              </v-list-item>
            </v-list>
          </section>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">
              3. Payment Policy (Face-to-Face)
            </h2>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-currency-usd</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  The booking fee displayed in the Service is an indicative amount only,
                  representing the sum due to the facility.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend><v-icon color="secondary">mdi-cash</v-icon></template>
                <p class="text-body-2 text-wrap">
                  All payments are required to be made directly to the facility administrator upon
                  arrival or as otherwise arranged with the facility.
                </p>
              </v-list-item>
            </v-list>
          </section>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">
              4. Cancellation and Modification
            </h2>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-alert-circle</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  Pending Bookings: Customers may cancel their booking request if its status is
                  Pending.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-close-circle</v-icon></template
                >
                <p class="text-body-2 text-wrap">
                  Accepted Bookings: Customers cannot cancel a booking once the status has been
                  changed to Accepted by the facility administrator.
                </p>
              </v-list-item>
            </v-list>
          </section>

          <section class="mb-4">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">5. User Conduct</h2>
            <p class="text-body-2">
              Users must provide accurate information, respect the facilities and their rules, and
              use the Service only for lawful booking and administrative purposes. Misuse of the
              Service or facilities may result in account termination.
            </p>
          </section>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
