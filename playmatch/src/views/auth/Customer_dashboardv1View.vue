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
    selectedNotification: null,
    showNotificationDialog: false,
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
    limitedPlaymateRequests() {
      return {
        // Only the first 3 items for the display
        display: this.playmateRequests.slice(0, 3),
        // The total number of requests
        totalCount: this.playmateRequests.length,
      }
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
      this.checkIfScrollable() // Corrected name
    })

    // Use the same name for the resize listener
    window.addEventListener('resize', this.checkIfScrollable)
  },

  beforeUnmount() {
    if (this.favSubscription) this.favSubscription.unsubscribe()
    if (this.ratingSubscription) this.ratingSubscription.unsubscribe()
    window.removeEventListener('resize', this.checkIfScrollable)
  },

  watch: {
    // Trigger when facilities are loaded
    popularFacilities(newVal) {
      if (newVal.length > 1) {
        this.triggerSwipeHint()
      }
    },
  },

  methods: {
    // Method to show swipe hint temporarily
    triggerSwipeHint() {
      // Determine if we should show it
      const isMobileOrTablet = this.$vuetify.display.smAndDown
      const isLongList = this.popularFacilities.length > 2

      // Only show if there are enough items to actually swipe
      if (this.popularFacilities.length > 1) {
        this.showSwipeHint = true

        // Changed to 7000ms (7 seconds) so users have time to see it
        setTimeout(() => {
          this.showSwipeHint = false
        }, 8000)
      }
    },

    // Independent method for checking scroll
    checkIfScrollable() {
      const container = this.$refs.popularContainer
      if (container) {
        // Only true if items actually overflow the screen
        this.isScrollable = container.scrollWidth > container.clientWidth
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

    // Replace the existing handleNotificationClick method in ReservoSportBookingHome.vue

    async handleNotificationClick(notification) {
      // Mark as read first
      await this.markNotificationAsRead(notification.id)

      // Route based on notification type
      if (notification.type === 'booking_status') {
        // Parse the notification message to determine booking status
        const message = notification.message.toLowerCase()

        let tabIndex = 0 // Default to 'Accepted' tab

        // Determine which tab to open based on the message content
        if (message.includes('accepted') || message.includes('approved')) {
          tabIndex = 0 // Accepted tab
        } else if (message.includes('rejected') || message.includes('declined')) {
          tabIndex = 3 // Rejected tab
        }

        // Navigate to customer-bookings with the tab query parameter
        this.$router.push({
          name: 'customer-bookings',
          query: { tab: tabIndex },
        })
      }

      // Handle playmate-related notifications with specific tabs
      if (notification.type === 'playmate_join' || notification.type === 'playmate_withdraw') {
        const message = notification.message.toLowerCase()
        let filter = 'all' // Default filter

        // Determine which filter/tab to show based on notification content
        if (message.includes('joined') || message.includes('accepted your challenge')) {
          // Someone joined your request - show all or individual based on type
          filter = 'all'
        } else if (message.includes('withdrawn') || message.includes('left')) {
          // Someone withdrew - show all to see updated status
          filter = 'all'
        }

        // Navigate to playmate-requests with the filter query parameter
        this.$router.push({
          name: 'playmate-requests',
          query: { filter: filter },
        })
      }

      // Handle direct invite notifications
      if (notification.type === 'playmate_invite') {
        const message = notification.message.toLowerCase()

        if (message.includes('invited you') || message.includes('sent you')) {
          // New invite received - show direct_invite tab
          this.$router.push({
            name: 'playmate-requests',
            query: { filter: 'direct_invite' },
          })
        } else if (message.includes('accepted') || message.includes('confirmed')) {
          // Invite was accepted - show direct_invite tab
          this.$router.push({
            name: 'playmate-requests',
            query: { filter: 'direct_invite' },
          })
        } else if (message.includes('rejected') || message.includes('declined')) {
          // Invite was rejected - show direct_invite tab
          this.$router.push({
            name: 'playmate-requests',
            query: { filter: 'direct_invite' },
          })
        }
      }

      // Close dropdown after click
      this.notificationMenu = false
    },

    viewNotification(notification) {
      this.selectedNotification = notification
      this.showNotificationDialog = true
    },

    async deleteNotification(notificationId) {
      try {
        const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

        if (error) throw error

        // Refresh list
        await this.fetchNotifications()

        // Close dialog if deleted item is open
        if (this.selectedNotification?.id === notificationId) {
          this.showNotificationDialog = false
          this.selectedNotification = null
        }
      } catch (err) {
        console.error('Failed to delete notification:', err.message)
      }
    },

    async deleteAllNotifications() {
      if (!this.currentUserId) return

      const confirmDelete = confirm('Are you sure you want to delete all notifications?')
      if (!confirmDelete) return

      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', this.currentUserId)

        if (error) throw error

        // Reset local state
        this.notifications = []
        this.unreadCount = 0
        this.notificationMenu = false
      } catch (err) {
        console.error('Failed to delete all notifications:', err.message)
      }
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
            class="text-body-1 font-weight-bold pb-1 d-flex justify-space-between align-center notification-gradient text-white"
          >
            Notifications

            <div class="d-flex align-center">
              <!-- Mark all as read -->
              <v-btn
                v-if="unreadCount > 0"
                small
                variant="text"
                density="compact"
                class="ma-0 pa-0 mr-2 text-caption text-white"
                @click.stop="markAllNotificationsAsRead"
              >
                Mark all
              </v-btn>

              <!-- Delete All -->
              <v-btn
                v-if="notifications.length > 0"
                small
                variant="text"
                density="compact"
                class="ma-0 pa-0 mr-2 text-caption text-white"
                @click.stop="deleteAllNotifications"
              >
                Delete all
              </v-btn>

              <!-- Close Menu -->
              <v-btn icon size="x-small" variant="text" @click="notificationMenu = false">
                <v-icon color="white">mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <div v-if="notifications.length === 0" class="text-center py-4 grey--text">
            No notifications yet.
          </div>

          <v-list v-else class="py-0" style="overflow-y: auto; max-height: 350px">
            <template v-for="(n, index) in notifications" :key="n.id">
              <v-list-item
                @click="handleNotificationClick(n)"
                :style="!n.read ? 'background-color: #e3f2fd;' : ''"
              >
                <!-- TITLE ROW -->
                <v-list-item-title class="d-flex align-center mt-2">
                  <v-icon color="blue" size="20" class="mr-2">
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

                  {{ n.title }}
                </v-list-item-title>

                <v-list-item-content>
                  <v-list-item-subtitle class="mt-2">{{ n.message }}</v-list-item-subtitle>
                  <div class="text-caption grey--text mt-1">
                    {{ formatDate(n.created_at) }} • {{ formatTime(n.created_at) }}
                  </div>
                </v-list-item-content>

                <div class="d-flex justify-end">
                  <div class="d-flex" style="gap: 8px">
                    <v-list-item-action class="d-flex align-center mt-2 mb-2">
                      <!-- View -->
                      <v-btn icon size="x-small" class="mr-2" @click.stop="viewNotification(n)">
                        <v-icon size="18" color="blue">mdi-eye</v-icon>
                      </v-btn>

                      <!-- Delete -->
                      <v-btn icon size="x-small" @click.stop="deleteNotification(n.id)">
                        <v-icon size="18" color="red">mdi-delete</v-icon>
                      </v-btn>
                    </v-list-item-action>
                  </div>
                </div>
              </v-list-item>

              <!-- Divider between items -->
              <v-divider v-if="index < notifications.length - 1" />
            </template>
          </v-list>
        </v-card>
      </v-menu>

      <v-dialog v-model="showNotificationDialog" max-width="500">
        <v-card v-if="selectedNotification" class="rounded-xl">
          <!-- Header -->
          <v-card-title
            class="notification-gradient text-white d-flex justify-space-between align-center"
          >
            <span>{{ selectedNotification.title }}</span>
            <v-btn icon size="small" variant="text" @click="showNotificationDialog = false">
              <v-icon color="white">mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-divider />

          <!-- Body -->
          <v-card-text class="pa-4">
            <div class="text-caption grey--text mb-3">
              {{ formatDate(selectedNotification.created_at) }} •
              {{ formatTime(selectedNotification.created_at) }}
            </div>

            <div class="text-body-1">
              {{ selectedNotification.message }}
            </div>
          </v-card-text>

          <v-divider />

          <!-- Actions -->
          <v-card-actions class="pa-3">
            <v-spacer />

            <v-btn
              color="error"
              variant="text"
              class="text-none"
              @click="deleteNotification(selectedNotification.id)"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
                <h2 class="text-h6 font-weight-bold">Welcome, {{ userName }}!</h2>
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
        <v-row no-gutters class="px-4" v-if="!searchQuery">
          <v-col cols="12" class="d-flex align-center justify-space-between mb-3">
            <h2 class="text-h6 font-weight-medium mb-2">
              Available Playmate Requests ({{ limitedPlaymateRequests.totalCount }})
            </h2>
            <v-btn
              text
              small
              color="blue"
              class="rounded-lg text-none px-2"
              min-width="70"
              @click="goToPlaymateRequests"
            >
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

            <v-col
              v-else
              cols="12"
              v-for="req in limitedPlaymateRequests.display"
              :key="req.id"
              class="mb-3 pa-0"
            >
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
                <div
                  v-if="showSwipeHint && isScrollable"
                  class="swipe-hint d-flex align-center justify-center"
                >
                  <div class="swipe-hint-content py-2 px-4 rounded-pill">
                    <v-icon size="20" color="white" class="mr-2 swipe-animation"
                      >mdi-gesture-swipe-left</v-icon
                    >
                    <span class="text-caption white--text font-weight-medium"
                      >Swipe to see more</span
                    >
                  </div>
                </div>
              </transition>

              <div
                class="d-flex overflow-x-auto pb-2 facility-scroll-container"
                ref="popularContainer"
              >
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
                    <v-img
                      :src="facility.image"
                      height="200"
                      class="grey lighten-3 rounded-xl"
                      cover
                    >
                      <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                        <v-chip
                          x-small
                          dark
                          color="white"
                          class="text-overline font-weight-bold glass-chip"
                        >
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
                      <v-img
                        :src="facility.image"
                        height="200"
                        class="grey lighten-3 rounded-xl"
                        cover
                      >
                        <v-card-text class="d-flex justify-space-between align-start pt-2 pr-2">
                          <v-chip
                            x-small
                            dark
                            color="white"
                            class="text-overline font-weight-bold glass-chip"
                          >
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
                  <div class="mr-3 ml-2 d-flex flex-column align-center" style="width: 100px">
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

    <div class="nav-container">
      <v-bottom-navigation
        v-model="activeNav"
        class="floating-nav"
        grow
        height="55"
        elevation="10"
      >
        <v-btn value="home" @click="$router.push({ name: 'customer-dashboard' })">
          <v-icon size="30">mdi-home</v-icon>
        </v-btn>

        <v-btn value="bookings" @click="$router.push({ name: 'customer-bookings' })">
          <v-icon size="28">mdi-calendar-check</v-icon>
        </v-btn>

        <v-btn value="favorites" @click="$router.push({ name: 'favorites' })">
          <v-icon size="26">mdi-heart</v-icon>
        </v-btn>

        <v-btn value="profile" @click="$router.push({ name: 'customer-profile' })">
          <v-icon size="31">mdi-account</v-icon>
        </v-btn>
      </v-bottom-navigation>
    </div>
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

/* 1. The Container - Forces the entire bar to the absolute center */
.nav-container {
  position: fixed;
  bottom: 10px; /* Floating distance from bottom */
  left: 50%; /* Start at the center */
  transform: translateX(-50%); /* Pull back by half its width to perfectly center */
  width: 90%; 
  max-width: 420px;
  z-index: 1000;
  display: flex;
  justify-content: center;
}

/* 2. The Main Floating Pill */
.floating-nav {
  width: 100% !important;
  border-radius: 40px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  display: flex;
  align-items: center;
  overflow: visible !important; /* Important for the indicator to show correctly */
}

/* 3. REMOVE THE GREY SQUARE & OVERLAYS */
/* This targets the internal Vuetify layers that cause the grey background */
:deep(.v-btn__overlay),
:deep(.v-btn__underlay),
:deep(.v-ripple__container) {
  display: none !important;
}

/* 4. Individual Button Settings */
.floating-nav .v-btn {
  background: transparent !important;
  flex: 1;
  height: 65px !important;
  min-width: 0 !important;
  position: relative;
  transition: transform 0.2s ease;
}

/* 5. Icon Colors and Transitions */
.floating-nav .v-icon {
  color: #444 !important;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.floating-nav .v-btn--active .v-icon {
  color: #1a65a2 !important; /* Deep blue when active */
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
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-10px);
  }
  100% {
    transform: translateX(0);
  }
}

.swipe-animation {
  animation: swipeAnimation 1.5s infinite ease-in-out;
}

/* Fade transition for the whole hint */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
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

.notification-gradient {
  background: linear-gradient(
    to bottom right,
    rgba(26, 101, 162, 0.6),
    rgba(119, 154, 229, 0.6)
  ) !important;
}

.notification-gradient-btn {
  background: linear-gradient(
    to bottom right,
    rgba(26, 101, 162, 0.6),
    rgba(119, 154, 229, 0.6)
  ) !important;
  color: white !important;
}

.notification-gradient-btn:hover {
  filter: brightness(1.1);
}
</style>
