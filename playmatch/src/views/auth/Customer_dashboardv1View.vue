<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'ReservoSportBookingHome',
  data: () => ({
    currentUserId: null,
    playmateRequests: [],
    playmateLoading: false,
    facilities: [],
    favorites: [],
    favoriteIds: [],
    loading: false,
    error: null,

    // ⭐ Rating dialog state
    ratingDialog: {
      visible: false,
      facility: null,
      value: 0,
    },
  }),

  async mounted() {
    await this.getCurrentUser()
    if (this.currentUserId) {
      await this.fetchFavorites()
    }
    await this.fetchFacilities()
    this.fetchPlaymateRequests()
    this.subscribeFavoritesRealtime()
    this.subscribeRatingsRealtime()
  },

  beforeUnmount() {
    if (this.favSubscription) this.favSubscription.unsubscribe()
    if (this.ratingSubscription) this.ratingSubscription.unsubscribe()
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
        this.currentUserId = null
        this.ratingDialog = { visible: false, facility: null, value: 0 }
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

    // ❤️ Check if facility is favorite
    isFavorite(facilityId) {
      return this.favoriteIds.includes(facilityId)
    },

    // 🧠 Fetch favorites
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

    // 🔁 Subscribe to real-time favorites
    async subscribeFavoritesRealtime() {
      if (!this.currentUserId) return
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

    // ⭐ Subscribe to real-time ratings
    async subscribeRatingsRealtime() {
      this.ratingSubscription = supabase
        .channel('ratings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ratings',
          },
          async () => {
            console.log('🔄 Ratings updated, refetching facilities...')
            // This call ensures all users get the consistent, server-calculated average
            await this.fetchFacilities()
          },
        )
        .subscribe()
    },

    // ⭐ Open rating dialog
    async openRatingDialog(facility) {
      if (!this.currentUserId) {
        alert('Please log in to rate facilities.')
        return
      }

      this.ratingDialog.facility = facility
      this.ratingDialog.value = facility.myRating || 0
      this.ratingDialog.visible = true
    },

    // 🚪 Close rating dialog
    closeRatingDialog() {
      this.ratingDialog.visible = false
      this.ratingDialog.facility = null
      this.ratingDialog.value = 0
    },

    // 💾 Submit or update rating
    async submitRating() {
      if (!this.ratingDialog.value) {
        alert('Please select a star rating first.')
        return
      }

      try {
        const { facility, value } = this.ratingDialog

        // Check if a rating already exists for this user and facility
        const { data: existing, error: fetchError } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', facility.id)
          .limit(1)

        if (fetchError) throw fetchError

        const existingRatingId = existing && existing.length > 0 ? existing[0].id : null

        if (existingRatingId) {
          // Update existing rating
          const { error: updateError } = await supabase
            .from('ratings')
            .update({ rating_value: value })
            .eq('id', existingRatingId)
          if (updateError) throw updateError
        } else {
          // Insert new rating
          const { error: insertError } = await supabase.from('ratings').insert([
            {
              user_id: this.currentUserId,
              facility_id: facility.id,
              rating_value: value,
            },
          ])
          if (insertError) throw insertError
        }

        // ❌ REMOVED: The previous manual/optimistic local update logic is removed.
        // The real-time subscription will now handle the UI refresh (via fetchFacilities),
        // ensuring the UI is consistently updated with the single source of truth (the database).

        this.closeRatingDialog()
      } catch (err) {
        console.error('Error submitting rating:', err.message)
        alert('Failed to submit rating. Please try again.')
      }
    },

    // 🏟 Fetch facilities with average + user-specific rating
    async fetchFacilities() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select(
            `
             id,
             facility_name,
             facility_type,
             address,
             price_per_hour,
             image_url,
             ratings:ratings(user_id, rating_value)
           `,
          )
          .limit(5)

        if (error) throw error

        this.facilities = data.map((f) => {
          const ratings = f.ratings || []
          const ratingCount = ratings.length
          const averageRating =
            ratingCount > 0
              ? (ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratingCount).toFixed(1)
              : '0.0'

          const myRating = this.currentUserId
            ? ratings.find((r) => r.user_id === this.currentUserId)?.rating_value || 0
            : 0

          return {
            id: f.id,
            name: f.facility_name,
            type: f.facility_type,
            address: f.address,
            price: f.price_per_hour,
            image: f.image_url,
            rating: averageRating,
            reviews: ratingCount,
            myRating, // User's own rating
            ratings, // Retained as the source of truth from DB for new fetches
          }
        })
      } catch (err) {
        console.error('Error fetching facilities:', err.message)
      } finally {
        this.loading = false
      }
    },

    // 🏃 Playmate helpers
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
  },
}
</script>

<template>
  <v-app>
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
      <v-toolbar-title class="font-weight-bold ml-1">RESERVO</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon><v-icon>mdi-magnify</v-icon></v-btn>
      <v-btn icon @click="logout"><v-icon color="red">mdi-logout</v-icon></v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-0">
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
                @click="$router.push({ name: 'facility-details', params: { id: facility.id } })"
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
                      <span class="text-caption ml-1 font-weight-medium">
                        {{ facility.rating }} ({{ facility.reviews }})
                      </span>
                    </div>
                    <v-chip color="green darken-1" dark small> ₱{{ facility.price }}/hour </v-chip>
                  </div>
                </v-card-text>

                <v-card-actions class="pt-0 pr-3 pb-3 justify-end">
                  <v-btn
                    small
                    color="blue"
                    dark
                    rounded
                    @click.stop="
                      $router.push({ name: 'facility-details', params: { id: facility.id } })
                    "
                    >View Details</v-btn
                  >
                  <v-btn
                    small
                    :color="facility.myRating > 0 ? 'orange darken-1' : 'amber'"
                    dark
                    rounded
                    @click.stop="openRatingDialog(facility)"
                  >
                    {{ facility.myRating > 0 ? 'Edit Rate' : 'Rate' }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-dialog v-model="ratingDialog.visible" max-width="400">
      <v-card>
        <v-card-title class="font-weight-bold">
          Rate {{ ratingDialog.facility?.name }}
        </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center my-4">
            <v-icon
              v-for="n in 5"
              :key="n"
              large
              :color="n <= ratingDialog.value ? 'amber' : 'grey'"
              class="mx-1"
              @click="ratingDialog.value = n"
            >
              {{ n <= ratingDialog.value ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="closeRatingDialog">Cancel</v-btn>
          <v-btn color="blue" dark @click="submitRating">Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-bottom-navigation app fixed color="white" light>
      <v-btn @click="$router.push({ name: 'home' })"><v-icon>mdi-home</v-icon></v-btn>
      <v-btn @click="goToPlaymateRequests"><v-icon>mdi-account-group</v-icon></v-btn>
      <v-btn @click="$router.push({ name: 'favorites' })"><v-icon>mdi-heart</v-icon></v-btn>
      <v-btn @click="$router.push({ name: 'profile' })"><v-icon>mdi-account</v-icon></v-btn>
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
