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

      <v-date-picker
        v-model="selectedDate"
        :allowed-dates="allowedDates"
        :events="availableDates"
        event-color="blue"
        color="blue"
        class="mb-4"
      />

      <div v-if="selectedDate">
        <h4 class="text-subtitle-1 font-weight-bold mb-2">{{ selectedDate }}</h4>

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
    reservations: [],
    availableSchedules: [],
    groupedSchedules: {},
    availableDates: [],
    selectedDate: null,
    selectedSchedule: '',
    loading: false,
    loadingSchedules: false,
  }),
  async mounted() {
    await this.fetchFacility()
    await this.fetchSchedulesAndReservations()
    this.autoSelectFirstAvailableDate()
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

    async fetchSchedulesAndReservations() {
      this.loadingSchedules = true
      try {
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
          .order('start_time', { ascending: true })
        if (schedulesError) throw schedulesError
        this.schedules = schedulesData || []

        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('facility_id', this.id)
        if (reservationsError) throw reservationsError
        this.reservations = reservationsData || []

        // Build available schedules (future only, not booked)
        this.availableSchedules = this.schedules
          .filter((s) => new Date(s.start_time) > new Date())
          .map((s) => {
            const isBooked = this.reservations.some(
              (r) =>
                new Date(r.reserved_start).toISOString() === new Date(s.start_time).toISOString(),
            )

            return {
              start_time: s.start_time,
              booked: isBooked,
            }
          })
          .filter((slot) => !slot.booked)

        // Group by date
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

        // Store available dates for highlighting
        this.availableDates = Object.keys(grouped)
      } catch (err) {
        console.error('Error fetching schedules or reservations:', err.message)
      } finally {
        this.loadingSchedules = false
      }
    },

    allowedDates(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const picked = new Date(date)
      picked.setHours(0, 0, 0, 0)

      // 🚫 Block past days
      if (picked < today) return false

      // Format like groupedSchedules keys
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
          alert('Please log in to make a reservation.')
          this.loading = false
          return
        }

        const { error } = await supabase.from('reservations').insert([
          {
            facility_id: this.facility.id,
            reserved_start: this.selectedSchedule,
            status: 'pending',
            user_id: user.id,
          },
        ])
        if (error) throw error

        alert('Reservation successful! Your booking is now pending.')
        this.selectedSchedule = ''
        await this.fetchSchedulesAndReservations()
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
