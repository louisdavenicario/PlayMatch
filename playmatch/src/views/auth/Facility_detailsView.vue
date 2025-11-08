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
      <v-btn icon @click="goBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-bold" style="color: white">
        Facility Details
      </v-toolbar-title>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container>
        <v-card class="pa-4" rounded="lg" elevation="2">
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

          <v-row
            v-else-if="allPhotos.length >= 5"
            class="mb-4 mx-auto align-stretch"
            style="max-width: 1200px"
          >
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

          <v-img
            v-else
            src="/images/default-facility.jpg"
            height="400"
            class="mb-4 mx-auto"
            rounded="lg"
          />

          <h2 class="font-weight-bold">{{ facility.facility_name }}</h2>
          <p class="grey--text mb-2">Address: {{ facility.address }}</p>
          <p class="grey--text mb-2">
            Operating Hours: {{ facility.open_time }} - {{ facility.closing_time }}
          </p>
          <p class="grey--text mb-2">Contact Number: {{ facility.phone_number }}</p>
          <p class="grey--text mb-2">Amenities: {{ facility.amenities }}</p>

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

          <v-chip color="green darken-1" dark>
            ₱{{ facility.price_per_hour || 'N/A' }} / hour
          </v-chip>

          <v-divider class="my-4"></v-divider>

          <p class="grey--text">{{ facility.briefdescription || 'No description available.' }}</p>
        </v-card>

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

            <!-- 🧩 Custom Schedule Alert -->
            <v-alert
              v-if="selectedDateHasCustomSchedule"
              type="info"
              color="blue-lighten-4"
              border="start"
              border-color="blue-darken-2"
              icon="mdi-information"
              class="mb-4"
            >
              {{ selectedCustomSchedule?.reason }}
            </v-alert>

            <!-- Show available slots only when no custom schedule -->
            <div
              v-if="
                selectedDate &&
                groupedSchedules[selectedDate] &&
                groupedSchedules[selectedDate].length > 0
              "
            >
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Available Slots for {{ selectedDate }} <br />Select Start Time:
              </h4>

              <div
                v-if="groupedSchedules[selectedDate] && groupedSchedules[selectedDate].length > 0"
                class="d-flex flex-wrap"
              >
                <v-chip-group
                  v-if="groupedSchedules[selectedDate] && groupedSchedules[selectedDate].length > 0"
                  column
                  class="d-flex flex-wrap"
                >
                  <v-chip
                    v-for="slot in groupedSchedules[selectedDate]"
                    :key="slot.start_time"
                    :color="
                      isSlotSelected(slot.start_time)
                        ? 'blue'
                        : isSlotDisabled(slot.start_time)
                          ? 'red lighten-4'
                          : 'grey lighten-2'
                    "
                    :text-color="
                      isSlotSelected(slot.start_time)
                        ? 'white'
                        : isSlotDisabled(slot.start_time)
                          ? 'red darken-3'
                          : 'grey darken-3'
                    "
                    :outlined="!isSlotSelected(slot.start_time)"
                    :disabled="isSlotDisabled(slot.start_time)"
                    @click="
                      !isSlotDisabled(slot.start_time) && handleTimeSlotSelection(slot.start_time)
                    "
                    class="ma-1"
                  >
                    {{ slot.formatted_time }}
                  </v-chip>
                </v-chip-group>
              </div>

              <div v-else class="grey--text">No available slots for this date</div>
            </div>

            <div v-else class="grey--text">Select a date with available times</div>

            <div v-if="selectedStartSlot" class="mt-4">
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Select Duration (Hours, Max: {{ MAX_BOOKING_HOURS }})
              </h4>
              <v-text-field
                v-model.number="selectedDuration"
                label="Enter Duration in Hours"
                type="number"
                min="1"
                :max="MAX_BOOKING_HOURS"
                :error-messages="durationError"
                :color="isDurationValid(selectedDuration) ? 'blue' : 'red'"
                solo
                prepend-inner-icon="mdi-timer-sand"
              />
            </div>

            <v-alert
              v-if="selectedStartSlot && selectedDuration > 0 && isDurationValid(selectedDuration)"
              type="success"
              text
              color="green"
              icon="mdi-check-circle"
              class="mt-4"
            >
              <div class="font-weight-bold">Selected Booking:</div>
              Date: {{ selectedDate }}<br />
              Time: {{ formattedSelectedTime }} - {{ formattedEndTime }} ({{
                selectedDuration
              }}
              hours)<br />
              Total Cost: ₱{{ totalBookingCost }}
            </v-alert>

            <v-alert
              v-if="selectedStartSlot && selectedDuration > 0 && durationError"
              type="error"
              text
              color="red"
              icon="mdi-alert-circle"
              class="mt-4"
            >
              {{ durationError }}
            </v-alert>

            <v-btn
              block
              color="blue"
              dark
              rounded
              class="mt-4"
              @click="bookFacility"
              :loading="loading"
              :disabled="!selectedStartSlot || !isDurationValid(selectedDuration)"
            >
              Book Now
            </v-btn>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
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
    customSchedules: [],
    // Multi-Hour Booking Data
    selectedStartSlot: null,
    selectedDuration: 1,
    MAX_BOOKING_HOURS: 4,
    durationError: '',
    // ---
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
    await this.fetchCustomSchedules()
    await this.fetchSchedulesAndBookings()
    await this.fetchRatings()
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
      if (!this.selectedStartSlot) return ''
      // The slot is UTC but we display it as local time
      return new Date(this.selectedStartSlot).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
    formattedEndTime() {
      if (!this.selectedStartSlot || this.selectedDuration <= 0) return ''
      const start = new Date(this.selectedStartSlot)
      const end = new Date(
        start.getTime() + this.selectedDuration * this.SLOT_DURATION_MINUTES * 60000,
      )
      // The end time is also UTC but displayed locally
      return end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
    formattedEndTime() {
      if (!this.selectedStartSlot || this.selectedDuration <= 0) return ''
      const start = new Date(this.selectedStartSlot)
      const end = new Date(
        start.getTime() + this.selectedDuration * this.SLOT_DURATION_MINUTES * 60000,
      )
      // The end time is also UTC but displayed locally
      return end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
    totalBookingCost() {
      const price = this.facility.price_per_hour || 0
      return (price * this.selectedDuration).toFixed(2)
    },
    // 🧩 NEW — detect and display custom schedule reason
    selectedCustomSchedule() {
      if (!this.customSchedules || !this.selectedDate) return null
      return this.customSchedules.find((s) => s.date === this.selectedDate)
    },
    selectedDateHasCustomSchedule() {
      return !!this.selectedCustomSchedule
    },
  },

  watch: {
    selectedDate(newDate) {
      if (newDate && newDate instanceof Date) {
        // Convert Date object to 'YYYY-MM-DD' string
        const year = newDate.getFullYear()
        const month = String(newDate.getMonth() + 1).padStart(2, '0')
        const day = String(newDate.getDate()).padStart(2, '0')
        this.selectedDate = `${year}-${month}-${day}`
        return
      }
      // If it's already a string, or null, proceed with state reset
      this.handleDateSelection()
    },
    // Reset duration and clear error whenever the start slot changes
    selectedStartSlot() {
      this.selectedDuration = 1
      this.durationError = '' // Clear error on slot change
    },
    // Watch duration input to perform validation immediately
    selectedDuration(newDuration) {
      if (this.selectedStartSlot) {
        this.validateDuration(newDuration)
      } else {
        this.durationError = ''
      }
    },
  },

  methods: {
    goBack() {
      this.$router.push({ name: 'customer-dashboard' })
    },

    isSlotDisabled(slotStartTime) {
      if (!this.selectedCustomSchedule) return false

      const slotTime = new Date(slotStartTime)
      const [customStartHour, customStartMinute] = this.selectedCustomSchedule.start_time
        .split(':')
        .map(Number)
      const [customEndHour, customEndMinute] = this.selectedCustomSchedule.end_time
        .split(':')
        .map(Number)

      const customStart = new Date(slotTime)
      customStart.setHours(customStartHour, customStartMinute, 0, 0)
      const customEnd = new Date(slotTime)
      customEnd.setHours(customEndHour, customEndMinute, 0, 0)

      // Disabled if slotStartTime falls within the custom CLOSED range
      return slotTime >= customStart && slotTime < customEnd
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

    async fetchSchedulesAndBookings() {
      this.loadingSchedules = true
      try {
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
          .eq('type', 'regular')
        this.schedules = schedulesData || []

        // Fetch bookings: Now selecting 'status' to exclude 'cancelled' bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('start_time, duration_hours, status')
          .eq('facility_id', this.id)
          .not('status', 'in', '("cancelled","rejected")')

        const activeBookings = Array.isArray(bookingsData) ? bookingsData : []
        // --- CORE FIX: Calculate ALL occupied 1-hour slot UTC ISO strings ---
        const reservedSlots = new Set()
        activeBookings.forEach((booking) => {
          // Use the database time, which is the UTC ISO string saved from generateFutureSlots
          // The database saves this: 2025-10-23T08:00:00.000Z
          const start = new Date(booking.start_time)
          const duration = booking.duration_hours || 1

          for (let i = 0; i < duration; i++) {
            const reservedTime = new Date(start.getTime() + i * this.SLOT_DURATION_MINUTES * 60000)

            // CRITICAL: The ISO string must match the one generated in generateFutureSlots
            reservedSlots.add(reservedTime.toISOString())
          }
        })

        // -----------------------------------------------------------------

        const generatedSlots = this.generateFutureSlots()

        // Filter: Compare the generated slot's ISO string (start_time) directly
        // against the reservedSlots Set.
        this.availableSchedules = generatedSlots.filter(
          (slot) => !reservedSlots.has(slot.start_time),
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
        const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD

        // Determine if a custom schedule exists for this exact date
        const customSchedule = this.customSchedules.find(
          (s) => s.date === dateString && s.type === 'custom' && s.facility_id === this.id,
        )

        // If custom exists for this date, use it. Otherwise use the regular one for the weekday
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
          if (currentSlotTime > new Date()) {
            slots.push({
              // Store the UTC ISO string (e.g., 2025-10-23T00:00:00.000Z)
              start_time: currentSlotTime.toISOString(),
              formatted_time: currentSlotTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            })
          }
          currentSlotTime = new Date(currentSlotTime.getTime() + this.SLOT_DURATION_MINUTES * 60000)
        }
      }
      return slots
    },

    async fetchCustomSchedules() {
      try {
        if (!this.id) {
          console.warn('No facility ID provided for fetchCustomSchedules')
          return
        }

        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id) // use prop `id`, not this.facility.id
          .eq('type', 'custom')

        if (error) throw error
        this.customSchedules = data || []
        console.log('Custom schedules loaded:', this.customSchedules)
      } catch (err) {
        console.error('Error fetching custom schedules:', err.message)
      }
    },

    groupAvailableSchedules() {
      const grouped = {}
      this.availableSchedules.forEach((slot) => {
        const dateKey = new Date(slot.start_time).toISOString().split('T')[0]

        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(slot)
      })
      this.groupedSchedules = grouped
      this.availableDates = Object.keys(grouped)
    },
    /**
     * Allows any date from today onward to be selected.
     */
    allowedDates(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const picked = new Date(date)
      picked.setHours(0, 0, 0, 0)

      return picked >= today
    },

    // Logic to reset time slots, triggered by selectedDate watcher
    handleDateSelection() {
      this.selectedStartSlot = null
      this.selectedDuration = 1
      this.durationError = ''
    },

    autoSelectFirstAvailableDate() {
      if (this.availableDates.length > 0) this.selectedDate = this.availableDates[0]
      // Watcher handles the state reset after this assignment
    },

    handleTimeSlotSelection(startTime) {
      if (this.selectedStartSlot === startTime) {
        this.selectedStartSlot = null
        this.selectedDuration = 1
        this.durationError = ''
      } else {
        this.selectedStartSlot = startTime
        this.selectedDuration = 1
        this.durationError = ''
      }
    },

    isSlotSelected(slotTime) {
      return this.selectedStartSlot === slotTime
    },

    isDurationPossible(duration) {
      if (!this.selectedStartSlot || duration <= 0) return false
      return this._checkSlotAvailability(duration)
    },

    isDurationValid(duration) {
      const numDuration = parseInt(duration)
      if (
        !this.selectedStartSlot ||
        numDuration <= 0 ||
        isNaN(numDuration) ||
        numDuration > this.MAX_BOOKING_HOURS
      ) {
        return false
      }
      return this._checkSlotAvailability(numDuration)
    },

    validateDuration(duration) {
      this.durationError = ''
      const numDuration = parseInt(duration)

      if (!this.selectedStartSlot) {
        return
      }

      if (isNaN(numDuration) || numDuration <= 0) {
        this.durationError = 'Duration must be a positive number of hours.'
        return
      }

      if (numDuration > this.MAX_BOOKING_HOURS) {
        this.durationError = `Maximum booking duration is ${this.MAX_BOOKING_HOURS} hours.`
        return
      }

      if (!this._checkSlotAvailability(numDuration)) {
        this.durationError = `A ${numDuration}-hour booking starting at ${this.formattedSelectedTime} is not fully available. Please choose a shorter duration.`
      }
    },

    _checkSlotAvailability(duration) {
      const slotDurationMs = this.SLOT_DURATION_MINUTES * 60000
      // selectedStartSlot is the UTC ISO string (e.g., 2025-10-23T08:00:00.000Z)
      const selectedStart = new Date(this.selectedStartSlot)
      const currentSlots = this.groupedSchedules[this.selectedDate] || []

      // The availableStartTimes are the UTC ISO strings from the generated slots
      const availableStartTimes = new Set(currentSlots.map((slot) => slot.start_time))

      for (let i = 0; i < duration; i++) {
        // Calculate the required slot's UTC time
        const requiredTime = new Date(selectedStart.getTime() + i * slotDurationMs)
        const requiredTimeISO = requiredTime.toISOString() // This is the UTC ISO string

        // Compare the UTC ISO string
        if (!availableStartTimes.has(requiredTimeISO)) {
          return false
        }
      }
      return true
    },

    async bookFacility() {
      this.validateDuration(this.selectedDuration)

      if (!this.selectedStartSlot || !this.isDurationValid(this.selectedDuration)) {
        alert('Please select a valid start time and available duration.')
        return
      }
      this.loading = true

      // 1. Get the starting moment (already UTC ISO string from selectedStartSlot)
      const start = new Date(this.selectedStartSlot)

      // 2. Calculate the end moment in milliseconds
      const durationInMinutes = this.selectedDuration * this.SLOT_DURATION_MINUTES
      const durationInMs = durationInMinutes * 60000
      const endTimeMs = start.getTime() + durationInMs

      // 3. Convert the start and end moments back to the UTC ISO string format
      //    to be saved in the TIMESTAMPZ column.
      const calculatedStartTime = this.selectedStartSlot // It's already the correct UTC ISO string
      const calculatedEndTime = new Date(endTimeMs).toISOString() // New UTC ISO string for end time

      // Note: Since the database stores the UTC ISO string, we must save the UTC ISO string.

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
            booking_date: this.selectedDate,
            start_time: calculatedStartTime, // <<-- Using the UTC ISO string
            end_time: calculatedEndTime, // <<-- Using the UTC ISO string
            duration_hours: this.selectedDuration,
            total_cost: this.totalBookingCost,
            status: 'pending',
            user_id: user.id,
          },
        ])
        if (error) throw error
        alert(
          `Booking successful for ${this.selectedDuration} hours! Your booking is now pending. Total: ₱${this.totalBookingCost}`,
        )

        // Reset state and refresh data
        this.selectedStartSlot = null
        this.selectedDuration = 1
        this.durationError = ''
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
  background: linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6));
  min-height: 100vh;
  padding: 20px;
}
</style>
