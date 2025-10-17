<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'ReservoSprotBookingHome',
  data: () => ({
    currentUserId: null,
    playmateRequests: [],
    playmateLoading: false,
    facilities: [],
    favorites: [], // ❤️ Store favorite facility objects
    favoriteIds: [], // store only facility_id for quick check
    loading: false,
    error: null,
  }),

  async mounted() {
    await this.getCurrentUser()
    if (this.currentUserId) {
      await this.fetchFavorites()
    }
    this.fetchFacilities()
    this.fetchPlaymateRequests()
    this.subscribeFavoritesRealtime() // 👀 watch for changes
  },

  beforeUnmount() {
    if (this.favSubscription) {
      this.favSubscription.unsubscribe()
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
        console.error('Error fetching current user:', err.message)
        this.currentUserId = null
      }
    },

    // 🚪 Logout
    async logout() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        localStorage.clear()
        this.$router.push({ name: 'signin' })
      } catch (err) {
        console.error('Logout failed:', err.message)
        alert('Failed to logout. Please try again.')
      }
    },

    // ❤️ Toggle favorites
    async toggleFavorite(facilityId) {
      if (!this.currentUserId) {
        alert('Please log in to add favorites.')
        return
      }

      const isFav = this.isFavorite(facilityId)

      try {
        if (isFav) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', this.currentUserId)
            .eq('facility_id', facilityId)
          if (error) throw error

          this.favoriteIds = this.favoriteIds.filter((id) => id !== facilityId)
          this.favorites = this.favorites.filter((f) => f.id !== facilityId)
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert([{ user_id: this.currentUserId, facility_id: facilityId }])
          if (error) throw error
          await this.fetchFavorites()
        }
      } catch (err) {
        console.error('Error toggling favorite:', err.message)
      }
    },

    // ❤️ Check if facility is in favorites
    isFavorite(facilityId) {
      return this.favoriteIds.includes(facilityId)
    },

    // 🧠 Fetch all favorite facilities (JOIN)
    async fetchFavorites() {
      if (!this.currentUserId) return
      this.loading = true
      try {
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

        this.favorites = data.map((f) => ({
          id: f.facilities.id,
          facility_name: f.facilities.facility_name,
          address: f.facilities.address,
          facility_type: f.facilities.facility_type,
          image_url: f.facilities.image_url,
          price_per_hour: f.facilities.price_per_hour,
        }))
        this.favoriteIds = this.favorites.map((f) => f.id)
        console.log('⭐ Favorites loaded:', this.favorites)
      } catch (err) {
        console.error('Error fetching favorites:', err.message)
      } finally {
        this.loading = false
      }
    },

    // 🔁 Real-time updates for favorites
    async subscribeFavoritesRealtime() {
      this.favSubscription = supabase
        .channel('favorites-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${this.currentUserId}`,
          },
          async () => {
            console.log('🔄 Favorites updated, refetching...')
            await this.fetchFavorites()
          },
        )
        .subscribe()
    },

    // 🏃 Other existing functions
    isCreator(creatorId) {
      return this.currentUserId === creatorId
    },

    handlePlaymateAction(request) {
      if (this.isCreator(request.creator_id)) {
        this.$router.push({ name: 'playmate-requests' })
      } else {
        this.goToPlaymateRequests()
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    },

    formatTime(timeString) {
      if (!timeString) return ''
      const [hours, minutes] = timeString.split(':')
      const tempDate = new Date()
      tempDate.setHours(hours, minutes)
      return tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    },

    goToPlaymateRequests() {
      this.$router.push({ name: 'playmate-requests' })
    },

    async fetchPlaymateRequests() {
      this.playmateLoading = true
      try {
        const { data, error } = await supabase
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name)')
          .eq('status', 'open')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(3)

        if (error) throw error

        this.playmateRequests = data.map((req) => ({
          ...req,
          creator_name: req.creator?.full_name || 'Anonymous',
        }))
      } catch (err) {
        console.error('Error fetching playmate requests:', err.message)
      } finally {
        this.playmateLoading = false
      }
    },

    async fetchFacilities() {
      this.loading = true
      try {
        const { data, error } = await supabase.from('facilities').select('*').limit(5)
        if (error) throw error

        this.facilities = data.map((f) => ({
          id: f.id,
          name: f.facility_name,
          type: f.facility_type,
          address: f.address,
          rating: f.rating || '4.5',
          reviews: f.reviews || '0',
          price: f.price_per_hour,
          image: f.image_url,
        }))
      } catch (err) {
        console.error('Error fetching facilities:', err.message)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      app
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
      flat
    >
      <v-toolbar-title class="font-weight-bold ml-1">RESERVO</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon><v-icon>mdi-magnify</v-icon></v-btn>
      <v-btn icon @click="logout"><v-icon color="red">mdi-logout</v-icon></v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-0">
        <!-- Playmates -->
        <v-row no-gutters class="px-4 pt-10">
          <v-col cols="12" class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-medium">Find Playmates</h2>
            <v-btn text small color="blue" @click="goToPlaymateRequests">
              View All <v-icon right small>mdi-chevron-right</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="12">
            <div v-if="playmateLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue" />
            </div>

            <div v-else-if="playmateRequests.length === 0" class="text-center grey--text py-4">
              No playmate requests found.
            </div>

            <v-col v-else cols="12" v-for="req in playmateRequests" :key="req.id" class="mb-3 pa-0">
              <v-card class="pa-3 d-flex align-center" rounded="lg" elevation="1">
                <v-avatar color="blue lighten-4" size="44" class="mr-4">
                  <span class="white--text font-weight-bold">{{ req.creator_name[0] }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-semibold text-body-1">
                    {{ req.creator_name }} • {{ req.sport }}
                  </div>
                  <div class="text-caption grey--text d-flex align-center">
                    <v-icon x-small class="mr-1">mdi-calendar-today</v-icon>
                    {{ formatDate(req.date) }}
                    <v-icon x-small class="ml-3 mr-1">mdi-clock-outline</v-icon>
                    {{ formatTime(req.start_time) }}
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  small
                  :color="isCreator(req.creator_id) ? 'orange darken-1' : 'blue'"
                  dark
                  rounded
                  @click="handlePlaymateAction(req)"
                >
                  {{ isCreator(req.creator_id) ? 'Manage' : 'Join' }}
                </v-btn>
              </v-card>
            </v-col>
          </v-col>
        </v-row>

        <!-- Facilities -->
        <v-row no-gutters class="facilities-section px-4 mt-5 mb-10">
          <v-col cols="12" class="mb-3">
            <h2 class="text-h6 font-weight-medium">Popular Facilities</h2>
          </v-col>

          <v-col cols="12">
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue" />
            </div>

            <div v-else-if="facilities.length === 0" class="text-center py-4 grey--text">
              No facilities available.
            </div>

            <div v-else class="d-flex overflow-x-auto pb-2 facility-scroll-container">
              <v-card
                v-for="facility in facilities"
                :key="facility.id"
                class="mr-4 flex-shrink-0"
                width="280"
                rounded="lg"
              >
                <v-img :src="facility.image" height="150" class="grey lighten-3">
                  <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                    <v-chip x-small dark color="black" class="text-overline font-weight-bold">
                      {{ facility.type }}
                    </v-chip>
                    <v-btn icon dark @click.stop="toggleFavorite(facility.id)">
                      <v-icon :color="isFavorite(facility.id) ? 'red' : 'grey'">
                        {{ isFavorite(facility.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
                      </v-icon>
                    </v-btn>
                  </v-card-text>
                </v-img>

                <v-card-title class="pb-1 text-body-1 font-weight-semibold pt-3">
                  {{ facility.name }}
                </v-card-title>

                <v-card-text class="py-0">
                  <div class="text-caption grey--text text-truncate mb-2">
                    {{ facility.address }}
                  </div>
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="d-flex align-center">
                      <v-icon small color="amber">mdi-star</v-icon>
                      <span class="text-caption ml-1 font-weight-medium">4.5 (10)</span>
                    </div>
                    <v-chip color="green darken-1" dark small> ₱{{ facility.price }}/hour </v-chip>
                  </div>
                </v-card-text>

                <v-card-actions class="pt-0 pr-3 pb-3 justify-end">
                  <v-btn small color="blue" dark rounded>View Details</v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation app fixed color="white">
      <v-btn value="search"><v-icon large color="blue">mdi-magnify</v-icon></v-btn>
      <v-btn value="calendar"
        ><v-icon large color="grey darken-1">mdi-calendar-month-outline</v-icon></v-btn
      >
      <v-btn value="favorites" @click="$router.push({ name: 'favorites' })">
        <v-icon large color="red">mdi-heart</v-icon>
      </v-btn>
      <v-btn value="profile" to="/customer_profile">
        <v-icon large color="grey darken-1">mdi-account-circle-outline</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
.search-prompt-container {
  position: absolute;
  bottom: -30px;
  width: 100%;
}
.floating-search-card {
  border-radius: 12px !important;
  width: 90%;
  text-align: center;
  background-color: white;
}
.floating-search-card .white--text {
  color: #007acc !important;
}
.facility-scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.facility-scroll-container::-webkit-scrollbar {
  display: none;
}
</style>
