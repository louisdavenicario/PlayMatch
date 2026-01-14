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

    scrollThumbWidth: 20,
    scrollThumbLeft: 0,
    trackWidth: 80,

    // Rating dialog state
    ratingDialog: {
      visible: false,
      booking: null,
      value: 0,
    },
  }),

  computed: {
    sortedByDateTime() {
      return [...this.bookings].sort((a, b) => {
        const dateA = new Date(a.full_start_timestamp).getTime()
        const dateB = new Date(b.full_start_timestamp).getTime()
        return dateA - dateB
      })
    },

    filteredBookings() {
      const selectedTabIndex = this.tab
      const list = this.sortedByDateTime

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

    if (this.$route.query.tab !== undefined) {
      this.tab = parseInt(this.$route.query.tab)
    }

    this.$nextTick(() => {
      const scrollEl = this.$el.querySelector('.v-slide-group__wrapper')
      if (scrollEl) {
        scrollEl.addEventListener('scroll', () => {
          const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
          if (maxScroll > 0) {
            const scrollFraction = scrollEl.scrollLeft / maxScroll
            const availableSpace = this.trackWidth - this.scrollThumbWidth
            this.scrollThumbLeft = scrollFraction * availableSpace
          }
        })
      }
    })
  },

  beforeUnmount() {
    if (this.bookingSubscription) this.bookingSubscription.unsubscribe()
  },

  watch: {
    tab(newVal) {
      const totalTabs = this.tabs.length
      const scrollFraction = newVal / (totalTabs - 1)
      const availableSpace = this.trackWidth - this.scrollThumbWidth
      this.scrollThumbLeft = scrollFraction * availableSpace
    },
  },

  methods: {
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
          const historyCutoff = endTime + 24 * 60 * 60 * 1000
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

        if (error) throw error

        this.bookings = data.map((b) => {
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

        // Fetch existing ratings for completed bookings
        await this.fetchExistingRatings()
      } catch (err) {
        this.error = 'Failed to load bookings.'
        console.error('Error fetching bookings:', err.message)
      } finally {
        this.loading = false
      }
    },

    async fetchExistingRatings() {
      if (!this.currentUserId) return

      try {
        const facilityIds = this.bookings.map((b) => b.facility_id)

        const { data, error } = await supabase
          .from('ratings')
          .select('facility_id, rating_value')
          .eq('user_id', this.currentUserId)
          .in('facility_id', facilityIds)

        if (error) throw error

        // Map ratings to bookings
        if (data) {
          this.bookings = this.bookings.map((booking) => {
            const existingRating = data.find((r) => r.facility_id === booking.facility_id)
            return {
              ...booking,
              myRating: existingRating ? existingRating.rating_value : 0,
            }
          })
        }
      } catch (err) {
        console.error('Error fetching existing ratings:', err.message)
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

        await this.fetchBookings()
        alert('Booking marked as completed.')
      } catch (err) {
        console.error('Error marking booking as completed:', err.message)
        alert('Failed to mark booking as completed.')
      } finally {
        this.loading = false
      }
    },

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

    // Rating dialog methods
    async openRatingDialog(booking) {
      if (!this.currentUserId) {
        alert('Please log in to rate facilities.')
        return
      }

      this.ratingDialog.booking = booking
      this.ratingDialog.value = booking.myRating || 0
      this.ratingDialog.visible = true
    },

    closeRatingDialog() {
      this.ratingDialog.visible = false
      this.ratingDialog.booking = null
      this.ratingDialog.value = 0
    },

    async submitRating() {
      if (!this.ratingDialog.value) {
        alert('Please select a star rating first.')
        return
      }

      try {
        const { booking, value } = this.ratingDialog

        const { data: existing, error: fetchError } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', booking.facility_id)
          .limit(1)

        if (fetchError) throw fetchError

        const existingRatingId = existing && existing.length > 0 ? existing[0].id : null

        if (existingRatingId) {
          const { error: updateError } = await supabase
            .from('ratings')
            .update({ rating_value: value })
            .eq('id', existingRatingId)
          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase.from('ratings').insert([
            {
              user_id: this.currentUserId,
              facility_id: booking.facility_id,
              rating_value: value,
            },
          ])
          if (insertError) throw insertError
        }

        alert('Rating submitted successfully!')
        await this.fetchBookings()
        this.closeRatingDialog()
      } catch (err) {
        console.error('Error submitting rating:', err.message)
        alert('Failed to submit rating. Please try again.')
      }
    },

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

    formatTime(fullTimestamp) {
      if (!fullTimestamp) return ''

      try {
        const dateTime = new Date(fullTimestamp)

        if (isNaN(dateTime.getTime())) {
          return 'Invalid Time'
        }

        return dateTime.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      } catch (e) {
        return 'Invalid Time'
      }
    },

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

        await this.fetchBookings()
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
          :ripple="false"
          color="blue"
          class="custom-scroll-tabs mb-4 mt-2"
          fixed-tabs
          slider-color="blue darken-2"
          centered
          :slider-size="0"
          next-icon="mdi-arrow-right"
          prev-icon="mdi-arrow-left"
          show-arrows="false"
        >
          <v-tab v-for="item in tabs" :key="item">{{ item }}</v-tab>
        </v-tabs>

        <div class="custom-scrollbar-container d-sm-none">
          <div class="scroll-track">
            <div
              class="scroll-thumb"
              :style="{ width: scrollThumbWidth + 'px', left: scrollThumbLeft + 'px' }"
            ></div>
          </div>
        </div>

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
                      <v-card class="d-flex pa-3 mb-1" width="100%" rounded="xl" elevation="1">
                        <div class="mr-3 ml-1 mt-2 mb-2 d-flex flex-column align-center">
                          <v-img
                            :src="booking.image_url || '/images/default-facility.jpg'"
                            height="100%"
                            width="130"
                            class="rounded-lg grey lighten-3"
                            cover
                          >
                            <v-chip
                              x-small
                              :color="getStatusColor(booking.status)"
                              dark
                              class="ma-1 mt-1 ml-3 font-weight-bold justify-center text-center"
                            >
                              {{ booking.status.toUpperCase() }}
                            </v-chip>
                          </v-img>
                        </div>

                        <div class="flex-grow-1">
                          <v-list-item-title
                            class="font-weight-semibold text-body-1 mb-2 mt-1"
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

                          <div class="d-flex align-center ml-auto mt-2">
                            <v-btn
                              v-if="['accepted', 'pending'].includes(booking.status)"
                              small
                              text
                              color="red"
                              @click="cancelBooking(booking.id)"
                              class="btn-cancel text-none rounded-xl mb-2 mt-1"
                            >
                              Cancel
                            </v-btn>

                            <v-btn
                              v-if="booking.status === 'accepted'"
                              small
                              text
                              color="green"
                              class="btn-completed ml-2 text-none rounded-xl mb-2 mt-1"
                              @click="markAsCompleted(booking.id)"
                            >
                              Completed
                            </v-btn>

                            <v-chip
                              v-else-if="booking.status === 'pending'"
                              small
                              text
                              outlined
                              color="orange darken-2"
                              class="ml-2 text-none rounded-xl mb-2 mt-1"
                            >
                              Awaiting Approval
                            </v-chip>

                            <v-btn
                              v-else-if="booking.status === 'completed'"
                              small
                              text
                              :color="booking.myRating > 0 ? 'orange darken-1' : 'amber'"
                              class="btn-rate text-none rounded-xl mb-2 mt-1"
                              @click="openRatingDialog(booking)"
                            >
                              {{ booking.myRating > 0 ? 'Edit Rate' : 'Rate' }}
                            </v-btn>

                            <v-chip
                              v-else-if="
                                ['cancelled', 'rejected', 'declined'].includes(booking.status)
                              "
                              small
                              outlined
                              color="grey"
                              class="text-none rounded-lg mb-2 mt-1"
                            >
                              {{ booking.status.charAt(0).toUpperCase() + booking.status.slice(1) }}
                            </v-chip>
                          </div>
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

    <!-- Rating Dialog -->
    <v-dialog v-model="ratingDialog.visible" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">
          Rate {{ ratingDialog.booking?.facility_name }}
        </v-card-title>
        <v-card-text>
          <p class="text-caption grey--text mb-2">How was your experience?</p>
          <div class="d-flex justify-center my-4">
            <v-icon
              v-for="n in 5"
              :key="n"
              large
              :color="n <= ratingDialog.value ? 'amber' : 'grey'"
              class="mx-1 rating-star"
              @click="ratingDialog.value = n"
            >
              {{ n <= ratingDialog.value ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </div>
          <p v-if="ratingDialog.value > 0" class="text-center text-body-2 mt-2">
            {{ ratingDialog.value }} star{{ ratingDialog.value > 1 ? 's' : '' }}
          </p>
        </v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <v-btn text @click="closeRatingDialog" class="text-none">Cancel</v-btn>
          <v-btn color="blue" dark @click="submitRating" class="text-none">Submit Rating</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
.transparent-list {
  background-color: transparent !important;
}

.v-list-item-title {
  white-space: normal !important;
  word-break: break-word !important;
}

.btn-cancel:hover {
  transform: scale(1.05);
}

.btn-completed:hover {
  transform: scale(1.05);
}

.btn-rate:hover {
  transform: scale(1.05);
}

.rating-star {
  cursor: pointer;
  transition: transform 0.2s;
}

.rating-star:hover {
  transform: scale(1.2);
}

.v-bottom-navigation .v-btn {
  border-radius: 27% !important;
}

.v-tab {
  background-color: transparent !important;
  border-radius: 15px !important;
  margin: 0 4px;
  transition: none !important;
  text-transform: none !important;
}

.v-tab::before,
.v-tab--active::before,
.v-tab:hover::before,
.v-tab:focus::before {
  display: none !important;
  opacity: 0 !important;
}

.v-tab--active {
  background-color: transparent !important;
  color: #1976d2 !important;
  font-weight: bold !important;
  border-bottom: 2px solid #1976d2 !important;
}

::v-deep .v-tabs-slider-wrapper {
  display: none !important;
}

.v-tab .v-ripple__container {
  color: rgba(26, 101, 162, 0.1) !important;
}

.custom-scrollbar-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 10px 0;
  margin-top: -10px;
}

.scroll-track {
  width: 80px;
  height: 7px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.scroll-thumb {
  position: absolute;
  height: 100%;
  background: #a0a0a0;
  border-radius: 10px;
  transition: left 0.1s ease-out;
}

@media (max-width: 600px) {
  ::v-deep .v-slide-group__content {
    display: flex !important;
    justify-content: center !important;
    min-width: 120vw !important;
  }

  ::v-deep .v-slide-group__wrapper {
    overflow-x: auto !important;
  }

  ::v-deep .v-slide-group__wrapper::-webkit-scrollbar {
    display: none !important;
  }

  .v-tab {
    min-width: 100px !important;
    flex: 0 0 auto !important;
  }
}
</style>
