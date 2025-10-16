<template>
  <v-container fluid class="gradient-background">
    <v-btn text small color="blue" class="mb-4" @click="goBack">
      <v-icon left>mdi-arrow-left</v-icon> Back
    </v-btn>

    <v-card class="pa-4" rounded="lg" elevation="2">
      <v-img
        :src="facility.image_url || '/images/default-facility.jpg'"
        height="500"
        width="auto"
        class="mb-4 mx-auto"
      ></v-img>

      <h2 class="font-weight-bold">{{ facility.facility_name }}</h2>
      <p class="grey--text mb-2">{{ facility.address }}</p>

      <div class="d-flex align-center mb-3">
        <v-icon color="amber">mdi-star</v-icon>
        <span class="ml-1">{{ facility.rating || '4.5' }} ({{ facility.reviews || 0 }})</span>
      </div>

      <v-chip color="green darken-1" dark> ₱{{ facility.price_per_hour || 'N/A' }} / hour </v-chip>

      <v-divider class="my-4"></v-divider>

      <p class="grey--text">{{ facility.briefdescription || 'No description available.' }}</p>
    </v-card>

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
          {{ selectedDate }} at **{{ formattedSelectedTime }}**
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
    // NOTE: This will now hold bookings, not reservations
    bookings: [],
    availableSchedules: [],
    groupedSchedules: {},
    availableDates: [],
    selectedDate: null,
    selectedSchedule: '',
    loading: false,
    loadingSchedules: false,
    // Configuration for slot generation
    SLOT_DURATION_MINUTES: 60, // Assuming 1-hour booking slots
    DAYS_TO_GENERATE: 90, // Generate slots for the next 90 days
  }),
  async mounted() {
    await this.fetchFacility()
    await this.fetchSchedulesAndBookings() // Changed function name
    this.autoSelectFirstAvailableDate()
  },
  computed: {
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

    async fetchFacility() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', this.id)
        .single()
      if (!error) this.facility = data
      else console.error('Error fetching facility:', error.message)
    },

    // Renamed function to reflect 'Bookings' table
    async fetchSchedulesAndBookings() {
      this.loadingSchedules = true

      try {
        // 1. Fetch ALL schedules for the facility (regular and custom)
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
        if (schedulesError) throw schedulesError
        this.schedules = schedulesData || []

        // 2. Fetch ALL existing bookings for conflict checking
        // 🚨 CORRECTED: Using 'bookings' table name
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          // Assuming 'start_time' in 'bookings' corresponds to the reserved slot time
          .select('start_time')
          .eq('facility_id', this.id)
        if (bookingsError) throw bookingsError

        // Convert reserved start times to a Set for quick ISO string lookups
        const reservedStarts = new Set(
          bookingsData.map(
            (b) => new Date(b.start_time).toISOString(), // Assuming 'start_time' holds the reserved slot
          ),
        )

        // 3. Generate future slots based on schedules and apply overrides
        const generatedSlots = this.generateFutureSlots()

        // 4. Filter generated slots against bookings
        this.availableSchedules = generatedSlots.filter((slot) => {
          const slotStartTimeISO = new Date(slot.start_time).toISOString()
          return !reservedStarts.has(slotStartTimeISO)
        })

        // 5. Group the final available slots for the date picker
        this.groupAvailableSchedules()
      } catch (err) {
        // Updated error message to reflect the new table name
        console.error('Error fetching schedules or bookings:', err.message)
      } finally {
        this.loadingSchedules = false
      }
    },

    generateFutureSlots() {
      // ... (No logic change needed here, it correctly uses this.schedules)
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

        if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time) {
          continue
        }

        const [startHour, startMinute] = effectiveSchedule.start_time.split(':').map(Number)
        const [endHour, endMinute] = effectiveSchedule.end_time.split(':').map(Number)

        let currentSlotTime = new Date(date)
        currentSlotTime.setHours(startHour, startMinute, 0, 0)

        const closingTime = new Date(date)
        closingTime.setHours(endHour, endMinute, 0, 0)

        if (closingTime < currentSlotTime) {
          closingTime.setDate(closingTime.getDate() + 1)
        }

        while (currentSlotTime < closingTime) {
          if (currentSlotTime > new Date()) {
            slots.push({
              start_time: currentSlotTime.toISOString(),
            })
          }
          currentSlotTime = new Date(currentSlotTime.getTime() + this.SLOT_DURATION_MINUTES * 60000)
        }
      }
      return slots
    },

    groupAvailableSchedules() {
      // ... (No logic change needed here)
      const grouped = {}
      this.availableSchedules.forEach((slot) => {
        const dateKey = new Date(slot.start_time).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(slot)
      })
      this.groupedSchedules = grouped
      this.availableDates = Object.keys(grouped)
    },

    allowedDates(date) {
      // ... (No logic change needed here)
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
      if (this.availableDates.length > 0) {
        this.selectedDate = this.availableDates[0]
      }
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

        // 🚨 CORRECTED: Inserting into the 'bookings' table
        const { error } = await supabase.from('bookings').insert([
          {
            facility_id: this.facility.id,
            start_time: this.selectedSchedule, // Using 'start_time' as per the bookings schema
            status: 'pending',
            user_id: user.id,
          },
        ])
        if (error) throw error

        alert('Booking successful! Your booking is now pending.')
        this.selectedSchedule = ''
        // Re-fetch using the new function name
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
