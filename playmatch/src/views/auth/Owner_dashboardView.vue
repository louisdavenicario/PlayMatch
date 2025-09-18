<template>
  <div class="flex flex-col md:flex-row min-h-screen font-inter bg-gray-100">

    <aside class="sidebar bg-white shadow-xl flex flex-col p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">Sports Center</h1>
        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">FO</div>
      </div>
      <nav class="flex-1 space-y-2 mt-8">
        <button
          @click="currentPage = 'dashboard'"
          :class="['w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-colors', currentPage === 'dashboard' ? 'bg-gray-200' : 'hover:bg-gray-100']"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
          </svg>
          <span>Dashboard</span>
        </button>
        <button
          @click="currentPage = 'availability'"
          :class="['w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-colors', currentPage === 'availability' ? 'bg-gray-200' : 'hover:bg-gray-100']"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 11.25v7.5m-16.5-7.5h.008v.008h-.008v-.008zM12 12.75h.008v.008H12v-.008zM18.75 12.75h.008v.008h-.008v-.008z" />
          </svg>
          <span>Availability Settings</span>
        </button>
        <button
          @click="currentPage = 'bookings'"
          :class="['w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-colors', currentPage === 'bookings' ? 'bg-gray-200' : 'hover:bg-gray-100']"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>Bookings</span>
        </button>
      </nav>
      <div class="text-center text-sm text-gray-500 mt-auto">
        <p>User ID: {{ userId }}</p>
      </div>
    </aside>

    <main class="main-content flex-1 p-6 md:p-8 space-y-8">
      <div v-if="currentPage === 'dashboard'">
        <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div class="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
            <h3 class="text-lg font-semibold text-gray-600">Today's Bookings</h3>
            <p class="text-5xl font-bold text-purple-600 mt-2">{{ dashboardData.todayBookings }}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
            <h3 class="text-lg font-semibold text-gray-600">Monthly Revenue</h3>
            <p class="text-5xl font-bold text-green-600 mt-2">₱{{ dashboardData.monthlyRevenue.toFixed(2) }}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
            <h3 class="text-lg font-semibold text-gray-600">Pending Requests</h3>
            <p class="text-5xl font-bold text-yellow-600 mt-2">{{ dashboardData.pendingRequests }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div class="bg-white p-6 rounded-2xl shadow-lg">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold text-gray-800">My Facility</h3>
              <button @click="showEditModal = true" class="text-blue-500 hover:text-blue-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18.75 14.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125h3.375" />
                </svg>
              </button>
            </div>
            <div class="mt-4" v-if="facilityDetails">
              <h4 class="text-xl font-semibold text-gray-700 mt-4">{{ facilityDetails.name }}</h4>
              <p class="text-lg text-gray-500 mt-1">₱{{ facilityDetails.price_per_hour }}/hour</p>
              <p class="text-sm text-gray-500 mt-4">Amenities:</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <span v-for="amenity in facilityDetails.amenities.split(',')" :key="amenity" class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{{ amenity.trim() }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-4">{{ facilityDetails.description }}</p>
              <p class="text-sm text-gray-500 mt-4">{{ facilityDetails.location }}</p>
            </div>
            <div v-else class="mt-4 text-center text-gray-500">
                <p>No facility information found. Please edit to add details.</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-2xl shadow-lg">
            <h3 class="text-2xl font-bold text-gray-800">Recent Bookings</h3>
            <ul class="mt-4 space-y-4" v-if="recentBookings.length > 0">
              <li v-for="booking in recentBookings" :key="booking.id" class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-semibold text-gray-700">User {{ booking.user_id.substring(0, 4) }}</p>
                  <p class="text-sm text-gray-500">{{ new Date(booking.start_time).toLocaleDateString() }} - {{ booking.time_range }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-green-600">₱{{ (booking.price).toFixed(2) }}</p>
                  <p class="text-sm text-gray-500">{{ booking.hours }}hrs</p>
                </div>
              </li>
            </ul>
            <div v-else class="text-center text-gray-500">
              <p>No recent bookings.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="currentPage === 'availability'">
        <h2 class="text-3xl font-bold text-gray-800">Availability Settings</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div class="bg-white p-6 rounded-2xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Regular Operating Hours</h3>
            <div class="space-y-4">
              <div v-for="day in daysOfWeek" :key="day" class="flex items-center space-x-4">
                <label class="flex items-center space-x-2 w-32">
                  <input type="checkbox" v-model="regularHours[day].isOpen" class="day-checkbox">
                  <span class="text-sm font-medium text-gray-700">{{ day.charAt(0).toUpperCase() + day.slice(1) }}</span>
                </label>
                <div class="flex space-x-2 flex-1">
                  <input type="time" v-model="regularHours[day].openTime" :disabled="!regularHours[day].isOpen" class="flex-1 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <input type="time" v-model="regularHours[day].closeTime" :disabled="!regularHours[day].isOpen" class="flex-1 p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>
            <button @click="saveRegularHours" class="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors">Save Hours</button>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Custom Schedule for Specific Dates</h3>
            <div class="space-y-4">
              <input type="date" v-model="newCustomSchedule.date" class="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div class="flex space-x-2">
                <input type="time" v-model="newCustomSchedule.startTime" class="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <input type="time" v-model="newCustomSchedule.endTime" class="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <input type="text" v-model="newCustomSchedule.reason" placeholder="Reason (e.g., Maintenance)" class="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <button @click="addCustomSchedule" class="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors">Add Custom Schedule</button>
            </div>
            <div class="mt-6 space-y-4">
              <div v-for="schedule in customSchedules" :key="schedule.id" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-semibold text-gray-700">{{ schedule.reason || 'Custom Schedule' }}</p>
                  <p class="text-sm text-gray-500">{{ new Date(schedule.date + 'T00:00:00').toLocaleDateString() }} {{ schedule.startTime }} - {{ schedule.endTime }}</p>
                </div>
                <button @click="removeCustomSchedule(schedule.id)" class="text-red-500 hover:text-red-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="currentPage === 'bookings'">
        <h2 class="text-3xl font-bold text-gray-800">Bookings</h2>
        <div class="space-y-4 mt-6">
          <div v-if="pendingBookings.length > 0">
            <div v-for="booking in pendingBookings" :key="booking.id" class="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
              <div class="flex-1">
                <p class="font-semibold text-lg text-gray-800">Booking Request from User {{ booking.user_id.substring(0, 4) }}</p>
                <p class="text-gray-600 mt-1">{{ booking.facility_name }} - {{ new Date(booking.start_time).toLocaleDateString() }}</p>
                <p class="text-sm text-gray-500">{{ new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} to {{ new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</p>
              </div>
              <div class="flex space-x-4">
                <button @click="handleBookingStatus(booking.id, 'accepted')" class="bg-green-500 text-white py-2 px-6 rounded-full hover:bg-green-600 transition-colors">Accept</button>
                <button @click="handleBookingStatus(booking.id, 'declined')" class="bg-red-500 text-white py-2 px-6 rounded-full hover:bg-red-600 transition-colors">Decline</button>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            <p>No pending booking requests.</p>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xl">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">Edit Facility Details</h3>
        <form @submit.prevent="saveFacilityDetails" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Facility Name</label>
            <input type="text" v-model="editedFacility.name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Amenities (comma-separated)</label>
            <input type="text" v-model="editedFacility.amenities" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Rate per Hour (₱)</label>
            <input type="number" v-model.number="editedFacility.price_per_hour" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea v-model="editedFacility.description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" v-model="editedFacility.location" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          </div>
          <div class="flex justify-end space-x-4 mt-6">
            <button type="button" @click="showEditModal = false" class="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <div id="alert-container" class="fixed top-4 right-4 z-[9999] w-full max-w-sm"></div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { supabase } from '@/supabaseClient';

// --- Reactive State Variables ---
const userId = ref(null);
const currentPage = ref('dashboard');
const showEditModal = ref(false);

const dashboardData = reactive({
    todayBookings: 0,
    monthlyRevenue: 0,
    pendingRequests: 0,
});

const facilityDetails = ref(null);
const editedFacility = reactive({
    id: null,
    name: '',
    amenities: '',
    price_per_hour: 0,
    description: '',
    location: ''
});

const recentBookings = ref([]);
const pendingBookings = ref([]);
const regularHours = ref({
    monday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    tuesday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    wednesday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    thursday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    friday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    saturday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '08:00', closeTime: '17:00' }
});
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const customSchedules = ref([]);
const newCustomSchedule = reactive({
    date: '',
    startTime: '08:00',
    endTime: '17:00',
    reason: ''
});

// --- Functions ---
const fetchAllOwnerData = async () => {
    if (!userId.value) return;

    try {
        // Fetch Facility Details
        let { data: facilityData, error: facilityError } = await supabase
            .from('facilities')
            .select('*')
            .eq('owner_id', userId.value)
            .single();

        // Check if the error is due to no data found (PGRST116) or a real error
        if (facilityError && facilityError.code !== 'PGRST116') {
            console.error("Error fetching facility data:", facilityError.message);
            throw facilityError;
        }

        if (facilityData) {
            facilityDetails.value = facilityData;
            Object.assign(editedFacility, {
                id: facilityData.id,
                name: facilityData.name,
                amenities: facilityData.amenities,
                price_per_hour: facilityData.price_per_hour,
                description: facilityData.description,
                location: facilityData.location
            });
        } else {
            console.log("No facility data found for this owner. The user can now create one.");
            facilityDetails.value = null;
        }

        // Fetch Regular Hours
        let { data: hoursData, error: hoursError } = await supabase
            .from('schedules')
            .select('*')
            .eq('owner_id', userId.value)
            .eq('type', 'regular')
            .single();

        if (hoursError && hoursError.code !== 'PGRST116') {
            console.error("Error fetching regular hours:", hoursError.message);
        }
        if (hoursData) regularHours.value = hoursData.hours;

        // Fetch Custom Schedules
        let { data: customData, error: customError } = await supabase
            .from('schedules')
            .select('*')
            .eq('owner_id', userId.value)
            .eq('type', 'custom');

        if (customError) console.error("Error fetching custom schedules:", customError.message);
        if (customData) customSchedules.value = customData;

        // Fetch Bookings
        let { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('owner_id', userId.value);

        if (bookingsError) throw bookingsError;
        
        const allBookings = bookingsData || [];
        pendingBookings.value = allBookings.filter(b => b.status === 'pending');
        const acceptedBookings = allBookings.filter(b => b.status === 'accepted');

        // Calculate dashboard metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const todayAccepted = acceptedBookings.filter(b => new Date(b.start_time) >= today && new Date(b.start_time) < nextDay);
        dashboardData.todayBookings = todayAccepted.length;
        dashboardData.pendingRequests = pendingBookings.value.length;
        
        let monthlyRevenueCalc = 0;
        acceptedBookings.forEach(booking => {
            const bookingDate = new Date(booking.start_time);
            if (bookingDate >= currentMonthStart && bookingDate < nextMonthStart) {
                const durationHours = (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000;
                monthlyRevenueCalc += durationHours * (facilityDetails.value ? facilityDetails.value.price_per_hour : 0);
            }
        });
        dashboardData.monthlyRevenue = monthlyRevenueCalc;

        const sortedBookings = acceptedBookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)).slice(0, 5);
        recentBookings.value = sortedBookings.map(booking => {
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);
            const hours = (end - start) / 3600000;
            return {
                ...booking,
                time_range: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                hours: hours,
                price: hours * (facilityDetails.value ? facilityDetails.value.price_per_hour : 0)
            };
        });

    } catch (error) {
        console.error("Error fetching data:", error.message);
    }
};

const handleBookingStatus = async (bookingId, status) => {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: status })
            .eq('id', bookingId);

        if (error) throw error;
        alertMessage(`Booking ${status}!`, 'green');
        fetchAllOwnerData(); // Re-fetch all data to update the dashboard
    } catch (error) {
        console.error(`Error updating booking status: `, error.message);
        alertMessage(`Failed to update booking status.`, 'red');
    }
};

const saveRegularHours = async () => {
    try {
        const { error } = await supabase
            .from('schedules')
            .update({ hours: regularHours.value })
            .eq('owner_id', userId.value)
            .eq('type', 'regular');

        if (error) throw error;
        alertMessage('Regular hours saved successfully!', 'green');
    } catch (error) {
        console.error("Error saving regular hours: ", error.message);
        alertMessage('Failed to save regular hours.', 'red');
    }
};

const addCustomSchedule = async () => {
    if (!newCustomSchedule.date || !newCustomSchedule.startTime || !newCustomSchedule.endTime) {
        alertMessage('Please fill all date and time fields.', 'red');
        return;
    }
    try {
        const { error } = await supabase.from('schedules').insert({
            owner_id: userId.value,
            date: newCustomSchedule.date,
            startTime: newCustomSchedule.startTime,
            endTime: newCustomSchedule.endTime,
            reason: newCustomSchedule.reason,
            type: 'custom'
        });

        if (error) throw error;
        alertMessage('Custom schedule added!', 'green');
        newCustomSchedule.date = '';
        newCustomSchedule.startTime = '08:00';
        newCustomSchedule.endTime = '17:00';
        newCustomSchedule.reason = '';
        fetchAllOwnerData(); // Re-fetch to update the list
    } catch (error) {
        console.error("Error adding custom schedule: ", error.message);
        alertMessage('Failed to add custom schedule.', 'red');
    }
};

const removeCustomSchedule = async (id) => {
    if (window.confirm("Are you sure you want to remove this custom schedule?")) {
        try {
            const { error } = await supabase.from('schedules').delete().eq('id', id);

            if (error) throw error;
            alertMessage('Custom schedule removed.', 'green');
            fetchAllOwnerData(); // Re-fetch to update the list
        } catch (error) {
            console.error("Error removing custom schedule: ", error.message);
            alertMessage('Failed to remove custom schedule.', 'red');
        }
    }
};

const saveFacilityDetails = async () => {
    try {
        const { error } = await supabase
            .from('facilities')
            .upsert({
                id: editedFacility.id, // Supabase will use this to decide if it's an update or insert
                owner_id: userId.value,
                name: editedFacility.name,
                amenities: editedFacility.amenities,
                price_per_hour: editedFacility.price_per_hour,
                description: editedFacility.description,
                location: editedFacility.location
            }, { onConflict: 'id' });

        if (error) throw error;
        alertMessage('Facility updated successfully!', 'green');
        showEditModal.value = false;
        fetchAllOwnerData(); // Re-fetch to update the dashboard
    } catch (error) {
        console.error("Error updating facility:", error.message);
        alertMessage('Failed to update facility.', 'red');
    }
};

// Custom alert function
function alertMessage(message, color) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        console.error("Alert container not found.");
        return;
    }
    const alertDiv = document.createElement('div');
    alertDiv.className = `p-4 rounded-md shadow-lg mb-2 text-white transform transition-transform duration-300 ease-out translate-x-full`;
    
    if (color === 'green') {
        alertDiv.classList.add('bg-green-500');
    } else if (color === 'red') {
        alertDiv.classList.add('bg-red-500');
    }
    
    alertDiv.textContent = message;
    
    alertContainer.appendChild(alertDiv);
    
    // Animate in
    setTimeout(() => {
        alertDiv.style.transform = 'translate-x-0';
    }, 10);
    
    // Animate out and remove after a few seconds
    setTimeout(() => {
        alertDiv.style.transform = 'translate-x-full';
        alertDiv.style.opacity = '0';
        setTimeout(() => {
            alertDiv.remove();
        }, 500); // Wait for the transition to finish before removing
    }, 5000);
}

// --- Lifecycle Hook ---
onMounted(async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            userId.value = session.user.id;
            console.log("User authenticated with ID:", userId.value);
            await fetchAllOwnerData();
        } else {
            console.log("No active session found.");
            // Handle case where user is not logged in, e.g., redirect to login
        }
    } catch (error) {
        console.error("Session fetch failed:", error.message);
    }
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
    font-family: 'Inter', sans-serif;
    background-color: #F3F4F6;
}
.sidebar {
    width: 280px;
}
.main-content {
    flex-grow: 1;
}
@media (max-width: 768px) {
    .sidebar {
        width: 100%;
        height: auto;
        position: static;
    }
    .main-content {
        margin-left: 0;
    }
}
</style>