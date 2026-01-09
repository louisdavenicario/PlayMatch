<template>
  <v-app>
    <!-- 🧭 Top Bar -->
    <v-app-bar
      app
      fixed
      dark
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.8), rgba(119, 154, 229, 0.8))',
      }"
      flat
    >
      <v-btn icon @click="$router.go(-1)">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-bold" style="color: white">My Favorites</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <!-- Main Content -->
    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container class="pt-5 px-4">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-10">
          <v-progress-circular indeterminate color="blue"></v-progress-circular>
        </div>

        <!-- No favorites yet -->
        <div v-else-if="favorites.length === 0" class="text-center grey--text py-10">
          <v-icon large color="grey lighten-1">mdi-heart-outline</v-icon>
          <p class="mt-2">You haven’t added any favorites yet.</p>
          <v-btn color="blue" dark rounded @click="$router.push({ name: 'customer-dashboard' })">
            Browse Facilities
          </v-btn>
        </div>

        <!-- Favorites list -->
        <v-row v-else dense>
          <v-col v-for="facility in favorites" :key="facility.id" cols="12" sm="6" md="4">
            <v-card
              class="mb-4"
              rounded="xl"
              elevation="2"
              @click="$router.push({ name: 'facility-details', params: { id: facility.id } })"
            >

            <div class="pa-3">
              <v-img :src="facility.image_url || '/images/default-facility.jpg'" height="200" class="grey lighten-3 rounded-xl" cover>
                <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                  <v-chip
                    x-small
                    dark
                    color="white"
                    class="text-overline font-weight-bold glass-chip"
                  >
                    {{ facility.facility_type }}
                  </v-chip>

                  <v-btn icon dark @click.stop="removeFavorite(facility.id)">
                    <v-icon color="red">mdi-heart</v-icon>
                  </v-btn>
                </v-card-text>
              </v-img>
            </div>

              <v-card-title class="pb-1 text-body-1 font-weight-semibold pt-3">
                {{ facility.facility_name }}
              </v-card-title>

              <v-card-text class="py-0">
                <div class="text-caption grey--text text-truncate mb-2">
                  {{ facility.address }}
                </div>
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center">
                    <v-icon small color="amber">mdi-star</v-icon>
                    <span class="text-caption ml-1 font-weight-medium">
                      {{ facility.rating || '4.5' }}
                    </span>
                  </div>
                  <v-chip color="green darken-1" dark small>
                    ₱{{ facility.price_per_hour }} /hr
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <v-bottom-navigation app fixed color="white" light v-model="activeNav">
      <v-btn class="mx-1" value="home" @click="$router.push({ name: 'customer-dashboard' })">
        <v-icon size="31" :color="activeNav === 'home' ? 'blue' : 'black'">mdi-home</v-icon>
      </v-btn>
      <v-btn class="mx-2" value="bookings" @click="$router.push({ name: 'customer-bookings' })">
        <v-icon size="28" :color="activeNav === 'bookings' ? 'blue' : 'black'"
          >mdi-calendar-check</v-icon
        >
      </v-btn>
      <v-btn class="mx-2" value="favorites" @click="$router.push({ name: 'favorites' })">
        <v-icon size="28" :color="activeNav === 'favorites' ? 'blue' : 'black'">mdi-heart</v-icon>
      </v-btn>
      <v-btn class="mx-1" value="profile" @click="$router.push({ name: 'customer-profile' })">
        <v-icon size="33" :color="activeNav === 'profile' ? 'blue' : 'black'">mdi-account</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
.glass-chip {
  /* 1. Translucent white background */
  background: rgba(255, 255, 255, 0.2) !important;
  
  /* 2. The glass blur effect */
  backdrop-filter: blur(3px) !important;
  -webkit-backdrop-filter: blur(3px) !important; /* For Safari support */
  
  /* 3. Subtle thin border to define the shape */
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  

  /* 4. Soft shadow to give it lift */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
  
  /* Ensure text is readable over the blur */
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
}

.v-bottom-navigation .v-btn{
  /* Make the button shape a circle */
  border-radius: 27% !important;
}
</style>

<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'FavoritesView',
  data: () => ({
    activeNav: 'favorites',
    currentUserId: null,
    favorites: [],
    loading: false,
  }),

  async mounted() {
    await this.getCurrentUser()
    if (this.currentUserId) {
      await this.fetchFavorites()
    }
  },

  methods: {
    // 🧍 Get logged-in user
    async getCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        this.currentUserId = data.user?.id || null
        console.log('✅ Current user ID:', this.currentUserId)
      } catch (err) {
        console.error('❌ Error fetching current user:', err.message)
      }
    },

    // Fetch user's favorites (JOIN facilities)
    async fetchFavorites() {
      this.loading = true
      try {
        console.log('🔍 Fetching favorites for user:', this.currentUserId)

        // Directly join favorites → facilities using FK relationship
        const { data, error } = await supabase
          .from('favorites')
          .select(
            `
            id,
            created_at,
            facilities (
              id,
              facility_name,
              address,
              facility_type,
              image_url,
              price_per_hour
            )
          `,
          )
          .eq('user_id', this.currentUserId)

        if (error) throw error
        console.log('⭐ Favorites with joined facilities:', data)

        // Flatten joined data
        this.favorites = data
          .filter((f) => f.facilities) // remove any null joins
          .map((f) => ({
            id: f.facilities.id,
            facility_name: f.facilities.facility_name,
            address: f.facilities.address,
            facility_type: f.facilities.facility_type,
            image_url: f.facilities.image_url,
            price_per_hour: f.facilities.price_per_hour,
          }))

        console.log('🏗 Processed favorites:', this.favorites)
      } catch (err) {
        console.error('❌ Error fetching favorites:', err.message)
      } finally {
        this.loading = false
      }
    },

    //  Remove from favorites
    async removeFavorite(facilityId) {
      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', this.currentUserId)
          .eq('facility_id', facilityId)

        if (error) throw error

        // Remove from local list instantly
        this.favorites = this.favorites.filter((f) => f.id !== facilityId)
        console.log('🗑 Removed favorite:', facilityId)
      } catch (err) {
        console.error('❌ Error removing favorite:', err.message)
      }
    },
  },
}
</script>

<style scoped>
.v-card {
  transition: 0.3s ease;
}
.v-card:hover {
  transform: scale(1.02);
}
</style>
