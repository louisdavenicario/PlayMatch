<template>
  <v-container class="fill-height d-flex flex-column justify-center text-center">
    <div class="mb-8">
      <v-avatar size="80" class="mb-4" color="blue lighten-5">
        <v-icon size="40" color="blue">mdi-office-building</v-icon>
      </v-avatar>
      <h1 class="text-h4 font-weight-bold">SportSpot</h1>
      <p class="text-body-1 text-grey">
        Book sports facilities or grow your business - all in one platform
      </p>
    </div>

    <div class="mb-8">
      <v-list dense>
        <v-list-item>
          <v-icon color="blue">mdi-check-circle</v-icon>
          <v-list-item-title>Easy facility booking for players</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-icon color="blue">mdi-check-circle</v-icon>
          <v-list-item-title>Business growth tools for owners</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-icon color="blue">mdi-check-circle</v-icon>
          <v-list-item-title>Secure payments & real-time availability</v-list-item-title>
        </v-list-item>
      </v-list>
    </div>

    <v-btn class="mb-4" block color="primary" @click="$router.push('/role-selection')">
      Get Started
      <v-icon right>mdi-arrow-right</v-icon>
    </v-btn>

    <v-btn outlined block color="primary" @click="$router.push('/login')">
      Already have an account? Sign In
    </v-btn>
  </v-container>
</template>

<script setup></script>
