<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'ReservoSportBookingHome',
  data: () => ({
    activeNav: 'home',
    currentUserId: null,
    // NEW: Data property for the user's name
    userName: 'User',
    playmateRequests: [],
    playmateLoading: false,
    facilities: [],
    popularFacilities: [],
    favorites: [],
    favoriteIds: [],
    loading: false,
    error: null,
    isGridView: false,
    notifications: [],
    unreadCount: 0,
    notificationMenu: false,
    showMobileSearch: false,
    showSwipeHint: false,
    isScrollable: false,

    // Search Query Data Property
    searchQuery: '',

    // Rating dialog state
    ratingDialog: {
      visible: false,
      facility: null,
      value: 0,
    },
  }),

  computed: {
    filteredFacilities() {
      if (!this.searchQuery || this.searchQuery.trim() === '') {
        return this.facilities
      }

      const query = this.searchQuery.toLowerCase().trim()

      return this.facilities.filter(
        (facility) =>
          facility.name.toLowerCase().includes(query) ||
          facility.type.toLowerCase().includes(query) ||
          facility.address.toLowerCase().includes(query),
      )
    },
  },

  async mounted() {
    // Check if user is logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn('⚠️ No session found — redirecting to Sign In.')
      this.$router.push({ name: 'signin' })
      return // Stop execution
    }

    // Store current user ID
    this.currentUserId = session.user.id
    console.log('✅ Logged-in user ID:', this.currentUserId)

    // NEW: Fetch the user's name immediately after getting the ID
    await this.fetchUserName()

    await this.subscribeUserToPush()

    await this.fetchFavorites()
    this.subscribeFavoritesRealtime()
    this.subscribeRatingsRealtime()
    await this.fetchNotifications()
    this.subscribeNotificationsRealtime()
    await this.fetchFacilities()
    this.fetchPlaymateRequests()
    setInterval(() => {
      this.fetchPlaymateRequests()
    }, 30000)

    // Initial check after the page renders
    this.$nextTick(() => {
      this.checkIfScrollable(); // Corrected name
    });
    
    // Use the same name for the resize listener
    window.addEventListener('resize', this.checkIfScrollable);
  },

  beforeUnmount() {
    if (this.favSubscription) this.favSubscription.unsubscribe()
    if (this.ratingSubscription) this.ratingSubscription.unsubscribe()
    window.removeEventListener('resize', this.checkIfScrollable);
  },

  watch: {
    // Trigger when facilities are loaded
    popularFacilities(newVal) {
      if (newVal.length > 1) {
        this.triggerSwipeHint();
      }
    }
  },

  methods: {
    // Method to show swipe hint temporarily
    triggerSwipeHint() {
      // Determine if we should show it
      const isMobileOrTablet = this.$vuetify.display.smAndDown;
      const isLongList = this.popularFacilities.length > 2;

      // Only show if there are enough items to actually swipe
      if (this.popularFacilities.length > 1) {
        this.showSwipeHint = true;
        
        // Changed to 7000ms (7 seconds) so users have time to see it
        setTimeout(() => {
          this.showSwipeHint = false;
        }, 8000);
      }
    },

    // Independent method for checking scroll
    checkIfScrollable() { 
      const container = this.$refs.popularContainer;
      if (container) {
        // Only true if items actually overflow the screen
        this.isScrollable = container.scrollWidth > container.clientWidth;
      }
    },

    // NEW: Method to fetch the user's name from the 'profiles' table
    async fetchUserName() {
      if (!this.currentUserId) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', this.currentUserId)
          .single()

        if (error) throw error

        if (data && data.full_name) {
          // Update the userName data property
          this.userName = data.full_name.split(' ')[0] || 'Player' // Use first name if available
          console.log('👤 User name loaded:', this.userName)
        } else {
          this.userName = 'Player' // Default if full_name is null
        }
      } catch (err) {
        console.error('Error fetching user name:', err.message)
        // Keep default name in case of error
        this.userName = 'Player'
      }
    },

    toggleView() {
      this.isGridView = !this.isGridView
    },

    // Get logged-in user (kept for completeness, but already handled in mounted)
    async getCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        this.currentUserId = data.user?.id || null
        console.log('✅ Current user ID:', this.currentUserId)
      } catch (err) {
        console.error('Error fetching current user:', err.message)
        this.currentUserId = null
      }
    },

    async handleNotificationClick(notification) {
      // Mark as read first
      await this.markNotificationAsRead(notification.id)

      // Route based on notification type
      if (notification.type === 'booking_status') {
        this.$router.push({ name: 'customer-bookings' })
      }

      if (notification.type === 'playmate_join' || notification.type === 'playmate_withdraw') {
        this.$router.push({ name: 'playmate-requests' })
      }

      // Close dropdown after click
      this.notificationMenu = false
    },

    async markAllNotificationsAsRead() {
      if (!this.currentUserId) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', this.currentUserId)
        .eq('read', false)

      if (error) {
        console.error('Failed to mark all notifications as read:', error.message)
        return
      }

      // Update local state instantly
      this.notifications = this.notifications.map((n) => ({ ...n, read: true }))
      this.unreadCount = 0
    },

    async fetchNotifications() {
      if (!this.currentUserId) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading notifications:', error.message)
        return
      }

      this.notifications = data
      this.unreadCount = data.filter((n) => !n.read).length
    },

    async markNotificationAsRead(id) {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)

      if (!error) {
        this.fetchNotifications()
      }
    },

    async subscribeNotificationsRealtime() {
      if (!this.currentUserId) return
      this.notificationSubscription = supabase
        .channel('notifications-user-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT', // Only listen for new notifications
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${this.currentUserId}`,
          },
          (payload) => {
            console.log('🔔 New notification:', payload.new)
            this.fetchNotifications() // Refetch to show the new one
          },
        )
        .subscribe()
    },

    async registerServiceWorker() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js')
          console.log('Service Worker registered', registration)
          return registration
        } catch (err) {
          console.error('Service Worker registration failed', err)
        }
      }
    }, // Subscribe to Push Notifications

    async subscribeUserToPush() {
      if (!('PushManager' in window) || !this.currentUserId) return

      try {
        const registration = await this.registerServiceWorker()
        if (!registration) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // ✅ CHECK EXISTING SUBSCRIPTION FIRST
        let existingSub = await registration.pushManager.getSubscription()

        if (existingSub) {
          console.log('Removing old push subscription...')
          await existingSub.unsubscribe() // IMPORTANT FIX
        }

        // ✅ CREATE NEW SUBSCRIPTION WITH CURRENT VAPID KEY
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'BFoHJa51OHMAJEgR8s6qpsn07pV8l5zWEI0fLoBqXBpVSkjnKvxWbBS93IMSP0g8sVm6JyK3CnSL_wKXlZbOiFk',
          ),
        })

        const { error } = await supabase.from('push_subscriptions').upsert([
          {
            user_id: this.currentUserId,
            endpoint: subscription.endpoint,
            keys: subscription.toJSON().keys,
          },
        ])

        if (error) console.error('Error saving push subscription:', error)
        else console.log('✅ Push subscription saved successfully!')
      } catch (err) {
        console.error('Push subscription failed:', err)
      }
    },
    urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
    }, // Subscribe to Realtime Notifications

    async subscribeNotificationsRealtime() {
      if (!this.currentUserId) return

      this.notificationSubscription = supabase
        .channel('notifications-user-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${this.currentUserId}`,
          },
          async (payload) => {
            console.log('🔔 New notification:', payload.new)
            await this.fetchNotifications() // Show browser push

            if (Notification.permission === 'granted') {
              new Notification(payload.new.title, { body: payload.new.message })
            } // Optional: Call Edge Function to send push via service worker if needed

            await fetch('/api/send-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: this.currentUserId,
                title: payload.new.title,
                message: payload.new.message,
              }),
            })
          },
        )
        .subscribe()
    },

    // Logout
    async logout() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        localStorage.clear()
        this.currentUserId = null
        this.ratingDialog = { visible: false, facility: null, value: 0 }
        this.$router.push({ name: 'signin' })
      } catch (err) {
        console.error('Logout failed:', err.message)
        alert('Failed to logout. Please try again.')
      }
    },

    // Toggle favorites
    async toggleFavorite(facilityId) {
      if (!this.currentUserId) {
        alert('Please log in to add favorites.')
        return
      }

      const isFav = this.isFavorite(facilityId)

      try {
        if (isFav) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', this.currentUserId)
            .eq('facility_id', facilityId)
          if (error) throw error

          this.favoriteIds = this.favoriteIds.filter((id) => id !== facilityId)
          this.favorites = this.favorites.filter((f) => f.id !== facilityId)
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert([{ user_id: this.currentUserId, facility_id: facilityId }])
          if (error) throw error
          await this.fetchFavorites()
        }
      } catch (err) {
        console.error('Error toggling favorite:', err.message)
      }
    },

    // Check if facility is favorite
    isFavorite(facilityId) {
      return this.favoriteIds.includes(facilityId)
    },

    // Fetch favorites
    async fetchFavorites() {
      if (!this.currentUserId) return
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(
            `
              id,
              created_at,
              facilities (
                id,
                facility_name,
                address,
                facility_type,
                image_url,
                price_per_hour
              )
            `,
          )
          .eq('user_id', this.currentUserId)

        if (error) throw error

        this.favorites = data.map((f) => ({
          id: f.facilities.id,
          facility_name: f.facilities.facility_name,
          address: f.facilities.address,
          facility_type: f.facilities.facility_type,
          image_url: f.facilities.image_url,
          price_per_hour: f.facilities.price_per_hour,
        }))
        this.favoriteIds = this.favorites.map((f) => f.id)
        console.log('⭐ Favorites loaded:', this.favorites)
      } catch (err) {
        console.error('Error fetching favorites:', err.message)
      } finally {
        this.loading = false
      }
    },

    // Subscribe to real-time favorites
    async subscribeFavoritesRealtime() {
      if (!this.currentUserId) return
      this.favSubscription = supabase
        .channel('favorites-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorites',
            filter: `user_id=eq.${this.currentUserId}`,
          },
          async () => {
            console.log('🔄 Favorites updated, refetching...')
            await this.fetchFavorites()
          },
        )
        .subscribe()
    },

    // Subscribe to real-time ratings
    async subscribeRatingsRealtime() {
      this.ratingSubscription = supabase
        .channel('ratings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ratings',
          },
          async () => {
            console.log('🔄 Ratings updated, refetching facilities...')
            // This call ensures all users get the consistent, calculated average
            await this.fetchFacilities()
          },
        )
        .subscribe()
    },

    // Open rating dialog
    async openRatingDialog(facility) {
      if (!this.currentUserId) {
        alert('Please log in to rate facilities.')
        return
      }

      this.ratingDialog.facility = facility
      this.ratingDialog.value = facility.myRating || 0
      this.ratingDialog.visible = true
    },

    // Close rating dialog
    closeRatingDialog() {
      this.ratingDialog.visible = false
      this.ratingDialog.facility = null
      this.ratingDialog.value = 0
    },

    // Submit or update rating
    async submitRating() {
      if (!this.ratingDialog.value) {
        alert('Please select a star rating first.')
        return
      }

      try {
        const { facility, value } = this.ratingDialog

        // Check if a rating already exists for this user and facility
        const { data: existing, error: fetchError } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', facility.id)
          .limit(1)

        if (fetchError) throw fetchError

        const existingRatingId = existing && existing.length > 0 ? existing[0].id : null

        if (existingRatingId) {
          // Update existing rating
          const { error: updateError } = await supabase
            .from('ratings')
            .update({ rating_value: value })
            .eq('id', existingRatingId)
          if (updateError) throw updateError
        } else {
          // Insert new rating
          const { error: insertError } = await supabase.from('ratings').insert([
            {
              user_id: this.currentUserId,
              facility_id: facility.id,
              rating_value: value,
            },
          ])
          if (insertError) throw insertError
        }

        this.closeRatingDialog()
      } catch (err) {
        console.error('Error submitting rating:', err.message)
        alert('Failed to submit rating. Please try again.')
      }
    },

    // Fetch facilities, calculate ratings, and sort/filter
    async fetchFacilities() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select(
            `
              id,
              facility_name,
              facility_type,
              address,
              price_per_hour,
              image_url,
              ratings:ratings(user_id, rating_value)
            `,
          )
          .limit(50) // Fetch a decent pool

        if (error) throw error

        let facilitiesWithRatings = data.map((f) => {
          const ratings = f.ratings || []
          const ratingCount = ratings.length

          // Calculate average rating as a number for proper sorting
          const numericAverageRating =
            ratingCount > 0 ? ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratingCount : 0

          const averageRatingFormatted = numericAverageRating.toFixed(1)

          const myRating = this.currentUserId
            ? ratings.find((r) => r.user_id === this.currentUserId)?.rating_value || 0
            : 0

          return {
            id: f.id,
            name: f.facility_name,
            type: f.facility_type,
            address: f.address,
            price: f.price_per_hour,
            image: f.image_url,
            rating: averageRatingFormatted,
            numericRating: numericAverageRating,
            reviews: ratingCount,
            myRating,
            ratings,
          }
        })

        // filter out facilities with zero reviews for the "Popular" list
        let ratedFacilities = facilitiesWithRatings.filter((f) => f.reviews > 0)

        // Sort the rated facilities:
        ratedFacilities.sort((a, b) => {
          if (b.numericRating !== a.numericRating) {
            return b.numericRating - a.numericRating
          }
          return b.reviews - a.reviews
        })

        facilitiesWithRatings.sort((a, b) => {
          if (b.numericRating !== a.numericRating) {
            return b.numericRating - a.numericRating
          }
          return b.reviews - a.reviews
        })
        this.facilities = facilitiesWithRatings

        // 4. Assign the top 5 rated (and reviewed) facilities to the popularFacilities array
        this.popularFacilities = ratedFacilities.slice(0, 5)
      } catch (err) {
        console.error('Error fetching facilities:', err.message)
      } finally {
        this.loading = false
      }
    },

    // Playmate helpers
    isCreator(creatorId) {
      return this.currentUserId === creatorId
    },

    handlePlaymateAction(request) {
      if (this.isCreator(request.creator_id)) {
        this.$router.push({ name: 'playmate-requests' })
      } else {
        this.goToPlaymateRequests()
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date)) return ''
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    },

    formatTime(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      if (isNaN(date)) return ''
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    },

    goToPlaymateRequests() {
      this.$router.push({ name: 'playmate-requests' })
    },

    async fetchPlaymateRequests() {
      this.playmateLoading = true

      try {
        const now = new Date().toISOString()

        const { data, error } = await supabase
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name)')
          .eq('status', 'open')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (error) throw error

        // ✅ KEEP ONLY ACTIVE (not finished)
        const stillActive = data.filter((req) => {
          if (!req.date || !req.end_time) return false

          const endDateTime = new Date(`${req.date}T${req.end_time}`)
          return endDateTime.getTime() > Date.now()
        })

        this.playmateRequests = stillActive.map((req) => ({
          ...req,
          creator_name: req.creator?.full_name || 'Anonymous',
        }))
      } catch (err) {
        console.error('Error fetching playmate requests:', err)
      } finally {
        this.playmateLoading = false
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
      <v-toolbar-title class="font-weight-bold ml-3 text-white">PlayMatch</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-text-field
        v-if="$vuetify.display.mdAndUp"
        v-model="searchQuery"
        placeholder="Search facilities, sports, or location"
        hide-details
        single-line
        filled
        rounded
        dense
        clearable
        class="shrink mx-3"
        dark
        color="white"
      >
        <template v-slot:prepend-inner>
          <v-icon color="white">mdi-magnify</v-icon>
        </template>
      </v-text-field>

      <v-btn
        v-if="$vuetify.display.smAndDown && !showMobileSearch"
        icon
        @click="showMobileSearch = true"
      >
        <v-icon color="white">mdi-magnify</v-icon>
      </v-btn>

      <transition name="slide-fade">
        <v-text-field
          v-if="$vuetify.display.smAndDown && showMobileSearch"
          v-model="searchQuery"
          placeholder="Search..."
          hide-details
          single-line
          filled
          rounded
          dense
          clearable
          class="mx-3"
          dark
          color="white"
          @blur="showMobileSearch = false"
        >
          <template v-slot:prepend-inner>
            <v-icon color="white">mdi-magnify</v-icon>
          </template>
        </v-text-field>
      </transition>

      <v-menu v-model="notificationMenu" offset-y left>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-badge color="red" :content="unreadCount" v-if="unreadCount > 0" overlap>
              <v-icon color="white">mdi-bell</v-icon>
            </v-badge>

            <v-icon v-else color="white">mdi-bell</v-icon>
          </v-btn>
        </template>

        <v-card width="350" max-height="400" rounded="xl" elevation="3">
          <v-card-title
            class="text-body-1 font-weight-bold pb-1 d-flex justify-space-between align-center"
          >
            Notifications

            <v-btn
              v-if="unreadCount > 0"
              small
              variant="text"
              density="compact"
              color="blue"
              class="ma-0 pa-0 min-h-0 text-caption"
              style="border: none !important; box-shadow: none !important"
              @click.stop="markAllNotificationsAsRead"
            >
              Mark all as read
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>

          <div v-if="notifications.length === 0" class="text-center py-4 grey--text">
            No notifications yet.
          </div>

          <v-list v-else class="py-0" style="overflow-y: auto; max-height: 350px">
            <v-list-item
              v-for="n in notifications"
              :key="n.id"
              @click="handleNotificationClick(n)"
              :style="!n.read ? 'background-color: #e3f2fd;' : ''"
            >
              <v-list-item-avatar>
                <v-icon color="blue">
                  {{
                    n.type === 'booking_status'
                      ? 'mdi-calendar-check'
                      : n.type === 'playmate_join'
                        ? 'mdi-account-plus'
                        : n.type === 'playmate_withdraw'
                          ? 'mdi-account-remove'
                          : 'mdi-bell'
                  }}
                </v-icon>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>{{ n.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ n.message }}</v-list-item-subtitle>
                <div class="text-caption grey--text mt-1">
                  {{ formatDate(n.created_at) }} • {{ formatTime(n.created_at) }}
                </div>
              </v-list-item-content>

              <v-list-item-action>
                <v-icon small color="grey">mdi-chevron-right</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>

      <v-btn icon @click="logout"><v-icon color="red">mdi-logout</v-icon></v-btn>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container fluid class="pa-0">
        <v-row no-gutters class="px-4 pt-10 pb-4 mb-2">
          <v-col cols="12">
            <v-card
              dark
              rounded="xl"
              flat
              class="pa-4 d-flex align-center justify-space-between text-white banner-animated"
              :style="{
                background:
                  'linear-gradient(to right, rgba(26, 101, 162, 1), rgba(119, 154, 229, 1))',
              }"
            >
              <div>
                <h2 class="text-h6 font-weight-bold">Welcome back, {{ userName }}!</h2>
                <div class="typing-container">
                  <p class="text-subtitle-2 mb-0 mt-1 typing-text">
                    Find and book the perfect facility for your next match.
                  </p>
                </div>
              </div>

              <v-icon size="40" class="ml-3 sport-icon-animation">mdi-whistle</v-icon>
            </v-card>
          </v-col>
        </v-row>
        <v-row no-gutters class="px-4">
          <v-col cols="12" class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-medium mb-2">Available Playmate Requests</h2>
            <v-btn text small color="blue" class="rounded-lg text-none" @click="goToPlaymateRequests">
              View All <v-icon right small>mdi-chevron-right</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="12">
            <div v-if="playmateLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue" />
            </div>

            <div v-else-if="playmateRequests.length === 0" class="text-center grey--text py-4">
              No playmate requests found.
            </div>

            <v-col v-else cols="12" v-for="req in playmateRequests" :key="req.id" class="mb-3 pa-0">
              <v-card class="pa-6 d-flex align-center" rounded="xl" elevation="1">
                <v-avatar color="blue lighten-4" size="44" class="mr-4">
                  <span class="white--text font-weight-bold">{{ req.creator_name[0] }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-semibold text-body-1">
                    {{ req.creator_name }} • {{ req.sport }}
                  </div>
                  <div class="text-caption grey--text d-flex align-center">
                    <v-icon x-small class="mr-1">mdi-calendar-today</v-icon>
                    {{ formatDate(req.date) }}
                    <v-icon x-small class="ml-3 mr-1">mdi-clock-outline</v-icon>
                    {{ formatTime(req.start_time) }}
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  small
                  :color="isCreator(req.creator_id) ? 'orange darken-1' : 'blue'"
                  dark
                  rounded
                  class="text-none"
                  @click="handlePlaymateAction(req)"
                >
                  {{ isCreator(req.creator_id) ? 'Manage' : 'View' }}
                </v-btn>
              </v-card>
            </v-col>
          </v-col>
        </v-row>

        <v-row no-gutters class="facilities-section px-4 mt-5 mb-10" v-if="!searchQuery">
          <v-col cols="12" class="mb-3">
            <h2 class="text-h6 font-weight-medium">Popular Facilities</h2>
          </v-col>

          <v-col cols="12">
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue" />
            </div>

            <div v-else-if="popularFacilities.length === 0" class="text-center py-4 grey--text">
              No rated facilities found to display as popular.
            </div>

            <div v-else class="position-relative">
              <transition name="fade">
                <div v-if="showSwipeHint && isScrollable" class="swipe-hint d-flex align-center justify-center">
                  <div class="swipe-hint-content py-2 px-4 rounded-pill">
                    <v-icon size="20" color="white" class="mr-2 swipe-animation">mdi-gesture-swipe-left</v-icon>
                    <span class="text-caption white--text font-weight-medium">Swipe to see more</span>
                  </div>
                </div>
              </transition>

              <div class="d-flex overflow-x-auto pb-2 facility-scroll-container" ref="popularContainer">
                <v-card
                  v-for="facility in popularFacilities"
                  :key="facility.id"
                  class="mr-4 flex-shrink-0 mt-2"
                  width="280"
                  rounded="xl"
                  elevation="2"
                  @click="$router.push({ name: 'facility-details', params: { id: facility.id } })"
                >

                <div class="pa-3">
                  <v-img :src="facility.image" height="200" class="grey lighten-3 rounded-xl" cover>
                    <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                      <v-chip x-small dark color="white" class="text-overline font-weight-bold glass-chip">
                        {{ facility.type }}
                      </v-chip>
                      <v-btn icon dark @click.stop="toggleFavorite(facility.id)">
                        <v-icon :color="isFavorite(facility.id) ? 'red' : 'grey'">
                          {{ isFavorite(facility.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
                        </v-icon>
                      </v-btn>
                    </v-card-text>
                  </v-img>
                </div>

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
                      <v-chip color="green darken-1" dark small> ₱{{ facility.price }}/hour </v-chip>
                    </div>
                  </v-card-text>

                  <v-card-actions class="pt-0 pr-3 pb-3 justify-center">
                    <v-btn
                      small
                      color="blue"
                      dark
                      rounded
                      class="text-none"
                      @click.stop="
                        $router.push({ name: 'facility-details', params: { id: facility.id } })
                      "
                      >View Details</v-btn
                    >
                    <v-btn
                      small
                      :color="facility.myRating > 0 ? 'orange darken-1' : 'amber'"
                      dark
                      rounded
                      class="text-none"
                      @click.stop="openRatingDialog(facility)"
                    >
                      {{ facility.myRating > 0 ? 'Edit Rate' : 'Rate' }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </div>
            </div>
          </v-col>
        </v-row>
        <v-row no-gutters class="facilities-section px-4 mt-5 mb-10">
          <v-col cols="12" class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-medium">
              {{ searchQuery ? 'Search Results' : 'All Facilities' }}
            </h2>
            <v-btn icon @click="toggleView" v-if="!searchQuery">
              <v-icon>{{ isGridView ? 'mdi-view-list' : 'mdi-view-grid' }}</v-icon>
            </v-btn>
          </v-col>

          <v-col cols="12">
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate color="blue" />
            </div>

            <div
              v-else-if="searchQuery && filteredFacilities.length === 0"
              class="text-center py-4 grey--text"
            >
              No facilities found matching your search.
            </div>

            <div v-else>
              <v-row v-if="isGridView && !searchQuery" dense>
                <v-col
                  v-for="facility in facilities"
                  :key="facility.id"
                  cols="12"
                  sm="6"
                  md="4"
                  lg="3"
                >
                  <v-card
                    class="mr-2 mb-2 facility-card"
                    rounded="xl"
                    @click="$router.push({ name: 'facility-details', params: { id: facility.id } })"
                  >

                  <div class="pa-3">
                    <v-img :src="facility.image" height="200" class="grey lighten-3 rounded-xl" cover>
                      <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                        <v-chip x-small dark color="white" class="text-overline font-weight-bold glass-chip">
                          {{ facility.type }}
                        </v-chip>
                        <v-btn icon dark @click.stop="toggleFavorite(facility.id)">
                          <v-icon :color="isFavorite(facility.id) ? 'red' : 'grey'">
                            {{ isFavorite(facility.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
                          </v-icon>
                        </v-btn>
                      </v-card-text>
                    </v-img>
                  </div>

                    <v-card-title class="pb-1 text-body-1 font-weight-semibold pt-3">
                      {{ facility.name }}
                    </v-card-title>

                    <v-card-text class="py-0">
                      <div class="text-caption grey--text text-truncate mb-2">{{ facility.address }}</div>
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div class="d-flex align-center">
                          <v-icon small color="amber">mdi-star</v-icon>
                          <span class="text-caption ml-1 font-weight-medium">
                            {{ facility.rating }} ({{ facility.reviews }})
                          </span>
                        </div>
                        <v-chip color="green darken-1" dark small>
                          ₱{{ facility.price }}/hour
                        </v-chip>
                      </div>
                    </v-card-text>
                    <v-card-actions class="pt-0 pr-3 pb-3 justify-center">
                      <v-btn
                        small
                        color="blue"
                        dark
                        rounded
                        class="text-none"
                        @click.stop="
                          $router.push({ name: 'facility-details', params: { id: facility.id } })
                        "
                        >View Details</v-btn
                      >
                      <v-btn
                        small
                        :color="facility.myRating > 0 ? 'orange darken-1' : 'amber'"
                        dark
                        rounded
                        class="text-none"
                        @click.stop="openRatingDialog(facility)"
                      >
                        {{ facility.myRating > 0 ? 'Edit Rate' : 'Rate' }}
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>

              <div v-else>
                <v-card
                  v-for="facility in searchQuery ? filteredFacilities : facilities"
                  :key="facility.id"
                  class="d-flex pa-3 mb-4 align-start"
                  elevation="1"
                  rounded="xl"
                  width="100%"
                  @click.stop="
                    $router.push({ name: 'facility-details', params: { id: facility.id } })
                  "
                >
                  <div
                    class="mr-3 ml-2 d-flex flex-column align-center"
                    style="width: 100px"
                  >
                  
                    <div class="pa-1">
                      <v-img
                        :src="facility.image || '/images/default-facility.jpg'"
                        height="100"
                        width="100"
                        class="mr-2 rounded-xl grey lighten-3"
                        cover
                      />
                    </div>
                  </div>

                  <div class="flex-grow-1 text-left">
                    <div class="font-weight-semibold text-body-1 mb-2 mt-2">
                      {{ facility.name }}
                    </div>
                    <div class="text-caption grey--text mb-2">{{ facility.address }}</div>

                    <div class="d-flex align-center flex-wrap mb-2">
                      <v-icon small color="amber">mdi-star</v-icon>
                      <span class="text-caption ml-1">
                        {{ facility.rating }} ({{ facility.reviews }})
                      </span>
                      <v-chip
                        small
                        outlined
                        color="green darken-1"
                        text-color="green darken-1"
                        class="ml-3 font-weight-medium"
                      >
                        ₱{{ facility.price }}/hour
                      </v-chip>
                    </div>
                  </div>

                  <v-btn icon @click.stop="toggleFavorite(facility.id)">
                    <v-icon :color="isFavorite(facility.id) ? 'red' : 'grey'">
                      {{ isFavorite(facility.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
                    </v-icon>
                  </v-btn>
                </v-card>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-dialog v-model="ratingDialog.visible" max-width="400">
      <v-card>
        <v-card-title class="font-weight-bold">
          Rate {{ ratingDialog.facility?.name }}
        </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center my-4">
            <v-icon
              v-for="n in 5"
              :key="n"
              large
              :color="n <= ratingDialog.value ? 'amber' : 'grey'"
              class="mx-1"
              @click="ratingDialog.value = n"
            >
              {{ n <= ratingDialog.value ? 'mdi-star' : 'mdi-star-outline' }}
            </v-icon>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="closeRatingDialog">Cancel</v-btn>
          <v-btn color="blue" dark @click="submitRating">Submit</v-btn>
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
/* Standard Transition & Layout Styles  */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.facility-scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.facility-scroll-container::-webkit-scrollbar {
  display: none;
}

.v-card-actions {
  align-items: flex-start;
}

.v-card:hover {
  transform: scale(1.02);
}

.v-card {
  transition: 0.3s ease;
}

.v-bottom-navigation .v-btn{
  /* Make the button shape a circle */
  border-radius: 27% !important;
}

.v-bottom-navigation .v-btn:hover{
  transform: scale(1.1);
}

.v-app-bar .v-text-field {
  max-width: 300px;
}

.glass-chip {
  /* 1. Translucent white background */
  background: rgba(255, 255, 255, 0.2) !important;
  
  /* 2. The glass blur effect */
  backdrop-filter: blur(3px) !important;
  -webkit-backdrop-filter: blur(3px) !important; /* For Safari support */
  
  /* 3. Subtle thin border to define the shape */
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  

  /* 4. Soft shadow to give it lift */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
  
  /* Ensure text is readable over the blur */
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
}

/* --- ANIMATIONS --- */

/* Icon Shake Animation  */
@keyframes shake-icon {
  0%,
  100% {
    transform: rotate(0deg);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: rotate(-10deg); /* Increased angle for faster/more noticeable shake */
  }
  20%,
  40%,
  60%,
  80% {
    transform: rotate(10deg);
  }
}

.sport-icon-animation {
  animation: shake-icon 0.1s ease-in-out 50 forwards;
  transform-origin: 50% 50%;
}

/* Banner Fade-in Animation */
.banner-animated {
  animation: bannerFadeUp 0.9s ease-out forwards;
  opacity: 0;
  transform: translateY(15px);
}

@keyframes bannerFadeUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing Animation */
.typing-text {
  width: 0;
  overflow: hidden;
  white-space: nowrap;

  /* Ensure typing animation runs for a duration (e.g., 3.5s) */
  animation:
    typing 3.5s steps(57, end) forwards,
    blink-caret 0.75s step-end infinite;

  display: inline-block;
  border-right: 3px solid white;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: white;
  }
}

.position-relative {
  position: relative;
}

.swipe-hint {
  position: absolute;
  top: 50%;
  right: 15px; /* Moves it to the right side */
  transform: translateY(-45%);
  z-index: 10;
  pointer-events: none; /* User can click "through" it to the cards */
}

.swipe-hint-content {
  background: rgba(41, 41, 41, 0.6); /* Semi-transparent dark glass */
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px) !important; /* For Safari support */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
}

/* Force the text to be pure white if Vuetify classes are failing */
.swipe-hint-content span {
  color: #ffffff !important;
}

/* Animation for the hand icon */
@keyframes swipeAnimation {
  0% { transform: translateX(0); }
  50% { transform: translateX(-10px); }
  100% { transform: translateX(0); }
}

.swipe-animation {
  animation: swipeAnimation 1.5s infinite ease-in-out;
}

/* Fade transition for the whole hint */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Ensure the scroll container doesn't show scrollbars but allows swiping */
.facility-scroll-container::-webkit-scrollbar {
  display: none;
}
.facility-scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
</style>
