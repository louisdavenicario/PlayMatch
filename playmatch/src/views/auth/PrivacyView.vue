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
            PlayMatch Privacy Policy
          </h1>
          <p class="text-caption text-grey-darken-1 text-center mb-10">
            Last Updated: November 10, 2025
          </p>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">1. Information We Collect</h2>
            <p class="text-body-2 mb-2">
              We collect information to provide and improve the Service, specifically related to
              booking and facility management.
            </p>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend><v-icon color="secondary">mdi-account</v-icon></template>
                <p class="text-body-2">
                  Account Data: Name, email address, and phone number (for booking confirmation
                  and facility contact).
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-calendar-check</v-icon></template
                >
                <p class="text-body-2">
                  Booking Data: Date, time, facility name, duration, and the displayed booking
                  fee amount.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-map-marker</v-icon></template
                >
                <p class="text-body-2">
                  Facility Data (Administrators): Location, pricing, availability schedules, and
                  facility descriptions.
                </p>
              </v-list-item>
            </v-list>
          </section>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">
              2. How We Use Your Information
            </h2>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-shield-lock</v-icon></template
                >
                <p class="text-body-2">
                  Service Provision: To process your booking requests, manage facility
                  schedules, and send notifications regarding booking status changes (Pending,
                  Accepted, Rejected).
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend
                  ><v-icon color="secondary">mdi-share-variant</v-icon></template
                >
                <p class="text-body-2">
                  Sharing Data: We share necessary customer contact and booking details with the
                  specific facility administrator to complete the service and facilitate the
                  face-to-face payment.
                </p>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend><v-icon color="secondary">mdi-chart-bar</v-icon></template>
                <p class="text-body-2">
                  Administration: For facility managers to track their booking history, revenue
                  (based on the system's displayed fee), and completion status.
                </p>
              </v-list-item>
            </v-list>
          </section>

          <section class="mb-8">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">3. Data Security and Storage</h2>
            <p class="text-body-2">
              We are committed to protecting your personal information and use strong security measures to keep it safe. However, in the world of electronic data, we cannot guarantee security 100% of the time. We hold onto your account and booking data only for as long as we need it to properly run the PlayMatch service."
            </p>
          </section>

          <section class="mb-4">
            <h2 class="text-h6 font-weight-bold mb-3 text-primary">4. Changes to This Policy</h2>
            <p class="text-body-2">
              We may update our Privacy Policy from time to time. We will let you know about any changes by posting the revised Policy on this page, which will show the new 'Last Updated' date.
            </p>
          </section>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
