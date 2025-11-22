<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabaseClient'

const activeNav = ref('profile')
const router = useRouter()
const route = useRoute() // Import useRoute to access parameters
const profileData = ref(null)
const loading = ref(false)
const error = ref(null)

const isEditing = ref(false)
const formData = ref({}) // Holds data for the edit form
const saving = ref(false)
const currentUserId = ref(null) // Stores the logged-in user's ID

// Get the user ID from the route parameter. If null, it's the self-profile view.
const targetUserId = computed(() => route.params.userId || null)
// Boolean flag to determine if we are viewing someone else's profile
const isViewingOther = computed(
  () => targetUserId.value && targetUserId.value !== currentUserId.value,
)

// Fetches the user's profile data from Supabase.
const fetchProfile = async () => {
  loading.value = true
  error.value = null
  profileData.value = null

  try {
    // 1. Get the current logged-in user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('No user logged in, redirecting to sign-in.')
      router.push({ name: 'signin' })
      return
    }
    currentUserId.value = user.id // Store logged-in user's ID

    // 2. Determine which profile ID to fetch
    const idToFetch = targetUserId.value || user.id

    // 3. Fetch the corresponding profile data
    // For security, we only fetch public details (no need for email for others)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name, phone_number, address, city, zip_code, role')
      .eq('id', idToFetch)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let finalData = {
      id: idToFetch,
      ...data,
    }

    // If viewing self-profile, include the authenticated user's email
    if (!isViewingOther.value) {
      finalData.email = user.email
    } else {
      // For other users, email is generally kept private or not fetched.
      finalData.email = 'Hidden'
    }

    profileData.value = finalData

    // Initialize form data only if it is the self-profile view
    if (!isViewingOther.value) {
      formData.value = { ...finalData }
    }
  } catch (err) {
    console.error('Profile fetch failed:', err.message)
    error.value = 'Failed to load profile. Please try again.'
  } finally {
    loading.value = false
  }
}

// Ensure editing is only possible for the logged-in user's profile
const toggleEdit = () => {
  if (isViewingOther.value || !profileData.value) return
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    formData.value = { ...profileData.value }
  }
}

const saveProfile = async () => {
  // Save is only allowed for the current user
  if (isViewingOther.value) return

  saving.value = true
  error.value = null // Clear any previous errors

  try {
    const updates = {
      id: profileData.value.id,
      full_name: formData.value.full_name,
      phone_number: formData.value.phone_number,
      address: formData.value.address,
      city: formData.value.city,
      zip_code: formData.value.zip_code,
      updated_at: new Date().toISOString(), // Track update time
    }

    // Update the 'profiles' table in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileData.value.id)
      .select()

    if (updateError) {
      throw updateError
    }

    // Successfully updated
    await fetchProfile() // Re-fetch to show latest data
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
            <v-card class="pa-6" elevation="5" rounded="lg">
              <div v-if="loading" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-3 grey--text">Loading user data...</p>
              </div>

              <v-alert v-else-if="error" type="error" dense dismissible class="mb-4">
                Error: {{ error }}
              </v-alert>

              <v-card-text v-else-if="profileData">
                <div class="text-center mb-6">
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

                <v-list dense class="profile-details-list" v-if="!isEditing">
                  <v-list-item class="list-item-hover">
                    <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                      <v-icon color="blue">mdi-email-outline</v-icon> Email Address
                    </p>
                    <v-list-item-content>
                      <v-list-item-subtitle>{{
                        isViewingOther ? 'Contact via chat/request' : profileData.email
                      }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-divider class="mt-3"></v-divider>

                  <v-list-item class="list-item-hover">
                    <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                      <v-icon color="green">mdi-account-details-outline</v-icon> Full Name
                    </p>
                    <v-list-item-content>
                      <v-list-item-subtitle>{{
                        profileData.full_name || 'N/A'
                      }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-divider class="mt-3"></v-divider>

                  <v-list-item class="list-item-hover">
                    <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                      <v-icon color="green">mdi-phone-outline</v-icon> Phone Number
                    </p>
                    <v-list-item-content>
                      <v-list-item-subtitle>{{
                        profileData.phone_number || 'N/A'
                      }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-divider class="mt-3"></v-divider>

                  <v-list-item class="list-item-hover">
                    <p class="text-subtitle-1 grey--text text--darken-1 mb-3">
                      <v-icon color="orange">mdi-map-marker-outline</v-icon> Address
                    </p>
                    <v-list-item-content>
                      <v-list-item-subtitle>
                        {{ profileData.address || 'N/A' }}
                        {{ profileData.city || ''
                        }}{{ profileData.city && profileData.zip_code ? ', ' : ''
                        }}{{ profileData.zip_code || '' }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>

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
                </v-form>
              </v-card-text>

              <v-card-actions class="pt-4 px-4 justify-end" v-if="!isViewingOther">
                <v-btn
                  v-if="isEditing"
                  color="secondary"
                  rounded
                  large
                  @click="toggleEdit"
                  :disabled="saving"
                >
                  <v-icon left>mdi-cancel</v-icon>
                  Cancel
                </v-btn>
                <v-btn
                  v-if="!isEditing"
                  color="primary"
                  rounded
                  large
                  @click="toggleEdit"
                  :disabled="loading"
                >
                  <v-icon left>mdi-pencil-outline</v-icon>
                  Edit Profile
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
                >
                  <v-icon left>mdi-content-save-outline</v-icon>
                  Save Changes
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

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
</style>
