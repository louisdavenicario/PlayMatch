<template>
  <v-container fluid class="gradient-background">
    <!-- Back Button -->
    <v-btn text small color="blue" class="mb-4" @click="goBack">
      <v-icon left>mdi-arrow-left</v-icon> Back
    </v-btn>

    <!-- Facility Card with Carousel -->
    <v-card class="pa-4" rounded="lg" elevation="2">
      <v-carousel
        v-if="allPhotos.length > 0"
        cycle
        height="500"
        hide-delimiter-background
        show-arrows-on-hover
        class="mb-4 mx-auto"
        style="max-width: 1000px"
        rounded="lg"
        delimiter-icon="mdi-circle-small"
        delimiter-size="10"
      >
        <v-carousel-item
          v-for="(photoUrl, i) in allPhotos"
          :key="i"
          :src="photoUrl"
          contain
          style="cursor: pointer"
          @click="openZoom(photoUrl)"
          title="Click to Zoom"
        >
        </v-carousel-item>
      </v-carousel>

      <v-img
        v-else
        src="/images/default-facility.jpg"
        height="500"
        width="auto"
        class="mb-4 mx-auto"
        rounded="lg"
      ></v-img>

      <h2 class="font-weight-bold">{{ facility.facility_name }}</h2>
      <p class="grey--text mb-2">{{ facility.address }}</p>

      <!-- Ratings -->
      <div class="d-flex align-center mb-3">
        <div class="d-flex align-center mr-2">
          <v-icon
            v-for="star in 5"
            :key="star"
            :color="star <= userRating ? 'amber' : 'grey lighten-1'"
            large
            @click="rateFacility(star)"
            style="cursor: pointer"
          >
            {{ star <= userRating ? 'mdi-star' : 'mdi-star-outline' }}
          </v-icon>
        </div>
        <span class="ml-2 grey--text text-body-2">
          {{ averageRating }} ({{ totalRatings }} reviews)
        </span>
      </div>

      <v-chip color="green darken-1" dark> ₱{{ facility.price_per_hour || 'N/A' }} / hour </v-chip>

      <v-divider class="my-4"></v-divider>

      <p class="grey--text">{{ facility.briefdescription || 'No description available.' }}</p>
    </v-card>

    <!-- Zoom Dialog -->
    <v-dialog v-model="zoomDialog" fullscreen transition="dialog-bottom-transition">
      <v-card dark color="black">
        <v-toolbar dense flat color="white">
          <v-spacer></v-spacer>
          <v-btn icon @click="zoomDialog = false">
            <v-icon color="#1a65a2">mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-container fluid fill-height>
          <v-row align="center" justify="center">
            <v-col cols="12" class="text-center">
              <v-carousel
                v-model="zoomCarouselIndex"
                hide-delimiter-background
                height="90vh"
                show-arrows-on-hover
                delimiter-icon="mdi-circle-small"
                delimiter-size="12"
                cycle
              >
                <v-carousel-item v-for="(photoUrl, index) in allPhotos" :key="index">
                  <v-img :src="photoUrl" contain max-height="90vh" class="mx-auto"></v-img>
                </v-carousel-item>
              </v-carousel>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Booking Section -->
    <v-card class="pa-4 mt-6" rounded="lg" elevation="2">
      <h3 class="text-h6 font-weight-medium mb-3">Book this Facility</h3>

      <v-skeleton-loader v-if="loadingSchedules" type="date-picker, text" />

      <div v-else>
        <v-date-picker
          v-model="selectedDate"
          :allowed-dates="allowedDates"
          :events="availableDates"
          event-color="blue"
          color="blue"
          class="mb-4"
        />

        <div v-if="selectedDate">
          <h4 class="text-subtitle-1 font-weight-bold mb-2">
            Available Slots for {{ selectedDate }}
          </h4>

          <div
            v-if="groupedSchedules[selectedDate] && groupedSchedules[selectedDate].length > 0"
            class="d-flex flex-wrap"
          >
            <v-btn
              v-for="slot in groupedSchedules[selectedDate]"
              :key="slot.start_time"
              :color="selectedSchedule === slot.start_time ? 'blue' : 'grey lighten-2'"
              dark
              class="ma-2"
              rounded
              @click="selectedSchedule = slot.start_time"
            >
              {{
                new Date(slot.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              }}
            </v-btn>
          </div>

          <div v-else class="grey--text">No available slots for this date</div>
        </div>

        <div v-else class="grey--text">Select a date with available times</div>

        <v-alert
          v-if="selectedDate && selectedSchedule"
          type="info"
          text
          color="blue"
          icon="mdi-calendar-clock"
          class="mt-4"
        >
          <div class="font-weight-bold">Selected Booking Time:</div>
          {{ selectedDate }} at {{ formattedSelectedTime }}
        </v-alert>

        <v-btn
          block
          color="blue"
          dark
          rounded
          class="mt-4"
          @click="bookFacility"
          :loading="loading"
          :disabled="!selectedSchedule"
        >
          Book Now
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'Facility_details',
  props: ['id'],
  data: () => ({
    facility: {},
    schedules: [],
    bookings: [],
    availableSchedules: [],
    groupedSchedules: {},
    availableDates: [],
    selectedDate: null,
    selectedSchedule: '',
    loading: false,
    loadingSchedules: false,
    SLOT_DURATION_MINUTES: 60,
    DAYS_TO_GENERATE: 90,

    // Ratings
    userRating: 0,
    averageRating: '0.0',
    totalRatings: 0,
    currentUserId: null,

    // Carousel & Zoom
    zoomDialog: false,
    zoomCarouselIndex: 0,
  }),
  async mounted() {
    await this.getCurrentUser()
    await this.fetchFacility()
    await this.fetchRatings()
    await this.fetchSchedulesAndBookings()
    this.autoSelectFirstAvailableDate()
  },
  computed: {
    allPhotos() {
      const photos = []
      if (this.facility.image_url) photos.push(this.facility.image_url)
      if (this.facility.additional_photos && Array.isArray(this.facility.additional_photos)) {
        photos.push(...this.facility.additional_photos.filter((url) => url))
      }
      return photos
    },
    formattedSelectedTime() {
      if (!this.selectedSchedule) return ''
      return new Date(this.selectedSchedule).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
  },
  methods: {
    goBack() {
      this.$router.push({ name: 'customer-dashboard' })
    },
    async getCurrentUser() {
      const { data } = await supabase.auth.getUser()
      this.currentUserId = data?.user?.id || null
    },
    async fetchFacility() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*, additional_photos')
        .eq('id', this.id)
        .single()

      if (!error) {
        this.facility = data
        if (typeof this.facility.additional_photos === 'string') {
          try {
            this.facility.additional_photos = JSON.parse(this.facility.additional_photos)
          } catch (e) {
            this.facility.additional_photos = []
          }
        } else if (!Array.isArray(this.facility.additional_photos)) {
          this.facility.additional_photos = []
        }
      } else console.error('Error fetching facility:', error.message)
    },
    openZoom(photoUrl) {
      const index = this.allPhotos.findIndex((p) => p === photoUrl)
      this.zoomCarouselIndex = index >= 0 ? index : 0
      this.zoomDialog = true
    },

    // Ratings
    async fetchRatings() {
      try {
        const { data: allRatings, error: allError } = await supabase
          .from('ratings')
          .select('rating_value, user_id')
          .eq('facility_id', this.id)

        if (allError) throw allError

        const ratings = allRatings || []
        const ratingValues = ratings.map((r) => r.rating_value)

        this.totalRatings = ratingValues.length
        this.averageRating =
          ratingValues.length > 0
            ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
            : '0.0'

        this.userRating = 0
        if (this.currentUserId) {
          const userRatingRecord = ratings.find((r) => r.user_id === this.currentUserId)
          if (userRatingRecord) this.userRating = userRatingRecord.rating_value
        }
      } catch (err) {
        console.error('Error fetching ratings:', err.message)
      }
    },
    async rateFacility(star) {
      if (!this.currentUserId) {
        alert('Please log in to rate this facility.')
        return
      }
      try {
        this.userRating = star
        const { data: existing } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', this.id)
          .limit(1)

        const existingRatingId = existing?.[0]?.id || null
        if (existingRatingId) {
          await supabase.from('ratings').update({ rating_value: star }).eq('id', existingRatingId)
        } else {
          await supabase
            .from('ratings')
            .insert([{ facility_id: this.id, user_id: this.currentUserId, rating_value: star }])
        }

        await this.fetchRatings()
      } catch (err) {
        console.error('Error submitting rating:', err.message)
      }
    },

    // Booking
    async fetchSchedulesAndBookings() {
      this.loadingSchedules = true
      try {
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
        this.schedules = schedulesData || []

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('start_time')
          .eq('facility_id', this.id)
        const reservedStarts = new Set(
          bookingsData.map((b) => new Date(b.start_time).toISOString()),
        )

        const generatedSlots = this.generateFutureSlots()
        this.availableSchedules = generatedSlots.filter(
          (slot) => !reservedStarts.has(new Date(slot.start_time).toISOString()),
        )

        this.groupAvailableSchedules()
      } catch (err) {
        console.error('Error fetching schedules or bookings:', err.message)
      } finally {
        this.loadingSchedules = false
      }
    },

    generateFutureSlots() {
      const slots = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

      for (let i = 0; i < this.DAYS_TO_GENERATE; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dayOfWeekName = days[date.getDay()]
        const dateString = date.toISOString().split('T')[0]

        const customSchedule = this.schedules.find(
          (s) => s.type === 'custom' && s.date === dateString,
        )
        const regularSchedule = this.schedules.find(
          (s) => s.type === 'regular' && s.day_of_week === dayOfWeekName,
        )
        const effectiveSchedule = customSchedule || regularSchedule
        if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time)
          continue

        const [startHour, startMinute] = effectiveSchedule.start_time.split(':').map(Number)
        const [endHour, endMinute] = effectiveSchedule.end_time.split(':').map(Number)

        let currentSlotTime = new Date(date)
        currentSlotTime.setHours(startHour, startMinute, 0, 0)
        const closingTime = new Date(date)
        closingTime.setHours(endHour, endMinute, 0, 0)
        if (closingTime < currentSlotTime) closingTime.setDate(closingTime.getDate() + 1)

        while (currentSlotTime < closingTime) {
          if (currentSlotTime > new Date())
            slots.push({ start_time: currentSlotTime.toISOString() })
          currentSlotTime = new Date(currentSlotTime.getTime() + this.SLOT_DURATION_MINUTES * 60000)
        }
      }
      return slots
    },

    groupAvailableSchedules() {
      const grouped = {}
      this.availableSchedules.forEach((slot) => {
        const dateKey = new Date(slot.start_time).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(slot)
      })
      this.groupedSchedules = grouped
      this.availableDates = Object.keys(grouped)
    },

    allowedDates(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const picked = new Date(date)
      picked.setHours(0, 0, 0, 0)
      if (picked < today) return false
      const formatted = picked.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      return !!this.groupedSchedules[formatted]
    },

    autoSelectFirstAvailableDate() {
      if (this.availableDates.length > 0) this.selectedDate = this.availableDates[0]
    },

    async bookFacility() {
      if (!this.selectedSchedule) {
        alert('Please select a valid available schedule.')
        return
      }
      this.loading = true
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) {
          alert('Please log in to make a booking.')
          this.loading = false
          return
        }

        const { error } = await supabase.from('bookings').insert([
          {
            facility_id: this.facility.id,
            start_time: this.selectedSchedule,
            status: 'pending',
            user_id: user.id,
          },
        ])
        if (error) throw error
        alert('Booking successful! Your booking is now pending.')
        this.selectedSchedule = ''
        await this.fetchSchedulesAndBookings()
        this.autoSelectFirstAvailableDate()
      } catch (err) {
        console.error('Booking error:', err.message)
        alert('Failed to book facility. Please try again.')
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.gradient-background {
  min-height: 100vh;
  background: linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6));
  padding-top: 20px !important;
  padding-bottom: 20px !important;
}
.v-card {
  background-color: white !important;
}
</style>
