<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'CustomerBookings',
  data: () => ({
    activeNav: 'bookings',
    currentUserId: null,
    // Tabs for filtering bookings
    tab: 0,
    tabs: ['Accepted', 'Pending', 'Cancelled', 'Rejected', 'Completed'],

    // Booking data
    bookings: [],
    loading: true,
    error: null,
  }),

  computed: {
    // 🔑 FIX: Implement Sorting Function to be used by all lists
    sortedByDateTime() {
      // Create a copy to sort and ensure both date and time are used
      return [...this.bookings].sort((a, b) => {
        const dateA = new Date(a.full_start_timestamp).getTime()
        const dateB = new Date(b.full_start_timestamp).getTime()

        // Sort ascending (nearest date/time first)
        return dateA - dateB
      })
    },

    filteredBookings() {
      const selectedTabIndex = this.tab

      // Use the globally sorted array as the base
      const list = this.sortedByDateTime

      // 0 = Accepted, 1 = Pending, 2 = Cancelled, 3 = Rejected
      if (selectedTabIndex === 0) {
        return list.filter((b) => b.status === 'accepted').reverse()
      }
      if (selectedTabIndex === 1) {
        return list.filter((b) => b.status === 'pending')
      }
      if (selectedTabIndex === 2) {
        return list.filter((b) => b.status === 'cancelled').reverse()
      }
      if (selectedTabIndex === 3) {
        // Accept both 'rejected' and 'declined' DB values if present
        return list.filter((b) => ['rejected', 'declined'].includes(b.status))
      }

      if (selectedTabIndex === 4) {
        return list
          .filter((b) => b.status === 'completed')
          .sort((a, b) => new Date(b.full_end_timestamp) - new Date(a.full_end_timestamp))
      }

      return []
    },

    currentTabTitle() {
      return this.tabs[this.tab]
    },
  },

  async mounted() {
    await this.getCurrentUser()
    if (this.currentUserId) {
      await this.fetchBookings()
      await this.markCompletedBookings()
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

    isHistory(booking) {
      if (!booking) return false
      try {
        if (booking.status === 'history') return true
        const end = new Date(booking.full_end_timestamp).getTime()
        const cutoff = end + 24 * 60 * 60 * 1000
        return Date.now() > cutoff
      } catch (e) {
        return false
      }
    },

    async markCompletedBookings() {
      const now = new Date()

      const completedIds = this.bookings
        .filter((b) => new Date(b.full_end_timestamp) < now && b.status === 'accepted')
        .map((b) => b.id)

      if (completedIds.length > 0) {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .in('id', completedIds)

        if (error) {
          console.error('Failed to mark completed bookings:', error.message)
        } else {
          console.log('✅ Completed bookings updated successfully.')
        }
      }

      const historyCutoffIds = this.bookings
        .filter((b) => {
          const endTime = new Date(b.full_end_timestamp).getTime()
          const historyCutoff = endTime + 24 * 60 * 60 * 1000 // 1 day later
          return now.getTime() > historyCutoff && ['accepted', 'completed'].includes(b.status)
        })
        .map((b) => b.id)

      if (historyCutoffIds.length > 0) {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'history' })
          .in('id', historyCutoffIds)

        if (error) {
          console.error('Failed to move to history:', error.message)
        }
      }

      if (completedIds.length > 0 || historyCutoffIds.length > 0) {
        await this.fetchBookings()
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
          .select(
            `
                  id,
                  facility_id,
                  booking_date,
                  start_time,
                  end_time,
                  status,
                  facilities (facility_name, address, price_per_hour, image_url)
              `,
          )
          .eq('user_id', this.currentUserId)
        // ❌ REMOVED .order() CALLS. We let the computed property handle all sorting.

        if (error) throw error

        // Map data to a cleaner format and create the required full timestamps
        this.bookings = data.map((b) => {
          // This mapping is crucial for client-side date comparison
          const startTimestamp = `${b.booking_date}T${b.start_time}`
          const endTimestamp = `${b.booking_date}T${b.end_time}`

          return {
            ...b,
            facility_id: b.facility_id,
            facility_name: b.facilities.facility_name,
            address: b.facilities.address,
            price_per_hour: b.facilities.price_per_hour,
            image_url: b.facilities.image_url,
            facilities: undefined,
            full_start_timestamp: startTimestamp,
            full_end_timestamp: endTimestamp,
          }
        })
      } catch (err) {
        this.error = 'Failed to load bookings.'
        console.error('Error fetching bookings:', err.message)
      } finally {
        this.loading = false
      }
    },

    async markAsCompleted(bookingId) {
      try {
        this.loading = true
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', bookingId)
          .eq('user_id', this.currentUserId)

        if (error) throw error

        // Refresh list so the booking moves to Completed tab
        await this.fetchBookings()

        alert('Booking marked as completed.')
      } catch (err) {
        console.error('Error marking booking as completed:', err.message)
        alert('Failed to mark booking as completed.')
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
      const date = new Date(fullTimestamp)
      if (isNaN(date.getTime())) return 'Invalid Date'

      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },

    // ⌚ Utility function for time formatting
    formatTime(fullTimestamp) {
      if (!fullTimestamp) return ''

      try {
        const dateTime = new Date(fullTimestamp)

        if (isNaN(dateTime.getTime())) {
          return 'Invalid Time'
        }

        // Format the time (e.g., 03:00 PM)
        return dateTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      } catch (e) {
        return 'Invalid Time'
      }
    },

    // 🏷 Get color based on status (Confirmed correct)
    getStatusColor(status) {
      switch (status) {
        case 'accepted':
          return 'green'
        case 'pending':
          return 'orange'
        case 'rejected':
        case 'cancelled':
          return 'red'
        case 'completed':
          return 'blue'
        default:
          return 'grey'
      }
    },

    // 🗑 Handle cancellation logic
    async cancelBooking(bookingId) {
      if (!confirm('Are you sure you want to cancel this booking?')) return

      try {
        this.loading = true
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
          .eq('user_id', this.currentUserId)

        if (error) throw error

        // refresh local list
        await this.fetchBookings()

        // NOTE: facility details page frees the slot because it excludes 'cancelled' bookings
        // when building reservedSlots (your facility page already uses .neq('status','cancelled'))
        alert('Booking cancelled successfully.')
      } catch (err) {
        console.error('Error cancelling booking:', err.message)
        alert('Failed to cancel booking. Please try again.')
      } finally {
        this.loading = false
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
                    <p class="mt-2 text-caption grey--text">
                      Loading {{ currentTabTitle }} bookings...
                    </p>
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
                            width="100%"
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
                          <v-list-item-title
                            class="font-weight-semibold text-body-1 mb-2"
                            text-wrap
                          >
                            {{ booking.facility_name }}
                          </v-list-item-title>

                          <v-list-item-subtitle class="text-caption mt-2">
                            <v-icon x-small>mdi-calendar-range</v-icon>
                            {{ formatDate(booking.start_time) }}
                          </v-list-item-subtitle>

                          <v-list-item-subtitle class="text-caption mt-2">
                            <v-icon x-small>mdi-clock-time-four-outline</v-icon>
                            {{ formatTime(booking.start_time) }} -
                            {{ formatTime(booking.end_time) }}
                          </v-list-item-subtitle>

                          <v-list-item-subtitle class="text-caption">
                            <div class="d-flex align-center ml-auto mt-2">
                              <v-btn
                                v-if="['accepted', 'pending'].includes(booking.status)"
                                small
                                text
                                color="red darken-1"
                                @click="cancelBooking(booking.id)"
                                class="btn-cancel"
                              >
                                Cancel
                              </v-btn>

                              <!-- ✅ New Completed Button -->
                              <v-btn
                                v-if="booking.status === 'accepted'"
                                small
                                text
                                color="green darken-2"
                                class="ml-2"
                                @click="markAsCompleted(booking.id)"
                              >
                                Completed
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
                                @click="
                                  $router.push({
                                    name: 'facility-details',
                                    params: { id: booking.facility_id },
                                  })
                                "
                              >
                                Rate
                              </v-btn>

                              <!-- Cancelled or Rejected: show static chip -->
                              <v-chip
                                v-else-if="
                                  ['cancelled', 'rejected', 'declined'].includes(booking.status)
                                "
                                small
                                outlined
                                color="grey"
                              >
                                {{
                                  booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
                                }}
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
    <v-bottom-navigation app fixed color="white" light v-model="activeNav">
      <v-btn value="home" @click="$router.push({ name: 'customer-dashboard' })">
        <v-icon size="29" :color="activeNav === 'home' ? 'blue' : 'black'">mdi-home</v-icon>
      </v-btn>
      <v-btn value="bookings" @click="$router.push({ name: 'customer-bookings' })">
        <v-icon size="27" :color="activeNav === 'bookings' ? 'blue' : 'black'"
          >mdi-calendar-check</v-icon
        >
      </v-btn>
      <v-btn value="favorites" @click="$router.push({ name: 'favorites' })">
        <v-icon size="27" :color="activeNav === 'favorites' ? 'blue' : 'black'">mdi-heart</v-icon>
      </v-btn>
      <v-btn value="profile" @click="$router.push({ name: 'customer-profile' })">
        <v-icon size="32" :color="activeNav === 'profile' ? 'blue' : 'black'">mdi-account</v-icon>
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
