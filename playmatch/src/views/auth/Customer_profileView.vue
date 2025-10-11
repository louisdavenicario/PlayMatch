<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const router = useRouter()
const profileData = ref(null)
const loading = ref(false)
const error = ref(null)

// Fetches the user's profile data from Supabase.

const fetchProfile = async () => {
  loading.value = true
  error.value = null
  profileData.value = null

  try {
    // Get the current user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('No user logged in, redirecting to sign-in.')
      router.push({ name: 'signin' })
      return
    }

    // Fetch the corresponding profile data using the user's ID
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name, phone_number, address, city, zip_code, role')
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found (profile might be missing)
      throw fetchError
    }

    // Combine the profile data with the user's email from the auth object
    profileData.value = {
      email: user.email,
      ...data,
    }
  } catch (err) {
    console.error('Profile fetch failed:', err.message)
    error.value = 'Failed to load profile. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <v-app>
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
              <div class="d-flex align-center mb-4">
                <v-btn icon @click="router.back()" class="mr-3">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <h1 class="text-h5 font-weight-bold primary--text">My Profile</h1>
              </div>

              <v-divider class="mb-5"></v-divider>

              <div v-if="loading" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-3 grey--text">Loading user data...</p>
              </div>

              <v-alert v-else-if="error" type="error" dense dismissible class="mb-4">
                Error loading profile: {{ error }}
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

                <v-list dense class="profile-details-list">
                  <v-list-item class="list-item-hover">
                    <v-list-item-icon
                      ><v-icon color="blue">mdi-email-outline</v-icon></v-list-item-icon
                    >
                    <v-list-item-content>
                      <v-list-item-title class="font-weight-medium"
                        >Email Address</v-list-item-title
                      >
                      <v-list-item-subtitle>{{ profileData.email }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-divider inset></v-divider>

                  <v-list-item class="list-item-hover">
                    <v-list-item-icon
                      ><v-icon color="green">mdi-phone-outline</v-icon></v-list-item-icon
                    >
                    <v-list-item-content>
                      <v-list-item-title class="font-weight-medium">Phone Number</v-list-item-title>
                      <v-list-item-subtitle>{{ profileData.phone_number }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-divider inset></v-divider>

                  <v-list-item class="list-item-hover">
                    <v-list-item-icon
                      ><v-icon color="orange">mdi-map-marker-outline</v-icon></v-list-item-icon
                    >
                    <v-list-item-content>
                      <v-list-item-title class="font-weight-medium">Address</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ profileData.address }}<br />
                        {{ profileData.city }}, {{ profileData.zip_code }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-card-text>

              <v-card-actions class="pt-4 px-4 justify-end">
                <v-btn color="primary" rounded large>
                  <v-icon left>mdi-pencil-outline</v-icon>
                  Edit Profile
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
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
