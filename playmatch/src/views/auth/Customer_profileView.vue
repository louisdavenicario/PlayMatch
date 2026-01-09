<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabaseClient'

const activeNav = ref('profile')
const router = useRouter()
const route = useRoute()
const profileData = ref(null)
const loading = ref(false)
const error = ref(null)

const isEditing = ref(false)
const formData = ref({})
const saving = ref(false)
const currentUserId = ref(null)

const receivedRatings = ref([])
const receivedRatingsLoading = ref(false)

// State for managing the active tab within the profile card
const activeProfileTab = ref('details')

const targetUserId = computed(() => route.params.userId || null)
const isViewingOther = computed(
  () => targetUserId.value && targetUserId.value !== currentUserId.value,
)

// Computed property to calculate the average rating
const averageRating = computed(() => {
  if (!receivedRatings.value || receivedRatings.value.length === 0) return 0
  const sum = receivedRatings.value.reduce((acc, rating) => acc + rating.rating, 0)
  return sum / receivedRatings.value.length
})

// Fetch ratings given to the user
const fetchReceivedRatings = async (userId) => {
  if (!userId) {
    receivedRatings.value = []
    return
  }

  receivedRatingsLoading.value = true
  try {
    const { data, error: ratingsError } = await supabase
      .from('playmate_ratings')
      .select('id, rating, comment, created_at, rater_id, request_id')
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })

    if (ratingsError) throw ratingsError

    const raterIds = data.map((r) => r.rater_id).filter(Boolean)
    const { data: raters } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', raterIds)

    const raterMap = raters.reduce((acc, r) => {
      acc[r.id] = r.full_name
      return acc
    }, {})

    const requestIds = data.map((r) => r.request_id).filter(Boolean)
    const { data: requests } = await supabase
      .from('playmate_requests')
      .select('id, sport, location')
      .in('id', requestIds)

    const requestMap = requests.reduce((acc, r) => {
      acc[r.id] = r
      return acc
    }, {})

    receivedRatings.value = data.map((r) => ({
      ...r,
      rater_name: raterMap[r.rater_id] || 'Anonymous',
      match_info: r.request_id
        ? `${requestMap[r.request_id]?.sport || 'Unknown Sport'} at ${requestMap[r.request_id]?.location || 'Unknown Location'}`
        : 'No match info',
    }))
  } catch (err) {
    console.error('Error fetching received ratings:', err.message)
    receivedRatings.value = []
  } finally {
    receivedRatingsLoading.value = false
  }
}

// Fetch profile data including sports
const fetchProfile = async () => {
  loading.value = true
  error.value = null
  profileData.value = null

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push({ name: 'signin' })
      return
    }
    currentUserId.value = user.id
    const idToFetch = targetUserId.value || user.id

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name, phone_number, address, city, zip_code, role, sports') // ✅ added sports
      .eq('id', idToFetch)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

    let finalData = { id: idToFetch, ...data }

    if (!isViewingOther.value) finalData.email = user.email
    else finalData.email = 'Hidden'

    profileData.value = finalData
    if (!isViewingOther.value) formData.value = { ...finalData }

    await fetchReceivedRatings(idToFetch)
  } catch (err) {
    console.error('Profile fetch failed:', err.message)
    error.value = 'Failed to load profile. Please try again.'
  } finally {
    loading.value = false
  }
}

const toggleEdit = () => {
  if (isViewingOther.value || !profileData.value) return
  isEditing.value = !isEditing.value
  if (isEditing.value) formData.value = { ...profileData.value }
}

const saveProfile = async () => {
  if (isViewingOther.value) return
  saving.value = true
  error.value = null

  try {
    const updates = {
      id: profileData.value.id,
      full_name: formData.value.full_name,
      phone_number: formData.value.phone_number,
      address: formData.value.address,
      city: formData.value.city,
      zip_code: formData.value.zip_code,
      sports: formData.value.sports, // ✅ include sports
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileData.value.id)
      .select()

    if (updateError) throw updateError

    await fetchProfile()
    isEditing.value = false
  } catch (err) {
    console.error('Profile update failed:', err.message)
    error.value = 'Failed to save profile. Please check your inputs and try again.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
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
      <v-toolbar-title class="font-weight-bold" style="color: white">
        {{ isViewingOther ? 'User Profile View' : 'My Profile' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container class="py-8">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <v-card class="pa-6" elevation="5" rounded="xl">
              <div v-if="loading" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-3 grey--text">Loading user data...</p>
              </div>

              <v-alert v-else-if="error" type="error" dense dismissible class="mb-4">
                Error: {{ error }}
              </v-alert>

              <v-card-text v-else-if="profileData" class="pa-0">
                <div class="text-center mb-6 px-6">
                  <v-avatar size="100" color="primary lighten-1" class="mb-3 elevation-2">
                    <span v-if="profileData.full_name" class="white--text text-h4">
                      {{ profileData.full_name.charAt(0).toUpperCase() }}
                    </span>
                    <v-icon v-else size="60" color="white">mdi-account-circle</v-icon>
                  </v-avatar>
                  <h2 class="text-h5 font-weight-bold">
                    {{ profileData.full_name || 'Customer' }}
                  </h2>
                  <p class="text-subtitle-1 grey--text text--darken-1">
                    {{ profileData.role || 'customer' }}
                  </p>
                </div>

                <v-tabs
                  v-model="activeProfileTab"
                  color="primary"
                  align-tabs="center"
                  grow
                  class="mb-4"
                >
                  <v-tab value="details" class="text-none">
                    <v-icon start>mdi-account-details-outline</v-icon>
                    Details
                  </v-tab>
                  <v-tab value="ratings" class="text-none">
                    <v-icon start>mdi-star-face</v-icon>
                    Ratings ({{ receivedRatings.length }})
                  </v-tab>
                </v-tabs>

                <v-window v-model="activeProfileTab" class="px-6 pb-4">
                  <v-window-item value="details">
                    <!-- VIEW MODE -->
                    <v-list dense class="profile-details-list" v-if="!isEditing">
                      <!-- Overall Rating -->
                      <div class="mb-4">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-1">
                          <v-icon class="mr-1" color="yellow-darken-2">mdi-star</v-icon> Overall
                          Rating
                        </p>
                        <div v-if="receivedRatings.length > 0" class="d-flex align-center">
                          <v-rating
                            :model-value="averageRating"
                            size="small"
                            density="compact"
                            readonly
                            half-increments
                            color="yellow-darken-2"
                            class="mr-2"
                          ></v-rating>
                          <span class="text-subtitle-1 font-weight-bold">
                            {{ averageRating.toFixed(1) }}
                          </span>
                          <span class="text-caption grey--text ml-1">
                            / 5 ({{ receivedRatings.length }} reviews)
                          </span>
                        </div>
                        <p v-else class="text-body-2 text-medium-emphasis">No ratings yet.</p>
                      </div>

                      <v-divider class="my-3"></v-divider>

                      <!-- Email -->
                      <v-list-item class="list-item-hover">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                          <v-icon color="blue">mdi-email-outline</v-icon> Email Address
                        </p>
                        <div>
                          <span class="text-subtitle-1 text-medium-emphasis">{{
                            isViewingOther ? 'Contact via chat/request' : profileData.email
                          }}</span>
                        </div>
                      </v-list-item>

                      <v-divider class="mt-3"></v-divider>

                      <!-- Full Name -->
                      <v-list-item class="list-item-hover">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                          <v-icon color="green">mdi-account-details-outline</v-icon> Full Name
                        </p>
                        <div>
                          <span class="text-subtitle-1 text-medium-emphasis">{{
                            profileData.full_name || 'N/A'
                          }}</span>
                        </div>
                      </v-list-item>

                      <v-divider class="mt-3"></v-divider>

                      <!-- Phone -->
                      <v-list-item class="list-item-hover">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                          <v-icon color="green">mdi-phone-outline</v-icon> Phone Number
                        </p>
                        <div>
                          <span class="text-subtitle-1 text-medium-emphasis">{{
                            profileData.phone_number || 'N/A'
                          }}</span>
                        </div>
                      </v-list-item>

                      <v-divider class="mt-3"></v-divider>

                      <!-- Address -->
                      <v-list-item class="list-item-hover">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                          <v-icon color="orange">mdi-map-marker-outline</v-icon> Address
                        </p>
                        <div>
                          <span class="text-subtitle-1 text-medium-emphasis">
                            {{ profileData.address || 'N/A' }}
                            {{ profileData.city || ''
                            }}{{ profileData.city && profileData.zip_code ? ', ' : '' }}
                            {{ profileData.zip_code || '' }}
                          </span>
                        </div>
                      </v-list-item>

                      <v-divider class="mt-3"></v-divider>

                      <!-- Sports -->
                      <v-list-item class="list-item-hover">
                        <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                          <v-icon color="purple">mdi-basketball</v-icon> Sports
                        </p>
                        <div>
                          <span class="text-subtitle-1 text-medium-emphasis">{{
                            profileData.sports || 'N/A'
                          }}</span>
                        </div>
                      </v-list-item>
                    </v-list>

                    <!-- EDIT MODE -->
                    <v-form v-else @submit.prevent="saveProfile">
                      <v-text-field
                        v-model="formData.full_name"
                        label="Full Name"
                        prepend-icon="mdi-account"
                        required
                        class="mb-3"
                      ></v-text-field>

                      <v-text-field
                        :value="profileData.email"
                        label="Email Address (Read Only)"
                        persistent-placeholder
                        readonly
                        prepend-icon="mdi-email"
                        disabled
                        class="mb-3"
                      ></v-text-field>

                      <v-text-field
                        v-model="formData.phone_number"
                        label="Phone Number"
                        prepend-icon="mdi-phone"
                        class="mb-3"
                      ></v-text-field>

                      <v-text-field
                        v-model="formData.address"
                        label="Street Address"
                        prepend-icon="mdi-map-marker"
                        class="mb-3"
                      ></v-text-field>

                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="formData.city"
                            label="City"
                            prepend-icon="mdi-city"
                            class="mb-3"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="formData.zip_code"
                            label="ZIP Code"
                            prepend-icon="mdi-postage-box"
                            class="mb-3"
                          ></v-text-field>
                        </v-col>
                      </v-row>

                      <!-- Sports input -->
                      <v-text-field
                        v-model="formData.sports"
                        label="Sports"
                        prepend-icon="mdi-basketball"
                        class="mb-3"
                      ></v-text-field>
                    </v-form>
                  </v-window-item>

                  <!-- RATINGS TAB -->
                  <v-window-item value="ratings">
                    <div v-if="receivedRatingsLoading" class="text-center py-4">
                      <v-progress-circular indeterminate color="primary"></v-progress-circular>
                      <p class="mt-2 text-caption grey--text">Fetching ratings and comments...</p>
                    </div>

                    <v-list
                      v-else-if="receivedRatings.length"
                      lines="two"
                      density="compact"
                      class="py-0"
                    >
                      <v-list-item
                        v-for="rating in receivedRatings"
                        :key="rating.created_at"
                        class="mb-3 pa-3 rounded-lg list-item-hover d-block"
                        color="primary"
                      >
                        <div class="d-flex justify-space-between align-start">
                          <div class="mb-1">
                            <span class="font-weight-bold text-subtitle-1 mr-1">{{
                              rating.rater_name
                            }}</span>
                            <span class="text-caption text-medium-emphasis"
                              >({{ rating.match_info }})</span
                            >
                          </div>
                        </div>

                        <div class="d-flex align-center mb-1">
                          <v-rating
                            :model-value="rating.rating"
                            size="small"
                            density="compact"
                            readonly
                            color="yellow-darken-2"
                          ></v-rating>
                        </div>

                        <v-list-item-subtitle v-if="rating.comment" class="text-wrap">
                          "{{ rating.comment }}"
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-else class="text-medium-emphasis">
                          (No comment provided)
                        </v-list-item-subtitle>
                        <span class="text-caption text-grey-darken-1 text-right">
                          {{ new Date(rating.created_at).toLocaleDateString() }}
                        </span>
                      </v-list-item>
                    </v-list>

                    <div v-else>
                      <p class="text-medium-emphasis text-center py-8">No ratings received yet.</p>
                    </div>
                  </v-window-item>
                </v-window>
              </v-card-text>

              <v-card-actions class="pt-4 px-4 justify-end" v-if="!isViewingOther">
                <v-btn
                  v-if="isEditing"
                  color="secondary"
                  rounded
                  large
                  @click="toggleEdit"
                  :disabled="saving"
                  class="text-none"
                >
                  <v-icon left>mdi-cancel</v-icon> Cancel
                </v-btn>
                <v-btn
                  v-if="!isEditing"
                  color="primary"
                  rounded
                  large
                  @click="toggleEdit"
                  :disabled="loading"
                  class="text-none"
                >
                  <v-icon left>mdi-pencil-outline</v-icon> Edit Profile
                </v-btn>
                <v-btn
                  v-else
                  color="success"
                  rounded
                  large
                  @click="saveProfile"
                  :loading="saving"
                  :disabled="saving"
                  type="submit"
                  class="text-none"
                >
                  <v-icon left>mdi-content-save-outline</v-icon> Save Changes
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Bottom navigation -->
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
.profile-details-list {
  background-color: transparent !important;
}

.profile-details-list .v-list-item {
  padding: 12px 0;
}

.list-item-hover:hover {
  background-color: rgba(0, 0, 0, 0.03);
  transition: background-color 0.2s;
  border-radius: 8px;
}

.v-bottom-navigation .v-btn{
  /* Make the button shape a circle */
  border-radius: 27% !important;
}
</style>
