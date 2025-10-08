<template>
  <v-app>
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

      <v-btn icon to="/profile">
        <v-icon>mdi-account-circle</v-icon>
      </v-btn>

      <template v-slot:extension>
        <div class="d-flex justify-center w-100 search-prompt-container">
          <v-card class="floating-search-card pa-3 mx-4" elevation="4">
            <div class="text-subtitle-1 white--text font-weight-medium">
              Book courts and find playmates nearby
            </div>
          </v-card>
        </div>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-0">
        <v-row no-gutters class="map-section px-4 pt-10">
          <v-col cols="12" class="d-flex justify-center pt-2 pb-4">
            <v-card
              rounded="lg"
              width="100%"
              height="200px"
              class="grey lighten-3 elevation-3 map-placeholder"
            >
              <div class="map-visual">
                <v-icon class="map-marker marker-1" color="red">mdi-map-marker</v-icon>
                <v-icon class="map-marker marker-2" color="red">mdi-map-marker</v-icon>
                <v-icon class="map-marker marker-3" color="red">mdi-map-marker</v-icon>
              </div>
              <div class="map-controls">
                <v-btn fab small class="mb-1" color="white" elevation="2">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn fab small color="white" elevation="2">
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row no-gutters class="playmates-section px-4">
          <v-col cols="12" class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-medium">Find Playmates</h2>
            <v-btn
              text
              small
              color="blue"
              class="text-capitalize font-weight-bold"
              @click="goToPlaymateRequests"
            >
              View <v-icon right small>mdi-chevron-right</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="12">
            <div v-if="playmateLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue"></v-progress-circular>
            </div>

            <div v-else-if="playmateRequests.length === 0" class="text-center py-4">
              <p class="grey--text">
                No playmate requests found. You can be the first to <br />
                create one by clicking "See all"!
              </p>
            </div>

            <v-col
              v-else
              cols="12"
              v-for="request in playmateRequests"
              :key="request.id"
              class="mb-3 pa-0"
            >
              <v-card class="pa-3 d-flex align-center" rounded="lg" elevation="1">
                <v-avatar color="blue lighten-4" size="44" class="mr-4">
                  <span class="white--text font-weight-bold">
                    {{ request.creator_name ? request.creator_name[0] : 'U' }}
                  </span>
                </v-avatar>

                <div>
                  <div class="font-weight-semibold text-body-1">
                    {{ request.creator_name || 'User' }} • {{ request.sport }}
                  </div>
                  <div class="text-caption grey--text d-flex align-center">
                    <v-icon x-small class="mr-1">mdi-calendar-today</v-icon>
                    {{ formatDate(request.date) }}
                    <v-icon x-small class="ml-3 mr-1">mdi-clock-outline</v-icon>
                    {{ formatTime(request.start_time) }}
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn small color="blue" dark rounded>Join</v-btn>
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
              <v-progress-circular indeterminate color="blue"></v-progress-circular>
            </div>

            <div v-else-if="facilities.length === 0" class="text-center py-4 grey--text">
              No facilities registered yet.
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
                <v-img
                  height="150"
                  :src="facility.image || '/images/default-facility.jpg'"
                  class="grey lighten-3"
                >
                  <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                    <v-chip
                      x-small
                      dark
                      color="black"
                      class="text-overline font-weight-bold"
                      style="opacity: 0.7"
                    >
                      {{ facility.type }}
                    </v-chip>
                    <v-btn icon dark><v-icon>mdi-heart-outline</v-icon></v-btn>
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
                    <v-chip color="green darken-1" dark small>
                      <span class="font-weight-bold">₱{{ facility.price }}</span>
                      <span class="text-caption ml-1 font-weight-light">/hour</span>
                    </v-chip>
                  </div>
                </v-card-text>

                <v-card-actions class="pt-0 pr-3 pb-3 justify-end">
                  <v-btn
                    value="details"
                    :to="{ name: 'facility-details', params: { id: facility.id } }"
                    small
                    color="blue"
                    dark
                    rounded
                    >View Details</v-btn
                  >
                </v-card-actions>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-bottom-navigation app fixed color="white" light>
      <v-btn value="search">
        <v-icon large color="blue">mdi-magnify</v-icon>
      </v-btn>
      <v-btn value="calendar">
        <v-icon large color="grey darken-1">mdi-calendar-month-outline</v-icon>
      </v-btn>
      <v-btn value="favorites">
        <v-icon large color="grey darken-1">mdi-heart-outline</v-icon>
      </v-btn>
      <v-btn value="profile" to="/customer_profile">
        <v-icon large color="grey darken-1">mdi-account-circle-outline</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
// NOTE: Ensure '@/supabaseClient' is correctly configured in your project
import { supabase } from '@/supabaseClient'

export default {
  name: 'ReservoSprotBookingHome',
  data: () => ({
    // Removed static playmates
    playmateRequests: [],
    playmateLoading: false,
    facilities: [],
    loading: false,
    error: null,
  }),
  async mounted() {
    this.fetchFacilities()
    this.fetchPlaymateRequests()
  },
  methods: {
    // --- Utility Methods ---
    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    },
    formatTime(timeString) {
      if (!timeString) return ''
      // Time string is typically 'HH:MM:SS', we use a temporary date object to format it
      const [hours, minutes] = timeString.split(':')
      const tempDate = new Date()
      tempDate.setHours(hours, minutes)
      return tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    },
    // --- Navigation ---
    goToPlaymateRequests() {
      // NOTE: You'll need to configure a route named 'playmate-requests'
      this.$router.push({ name: 'playmate-requests' })
    },

    // --- Data Fetching Methods ---
    async fetchPlaymateRequests() {
      this.playmateLoading = true
      try {
        // 1. Fetch playmate requests that are open and in the future
        const { data: requestsData, error: requestsError } = await supabase
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name)') // Select all columns and the creator's full_name via the foreign key
          .eq('status', 'open')
          .gte('date', new Date().toISOString().split('T')[0]) // Only requests from today onward
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (requestsError) throw requestsError

        // 2. Process data to flatten creator name
        this.playmateRequests = requestsData.map((request) => ({
          ...request,
          creator_name: request.creator?.full_name || 'Anonymous', // Use 'Anonymous' if profile is missing
        }))
      } catch (err) {
        console.error('Error fetching playmate requests:', err.message)
      } finally {
        this.playmateLoading = false
      }
    },

    async fetchFacilities() {
      this.loading = true
      this.error = null
      try {
        // NOTE: This assumes you have a 'facilities' table in your Supabase database
        const { data, error } = await supabase.from('facilities').select('*')
        if (error) throw error

        this.facilities = data.map((facility) => ({
          id: facility.id,
          name: facility.facility_name,
          type: facility.facility_type,
          address: facility.address,
          rating: facility.rating || '4.5',
          reviews: facility.reviews || '0',
          price: facility.price_per_hour,
          image: facility.image_url,
        }))
      } catch (err) {
        console.error('Error fetching facilities:', err.message)
        this.error = 'Failed to load facilities.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
/* UPDATED: Header bar with Blue/Sky Blue gradient */
.header-gradient {
  background: linear-gradient(135deg, #007acc 0%, #00c6ff 100%) !important;
}

/* Floating search card positioning */
.search-prompt-container {
  position: absolute;
  bottom: -30px; /* Position the card to float below the extended header */
  width: 100%;
}
.floating-search-card {
  border-radius: 12px !important;
  width: 90%;
  text-align: center;
  /* Since the header is dark, make the floating card text white for contrast */
  background-color: white;
}
.floating-search-card .white--text {
  color: #007acc !important; /* Make the text blue when card is white */
  caret-color: #007acc !important;
}

.map-section {
  padding-top: 50px !important; /* Offset for the floating search card */
}
/* UPDATED: Map placeholder with a softer Blue gradient */
.map-placeholder {
  position: relative;
  overflow: hidden;
  /* Soft blue gradient for a map look */
  background-image: linear-gradient(to bottom right, #bbdefb, #e1f5fe);
}
.map-visual {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.map-controls {
  position: absolute;
  right: 15px;
  top: 15px;
  display: flex;
  flex-direction: column;
}
.map-marker {
  position: absolute;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 30px;
}
.marker-1 {
  top: 30%;
  left: 30%;
}
.marker-2 {
  top: 60%;
  left: 55%;
}
.marker-3 {
  top: 45%;
  left: 70%;
}
/* Hide scrollbar for horizontal facility section */
.facility-scroll-container {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.facility-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
</style>
