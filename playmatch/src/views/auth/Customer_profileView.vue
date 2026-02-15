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

// --- NEW: PASSWORD CHANGE STATE ---
const showChangePasswordModal = ref(false)
const loadingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
// ---------------------------------

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
      .select('full_name, phone_number, address, city, zip_code, role, sports')
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
      sports: formData.value.sports,
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

// --- NEW FUNCTIONS: PASSWORD CHANGE ---
const openChangePasswordModal = () => {
  showChangePasswordModal.value = true
  // Reset form when opening
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const closeChangePasswordModal = () => {
  showChangePasswordModal.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

const showSuccessMessage = (message) => {
  // You can replace this with your preferred notification method
  alert(message)
}

const showErrorMessage = (message) => {
  // You can replace this with your preferred notification method
  alert(message)
}

const handleChangePassword = async () => {
  // Validate current password is filled
  if (!passwordForm.value.currentPassword) {
    showErrorMessage('Please enter your current password')
    return
  }

  // Validate new passwords match
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showErrorMessage('New passwords do not match')
    return
  }

  // Validate password length
  if (passwordForm.value.newPassword.length < 6) {
    showErrorMessage('Password must be at least 6 characters long')
    return
  }

  // Check if new password is different from current
  if (passwordForm.value.currentPassword === passwordForm.value.newPassword) {
    showErrorMessage('New password must be different from current password')
    return
  }

  loadingPassword.value = true
  try {
    // First, verify the current password by attempting to sign in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      throw new Error('User email not found')
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.value.currentPassword,
    })

    if (signInError) {
      throw new Error('Current password is incorrect')
    }

    // If verification successful, update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.value.newPassword,
    })

    if (updateError) throw updateError

    showSuccessMessage('Password updated successfully!')
    closeChangePasswordModal()
  } catch (error) {
    console.error('Error updating password:', error.message)
    if (error.message === 'Current password is incorrect') {
      showErrorMessage('Current password is incorrect')
    } else {
      showErrorMessage('Failed to update password: ' + error.message)
    }
  } finally {
    loadingPassword.value = false
  }
}
// --- END NEW FUNCTIONS ---

//Logout function
const logout = async () => {
  try {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError

    // Clear local data
    localStorage.clear()
    currentUserId.value = null

    // Redirect to signin
    router.push({ name: 'signin' })
  } catch (err) {
    console.error('Logout failed:', err.message)
    alert('Failed to logout. Please try again.')
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

      <v-btn v-if="!isViewingOther" text @click="logout" class="text-none">
        <v-icon color="red" class="mr-1">mdi-logout</v-icon>
        <span style="color: red">Logout</span>
      </v-btn>
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
                  <v-tab v-if="!isViewingOther" value="security" class="text-none">
                    <v-icon start>mdi-shield-lock-outline</v-icon>
                    Security
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

                  <!-- SECURITY TAB -->
                  <v-window-item value="security" v-if="!isViewingOther">
                    <div class="pa-4">
                      <h3 class="text-h6 font-weight-bold mb-2">Security Settings</h3>
                      <p class="text-body-2 text-medium-emphasis mb-6">
                        Update your account password to keep your profile secure.
                      </p>
                      <v-btn
                        color="primary"
                        variant="elevated"
                        @click="openChangePasswordModal"
                        size="large"
                        height="48"
                        rounded="xl"
                        class="px-8 text-none font-weight-medium"
                      >
                        <v-icon size="20" class="mr-2">mdi-lock-reset</v-icon>
                        Change Password
                      </v-btn>
                    </div>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

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

    <!-- Change Password Modal -->
    <v-dialog v-model="showChangePasswordModal" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="text-h6 font-weight-bold mt-2"> Change Password </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleChangePassword">
            <!-- Current Password Field -->
            <v-text-field
              v-model="passwordForm.currentPassword"
              label="Current Password"
              :type="showCurrentPassword ? 'text' : 'password'"
              variant="outlined"
              density="compact"
              class="mb-3"
              rounded="lg"
              :disabled="loadingPassword"
              :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showCurrentPassword = !showCurrentPassword"
            />

            <v-divider class="my-4"></v-divider>

            <!-- New Password Field -->
            <v-text-field
              v-model="passwordForm.newPassword"
              label="New Password"
              :type="showNewPassword ? 'text' : 'password'"
              variant="outlined"
              density="compact"
              class="mb-3"
              rounded="lg"
              :disabled="loadingPassword"
              :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showNewPassword = !showNewPassword"
            />

            <!-- Confirm New Password Field -->
            <v-text-field
              v-model="passwordForm.confirmPassword"
              label="Confirm New Password"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              density="compact"
              class="mb-3"
              rounded="lg"
              :disabled="loadingPassword"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />

            <!-- Validation Alerts -->
            <v-alert
              v-if="passwordForm.newPassword && passwordForm.newPassword.length < 6"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Password must be at least 6 characters long
            </v-alert>

            <v-alert
              v-if="
                passwordForm.newPassword &&
                passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword
              "
              type="error"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Passwords do not match
            </v-alert>

            <v-alert
              v-if="
                passwordForm.currentPassword &&
                passwordForm.newPassword &&
                passwordForm.currentPassword === passwordForm.newPassword
              "
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              New password must be different from current password
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="closeChangePasswordModal"
            :disabled="loadingPassword"
            class="mb-3 mr-2 text-none"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="handleChangePassword"
            class="mb-3 mr-2 text-none"
            rounded="xl"
            :loading="loadingPassword"
            :disabled="
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword ||
              passwordForm.newPassword.length < 6 ||
              passwordForm.currentPassword === passwordForm.newPassword
            "
          >
            Update Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
</style>
