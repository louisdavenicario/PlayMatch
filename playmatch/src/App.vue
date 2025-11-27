<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration)
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
      })
  }
})
</script>

<template>
  <RouterView />
</template>
