<template>
  <v-container fluid class="gradient-background">
    <!-- Back Button -->
    <v-btn text small color="blue" class="mb-4" @click="goBack">
      <v-icon left>mdi-arrow-left</v-icon> Back
    </v-btn>

    <!-- Facility Card -->
    <v-card class="pa-4" rounded="lg" elevation="2">
      <!-- 1 PHOTO -->
      <v-row v-if="allPhotos.length === 1" class="mb-4 mx-auto" style="max-width: 1200px">
        <v-col cols="12" class="pa-1">
          <v-img
            :src="allPhotos[0]"
            aspect-ratio="16/9"
            cover
            class="rounded-lg"
            style="cursor: pointer"
            @click="openZoom(allPhotos[0])"
            title="Click to Zoom"
          />
        </v-col>
      </v-row>

      <!-- 2-4 PHOTOS -->
      <v-row
        v-else-if="allPhotos.length >= 2 && allPhotos.length <= 4"
        class="mb-4 mx-auto"
        style="max-width: 1200px"
      >
        <v-col v-for="(photoUrl, i) in allPhotos" :key="i" cols="12" sm="6" md="6" class="pa-1">
          <v-img
            :src="photoUrl"
            aspect-ratio="4/3"
            cover
            class="rounded-lg h-100"
            style="cursor: pointer"
            @click="openZoom(photoUrl)"
            title="Click to Zoom"
          />
        </v-col>
      </v-row>

      <!-- 5 OR MORE PHOTOS (Airbnb-style layout) -->
      <v-row
        v-else-if="allPhotos.length >= 5"
        class="mb-4 mx-auto align-stretch"
        style="max-width: 1200px"
      >
        <!-- Left Main Photo -->
        <v-col cols="12" md="7" class="pa-1">
          <v-img
            :src="allPhotos[0]"
            cover
            class="rounded-lg h-100"
            style="cursor: pointer; height: 100%; min-height: 400px"
            @click="openZoom(allPhotos[0])"
            title="Click to Zoom"
          >
            <div class="d-flex align-end justify-end fill-height">
              <v-chip
                color="white"
                class="ma-3 font-weight-bold"
                style="opacity: 0.9"
                @click.stop="openZoom(allPhotos[0])"
              >
                <v-icon left>mdi-image-multiple</v-icon> See all photos
              </v-chip>
            </div>
          </v-img>
        </v-col>

        <!-- Right stacked photos -->
        <v-col cols="12" md="5" class="pa-1 d-flex flex-column">
          <v-row no-gutters class="flex-grow-1">
            <v-col
              v-for="(photoUrl, i) in allPhotos.slice(1, 3)"
              :key="i + 1"
              cols="6"
              class="pa-1"
            >
              <v-img
                :src="photoUrl"
                aspect-ratio="1/1"
                cover
                class="rounded-lg h-100"
                style="cursor: pointer"
                @click="openZoom(photoUrl)"
                title="Click to Zoom"
              />
            </v-col>
          </v-row>

          <v-row no-gutters class="flex-grow-1">
            <v-col
              v-for="(photoUrl, i) in allPhotos.slice(3, 5)"
              :key="i + 3"
              cols="6"
              class="pa-1"
            >
              <v-img
                :src="photoUrl"
                aspect-ratio="1/1"
                cover
                class="rounded-lg h-100"
                style="cursor: pointer"
                @click="openZoom(photoUrl)"
                title="Click to Zoom"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- DEFAULT FALLBACK -->
      <v-img
        v-else
        src="/images/default-facility.jpg"
        height="400"
        class="mb-4 mx-auto"
        rounded="lg"
      />

      <!-- Facility Info -->
      <h2 class="font-weight-bold">{{ facility.facility_name }}</h2>
      <p class="grey--text mb-2">{{ facility.address }}</p>

      <!-- Rating -->
      <div class="d-flex align-center mb-3 flex-wrap">
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

      <v-divider class="my-4" />

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
                  <v-img :src="photoUrl" contain max-height="90vh" class="mx-auto" />
                </v-carousel-item>
              </v-carousel>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <!-- Booking Card -->
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

          <div v-if="groupedSchedules[selectedDate]?.length" class="d-flex flex-wrap">
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
    userRating: 0,
    averageRating: '0.0',
    totalRatings: 0,
    currentUserId: null,
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
          } catch {
            this.facility.additional_photos = []
          }
        } else if (!Array.isArray(this.facility.additional_photos)) {
          this.facility.additional_photos = []
        }
      }
    },
    openZoom(photoUrl) {
      const index = this.allPhotos.findIndex((p) => p === photoUrl)
      this.zoomCarouselIndex = index >= 0 ? index : 0
      this.zoomDialog = true
    },
    async fetchRatings() {
      const { data: ratings } = await supabase
        .from('ratings')
        .select('rating_value, user_id')
        .eq('facility_id', this.id)

      const values = ratings?.map((r) => r.rating_value) || []
      this.totalRatings = values.length
      this.averageRating =
        values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0.0'
      if (this.currentUserId) {
        const userRating = ratings.find((r) => r.user_id === this.currentUserId)
        this.userRating = userRating ? userRating.rating_value : 0
      }
    },
    async rateFacility(star) {
      if (!this.currentUserId) {
        alert('Please log in to rate this facility.')
        return
      }
      this.userRating = star
      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', this.currentUserId)
        .eq('facility_id', this.id)
        .limit(1)

      if (existing?.length) {
        await supabase.from('ratings').update({ rating_value: star }).eq('id', existing[0].id)
      } else {
        await supabase
          .from('ratings')
          .insert([{ facility_id: this.id, user_id: this.currentUserId, rating_value: star }])
      }
      await this.fetchRatings()
    },
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
        const reserved = new Set(bookingsData.map((b) => new Date(b.start_time).toISOString()))
        const generated = this.generateFutureSlots()
        this.availableSchedules = generated.filter(
          (slot) => !reserved.has(new Date(slot.start_time).toISOString()),
        )
        this.groupAvailableSchedules()
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
        const dow = days[date.getDay()]
        const dateStr = date.toISOString().split('T')[0]
        const custom = this.schedules.find((s) => s.type === 'custom' && s.date === dateStr)
        const regular = this.schedules.find((s) => s.type === 'regular' && s.day_of_week === dow)
        const sched = custom || regular
        if (!sched || !sched.start_time || !sched.end_time) continue
        const [sh, sm] = sched.start_time.split(':').map(Number)
        const [eh, em] = sched.end_time.split(':').map(Number)
        let cur = new Date(date)
        cur.setHours(sh, sm, 0, 0)
        const end = new Date(date)
        end.setHours(eh, em, 0, 0)
        if (end < cur) end.setDate(end.getDate() + 1)
        while (cur < end) {
          if (cur > new Date()) slots.push({ start_time: cur.toISOString() })
          cur = new Date(cur.getTime() + this.SLOT_DURATION_MINUTES * 60000)
        }
      }
      return slots
    },
    groupAvailableSchedules() {
      const grouped = {}
      this.availableSchedules.forEach((slot) => {
        const key = new Date(slot.start_time).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(slot)
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
      if (!this.selectedSchedule) return alert('Please select a schedule.')
      this.loading = true
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) return alert('Please log in to book.')
        await supabase.from('bookings').insert([
          {
            facility_id: this.facility.id,
            start_time: this.selectedSchedule,
            status: 'pending',
            user_id: user.id,
          },
        ])
        alert('Booking successful! Your booking is pending.')
        this.selectedSchedule = ''
        await this.fetchSchedulesAndBookings()
        this.autoSelectFirstAvailableDate()
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
.h-100 {
  height: 100%;
}

/* 📱 Responsive adjustments */
@media (max-width: 960px) {
  .v-row[style*='max-width: 1200px'] {
    max-width: 100% !important;
  }
  .v-img {
    aspect-ratio: 4/3 !important;
  }
  .v-col.md-7,
  .v-col.md-5 {
    width: 100% !important;
  }
}
</style>
