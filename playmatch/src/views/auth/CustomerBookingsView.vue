<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'CustomerBookings',
  data: () => ({
    activeNav: 'bookings',
    currentUserId: null,
    // Tabs for filtering bookings
    tab: 0, 
    tabs: ['Accepted', 'Pending', 'History'],
    
    // Booking data
    bookings: [],
    loading: true,
    error: null,
  }),

  computed: {
    // 💡 Filters the bookings based on the selected tab
    filteredBookings() {
      const statusMap = {
        0: 'accepted', // 'Accepted' tab
        1: 'pending',  // 'Pending' tab
        2: ['completed', 'declined', 'cancelled'], // 'History' tab
      }
      const selectedStatus = statusMap[this.tab]

      if (Array.isArray(selectedStatus)) {
        return this.bookings.filter(b => selectedStatus.includes(b.status))
      }
      return this.bookings.filter(b => b.status === selectedStatus)
    },
    
    // Simple display for the current tab title
    currentTabTitle() {
      return this.tabs[this.tab]
    }
  },

  async mounted() {
    await this.getCurrentUser()
    if (this.currentUserId) {
      await this.fetchBookings()
      this.subscribeBookingsRealtime()
    }
  },

  beforeUnmount() {
    if (this.bookingSubscription) this.bookingSubscription.unsubscribe()
  },

  methods: {
    // 🧍 Get logged-in user 
    async getCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        this.currentUserId = data.user?.id || null
      } catch (err) {
        console.error('Error fetching current user:', err.message)
        this.currentUserId = null
      }
    },

    // 📅 Fetch all customer bookings
    async fetchBookings() {
      if (!this.currentUserId) return
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            status,
            facilities (facility_name, address, price_per_hour, image_url)
          `)
          .eq('user_id', this.currentUserId)
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: false })

        if (error) throw error
        
        // Map data to a cleaner format and create the required full timestamps
        this.bookings = data.map(b => {
            // FIX: Create full TIMESTAMP strings (e.g., '2025-10-27T09:00:00')
            const startTimestamp = `${b.booking_date}T${b.start_time}`;
            const endTimestamp = `${b.booking_date}T${b.end_time}`;
            
            return {
                ...b,
                facility_name: b.facilities.facility_name,
                address: b.facilities.address,
                price_per_hour: b.facilities.price_per_hour,
                image_url: b.facilities.image_url,
                facilities: undefined, // remove nested object
                
                // New properties used in the template
                full_start_timestamp: startTimestamp,
                full_end_timestamp: endTimestamp,
            };
        });
        
      } catch (err) {
          this.error = 'Failed to load bookings.'
          console.error('Error fetching bookings:', err.message)
      } finally {
          this.loading = false
      }
    },
    
    
    // 🔁 Subscribe to real-time changes
    async subscribeBookingsRealtime() {
        if (!this.currentUserId) return
        this.bookingSubscription = supabase
            .channel('customer-bookings-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `user_id=eq.${this.currentUserId}`,
                },
                async () => {
                    console.log('🔄 Booking status updated, refetching...')
                    await this.fetchBookings()
                },
            )
            .subscribe()
    },

    // 📅 Utility function for date formatting
    formatDate(fullTimestamp) { 
        if (!fullTimestamp) return ''
        const date = new Date(fullTimestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
    },

    // ⌚ Utility function for time formatting
    formatTime(fullTimestamp) { 
        if (!fullTimestamp) return '';
        
        try {
            const dateTime = new Date(fullTimestamp); 
            
            if (isNaN(dateTime.getTime())) {
                return 'Invalid Time';
            }

            // Format the time (e.g., 03:00 PM)
            return dateTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
        } catch (e) {
            return 'Invalid Time';
        }
    },

    // 🏷 Get color based on status (Confirmed correct)
    getStatusColor(status) {
      switch (status) {
        case 'accepted':
          return 'green'
        case 'pending':
          return 'orange'
        case 'declined':
        case 'cancelled':
          return 'red'
        case 'completed':
          return 'blue-grey'
        default:
          return 'grey'
      }
    },
    
    // 🗑 Handle cancellation logic
    async cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        try {
            this.loading = true;
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId)
                .eq('user_id', this.currentUserId); 
                
            if (error) throw error;
            
            alert('Booking cancelled successfully.');
            await this.fetchBookings(); 
        } catch (err) {
            console.error('Error cancelling booking:', err.message);
            alert('Failed to cancel booking. Please try again.');
        } finally {
            this.loading = false;
        }
    }
  }
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
      <v-btn icon @click="$router.go(-1)">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>

      <v-toolbar-title class="font-weight-bold ml-3 text-white">My Bookings</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container>
          <v-tabs
            v-model="tab"
            background-color="transparent"
            color="blue"
            class="mb-4 mt-2"
            fixed-tabs
            slider-color="blue darken-2"
            centered
            :slider-size="0"
            next-icon="mdi-arrow-right"
            prev-icon="mdi-arrow-left"
          >
            <v-tab v-for="item in tabs" :key="item">{{ item }}</v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item v-for="n in tabs.length" :key="n" :value="n - 1">
              <v-card-text>
                <v-row>
                  <v-col>
                    <div v-if="loading" class="text-center py-5">
                      <v-progress-circular indeterminate color="blue" />
                      <p class="mt-2 text-caption grey--text">Loading {{ currentTabTitle }} bookings...</p>
                    </div>

                    <div v-else-if="error" class="text-center py-5">
                      <v-alert type="error" text class="ma-3">{{ error }}</v-alert>
                    </div>

                    <div v-else-if="filteredBookings.length === 0" class="text-center py-5">
                      <v-icon large color="grey lighten-1">mdi-calendar-remove-outline</v-icon>
                      <p class="mt-2 text-subtitle-1 grey--text">
                        No {{ currentTabTitle.toLowerCase() }} bookings found.
                      </p>
                    </div>

                    <v-list two-line v-else class="transparent-list">
                      <v-list-item 
                        v-for="booking in filteredBookings"
                        :key="booking.id"
                        class="mb-3 pa-0"
                      >
                        <v-card class="d-flex pa-3" width="100%" rounded="lg" elevation="1">
                          
                          <div class="mr-3 ml-1 d-flex flex-column align-center">
                              <v-img 
                                  :src="booking.image_url || '/images/default-facility.jpg'" 
                                  height="100" 
                                  width="100" 
                                  class="rounded-lg grey lighten-3"
                                  cover
                              >
                                  <v-chip
                                      x-small
                                      :color="getStatusColor(booking.status)"
                                      dark
                                      class="ma-1 font-weight-bold"
                                  >
                                  {{ booking.status.toUpperCase() }}
                                  </v-chip>
                              </v-img>
                          </div>

                          <div class="flex-grow-1">
                              <v-list-item-title class="font-weight-semibold text-body-1 mb-2" text-wrap>
                                  {{ booking.facility_name }}
                              </v-list-item-title>
                              
                              <v-list-item-subtitle class="text-caption mt-2">
                                  <v-icon x-small>mdi-calendar-range</v-icon>
                                  {{ formatDate(booking.start_time) }}
                              </v-list-item-subtitle>

                              <v-list-item-subtitle class="text-caption mt-2">
                                  <v-icon x-small>mdi-clock-time-four-outline</v-icon>
                                  {{ formatTime(booking.start_time) }} - {{ formatTime(booking.end_time) }}
                              </v-list-item-subtitle>
                              
                              <v-list-item-subtitle class="text-caption">
                                  <div class="d-flex align-center ml-auto mt-2">
                                      <v-btn
                                          v-if="booking.status === 'accepted'"
                                          small
                                          text
                                          color="red darken-1"
                                          @click="cancelBooking(booking.id)"
                                      >
                                          Cancel
                                      </v-btn>
                                      
                                      <v-chip
                                          v-else-if="booking.status === 'pending'"
                                          small
                                          outlined
                                          color="orange"
                                      >
                                          Awaiting Approval
                                      </v-chip>

                                      <v-btn
                                          v-else-if="booking.status === 'completed'"
                                          small
                                          text
                                          color="amber"
                                          @click="$router.push({ name: 'facility-details', params: { id: booking.facility_id } })"
                                      >
                                          Rate
                                      </v-btn>

                                      <v-chip 
                                          v-else-if="['declined', 'cancelled'].includes(booking.status)"
                                          small
                                          outlined
                                          color="red"
                                      >
                                          View History
                                      </v-chip>
                                  </div>
                              </v-list-item-subtitle>
                          </div>
                        </v-card>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-window-item>
          </v-window>
      </v-container>
    </v-main>
    <v-bottom-navigation app fixed color="white" light
      v-model="activeNav">
        <v-btn 
          value="home" 
          @click="$router.push({ name: 'customer-dashboard' })"
        >
          <v-icon :color="activeNav === 'home' ? 'blue' : 'black'">mdi-home</v-icon>
        </v-btn>
        <v-btn 
          value="bookings" 
          @click="$router.push({ name: 'customer-bookings' })"
        >
          <v-icon :color="activeNav === 'bookings' ? 'blue' : 'black'">mdi-calendar-check</v-icon>
        </v-btn>
        <v-btn 
          value="favorites" 
          @click="$router.push({ name: 'favorites' })"
        >
          <v-icon :color="activeNav === 'favorites' ? 'blue' : 'black'">mdi-heart</v-icon>
        </v-btn>
        <v-btn 
          value="profile" 
          @click="$router.push({ name: 'customer-profile' })"
        >
          <v-icon :color="activeNav === 'profile' ? 'blue' : 'black'">mdi-account</v-icon>
        </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
/* Inherit background style for cards in the window/list */
.transparent-card {
  background-color: transparent !important;
}
.transparent-list {
  background-color: transparent !important;
}

.v-list-item-title {
    white-space: normal !important; /* Forces wrapping */
    word-break: break-word !important; /* Helps with long words */
}

.v-tab {
    border-radius: 8px !important; 
    margin: 0 4px; /* Add slight margin between tabs for separation */
}

.v-tab--active {
    border-radius: 8px !important;
    background-color: rgba(26, 101, 162, 0.1) !important; /* Light blue background for active state */
}

/* Targets the tab hover and focus state */
.v-tab:hover, 
.v-tab:focus {
    border-radius: 8px !important;
    background-color: rgba(26, 101, 162, 0.05) !important; /* Lighter blue background for hover */
}

/* This is crucial: Hide the default square slider/indicator line */
.v-tabs-slider-wrapper {
    display: none !important;
}
</style>