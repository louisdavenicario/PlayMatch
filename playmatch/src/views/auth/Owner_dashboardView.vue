<template>
  <v-app
    style="
      background:
        linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6)),
        url('/images/logo.jpg') center/cover no-repeat;
    "
  >
    <div v-if="$vuetify.display.smAndDown">
      <v-app-bar app color="blue-grey-lighten-5">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title class="font-weight-bold">
          {{ facilityDetails?.facility_name }}
        </v-toolbar-title>
      </v-app-bar>
    </div>

    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.smAndDown"
      app
      class="sidebar"
    >
      <v-list-item class="logo-section d-none d-md-block">
        <v-list-item-title class="font-weight-bold">
          {{ facilityDetails?.facility_name }}
        </v-list-item-title>
      </v-list-item>
      <v-divider
        class="d-none d-md-block"
        style="border-color: black; border-width: 2px"
      ></v-divider>

      <v-list dense nav>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'dashboard' }"
          @click="currentPage = 'dashboard'"
          link
        >
          <v-list-item-title>
            <v-icon>mdi-view-dashboard</v-icon>
            Dashboard
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'bookings' }"
          @click="currentPage = 'bookings'"
          link
        >
          <v-list-item-title>
            <v-icon>mdi-book-check</v-icon>
            Bookings
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'availability' }"
          @click="currentPage = 'availability'"
          link
        >
          <v-list-item-title>
            <v-icon>mdi-calendar-check</v-icon>
            Availability Settings</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'settings' }"
          @click="currentPage = 'settings'"
          link
        >
          <v-list-item-title>
            <v-icon>mdi-cog</v-icon>
            Settings</v-list-item-title
          >
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            block
            @click="handleLogout"
            prepend-icon="mdi-logout"
            :loading="loading"
            :disabled="loading"
          >
            <strong>Logout</strong>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    
    <v-main>
      <v-container>
        <v-row class="header-row">
          <v-col>
            <h1 class="text-h4 font-weight-bold text-black">
              {{ currentPage.charAt(0).toUpperCase() + currentPage.slice(1) }}
            </h1>
          </v-col>
          <v-col class="text-right d-none d-sm-block">
            <span class="text-subtitle-1 text-black">User ID: {{ userId }}</span>
          </v-col>
        </v-row>

        <div v-if="currentPage === 'dashboard'">
          <v-row align="stretch"> 
            <v-col cols="12" sm="6" lg="3">
                <v-card class="pa-4 dashboard-card fill-height" rounded="lg"> <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-1 font-weight-medium">Today's Bookings</div>
                        <v-icon size="30" color="primary">mdi-calendar-today</v-icon>
                    </div>
                    <v-card-text class="pa-0 text-h4 font-weight-bold">
                        {{ dashboardData.todayBookings }}
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
                <v-card class="pa-4 dashboard-card fill-height" rounded="lg"> <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-1 font-weight-medium">Monthly Revenue</div>
                        <v-icon size="30" color="green-darken-2">mdi-currency-php</v-icon>
                    </div>
                    <v-card-text class="pa-0 text-h4 font-weight-bold">
                        ₱{{ dashboardData.monthlyRevenue.toFixed(2) }}
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
                <v-card class="pa-4 dashboard-card fill-height" rounded="lg"> <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-1 font-weight-medium">Pending Requests</div>
                        <v-icon size="30" color="orange-darken-2">mdi-alert-circle-outline</v-icon>
                    </div>
                    <v-card-text class="pa-0 text-h4 font-weight-bold">
                        {{ dashboardData.pendingRequests }}
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
                <v-card class="pa-4 dashboard-card fill-height" rounded="lg"> <div class="d-flex justify-space-between align-center mb-2">
                        <div class="text-subtitle-1 font-weight-medium">Facility Rating</div>
                        <v-icon size="30" color="amber-darken-2">mdi-star</v-icon>
                    </div>
                    
                    <v-card-text class="pa-0 text-h4 font-weight-bold"> 
                        <template v-if="facilityRating.average > 0">
                            <div class="d-flex align-center">
                                <v-icon size="24" color="amber-darken-2" class="mr-2">mdi-star</v-icon>
                                <span class="mr-2"> {{ facilityRating.average.toFixed(1) }}
                                </span>
                                <span class="ml-2 text-caption text-medium-emphasis">
                                    ({{ facilityRating.totalReviews }} reviews)
                                </span>
                            </div>
                        </template>
                        <template v-else> No ratings yet </template>
                    </v-card-text>
                </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-card class="pa-4" rounded="lg">
                <v-card-title class="font-weight-bold d-flex justify-space-between align-center">
                  <span>My Facility</span>
                  <v-btn icon size="small" @click="openEditModal" color="primary">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </v-card-title>

                <v-card-text>
                  <v-row>
                    <!-- LEFT SIDE: Facility Information -->
                    <v-col cols="12" md="8">
                      <p class="mt-5">
                        <strong>Facility Name:</strong> {{ facilityDetails?.facility_name }}
                      </p>
                      <p class="mt-5">
                        <strong>Price per hour:</strong> ₱{{ facilityDetails?.price_per_hour }}
                      </p>
                      <p class="mt-5">
                        <strong>Amenities:</strong> {{ facilityDetails?.amenities }}
                      </p>
                      <p class="mt-5"><strong>Address:</strong> {{ facilityDetails?.address }}</p>
                      <p class="mt-5">
                        <strong>Contact Number:</strong> {{ facilityDetails?.phone_number }}
                      </p>
                      <p class="mt-5">
                        <strong>Description:</strong> {{ facilityDetails?.briefdescription }}
                      </p>

                      <!-- Regular Operating Hours -->
                      <p class="mt-5 mb-2"><strong>Regular Operating Hours:</strong></p>
                      <v-table density="compact" class="elevation-1 rounded-lg">
                        <thead>
                          <tr>
                            <th class="text-left text-body-2 font-weight-bold">Day</th>
                            <th class="text-left text-body-2 font-weight-bold">Open</th>
                            <th class="text-left text-body-2 font-weight-bold">Close</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="hour in displayRegularHours" :key="hour.day">
                            <td>{{ hour.day }}</td>
                            <td :class="{ 'text-error': hour.openTime === '--' }">
                              {{ hour.openTime }}
                            </td>
                            <td :class="{ 'text-error': hour.closeTime === '--' }">
                              {{ hour.closeTime }}
                            </td>
                          </tr>
                        </tbody>
                      </v-table>

                      <!-- Custom Schedules -->
                      <p class="mt-5 mb-2"><strong>Custom Schedule(s):</strong></p>
                      <v-table density="compact" class="elevation-1 rounded-lg" style="width: 100%">
                        <thead>
                          <tr>
                            <th class="text-left text-body-2 font-weight-bold">Date</th>
                            <th class="text-left text-body-2 font-weight-bold">Start Time</th>
                            <th class="text-left text-body-2 font-weight-bold">End Time</th>
                            <th class="text-left text-body-2 font-weight-bold">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(schedule, index) in upcomingCustomSchedules" :key="index">
                            <td
                              :colspan="schedule.isPlaceholder ? 4 : 1"
                              :class="{ 'text-center font-italic': schedule.isPlaceholder }"
                            >
                              <template v-if="schedule.isPlaceholder">
                                {{ schedule.reason }}
                              </template>
                              <template v-else>
                                {{ schedule.date }}
                              </template>
                            </td>

                            <template v-if="!schedule.isPlaceholder">
                              <td>{{ schedule.startTime }}</td>
                              <td>{{ schedule.endTime }}</td>
                              <td style="white-space: normal">{{ schedule.reason }}</td>
                            </template>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-col>

                    <!-- RIGHT SIDE: All Photos (Primary + Gallery) -->
                    <v-col cols="12" md="4">
                      <!-- Primary Photo -->
                      <p class="mt-5"><strong>Primary Photo:</strong></p>
                      <v-img
                        v-if="facilityDetails?.image_url"
                        :src="facilityDetails.image_url"
                        class="rounded-lg mb-4"
                        height="250px"
                        cover
                      ></v-img>
                      <div
                        v-else
                        class="d-flex align-center justify-center grey-background rounded-lg mb-4"
                        style="height: 250px"
                      >
                        <v-icon size="50">mdi-image-off</v-icon>
                        <p class="ml-2">No Image Available</p>
                      </div>

                      <!-- Gallery Photos -->
                      <template v-if="facilityDetails?.additional_photos?.length">
                        <p class="mt-5 mb-3">
                          <strong
                            >Gallery Photos ({{
                              facilityDetails.additional_photos.length
                            }}):</strong
                          >
                        </p>
                        <div
                          class="d-flex flex-column"
                          style="gap: 12px; max-height: 800px; overflow-y: auto"
                        >
                          <v-img
                            v-for="(url, index) in facilityDetails.additional_photos"
                            :key="index"
                            :src="url"
                            class="rounded-lg border"
                            style="width: 100%; height: 200px"
                            cover
                          ></v-img>
                        </div>
                      </template>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-card class="pa-4" rounded="lg">
                <v-card-title class="font-weight-bold">Recent Bookings</v-card-title>
                <v-card-subtitle>
                  Latest 5 accepted bookings for your facility
                </v-card-subtitle>
                <v-card-text>
                  <v-list v-if="recentBookings.length">
                    <v-list-item v-for="booking in recentBookings" :key="booking.id">
                      <v-list-item-title>
                        {{ new Date(booking.start_time).toLocaleDateString() }}
                      </v-list-item-title>
                      <v-list-item-title>{{ booking.time_range }}</v-list-item-title>
                      <v-list-item-subtitle>
                        Booked for {{ booking.hours }} hours - Price: ₱{{
                          booking.price.toFixed(2)
                        }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" class="mt-4">No recent bookings.</v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div v-if="currentPage === 'bookings'">
          <v-row>
            <v-col cols="12">
                <v-card class="pa-4" rounded="lg">
                    <v-card-title class="font-weight-bold text-left">Accepted Bookings Calendar</v-card-title>
                    <v-card-text>
                        <v-row> 
                            <v-col cols="12" sm="10" md="8" lg="6"> 
                              <v-date-picker
                                    v-model="calendarDate"
                                    color="primary"
                                    @update:model-value="selectDay"
                                    view-mode="calendar"
                                    :day-class="getDayClass"
                              />
                            </v-col>
                        </v-row>
                        
                        <v-btn
                            v-if="selectedDay"
                            @click="selectedDay = null"
                            color="secondary"
                            variant="text"
                            class="mt-3"
                        >
                            Clear Selected Day
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
          </v-row>

          <v-row v-if="selectedDay">
            <v-col cols="12">
              <v-card class="pa-4 mt-4" rounded="lg" color="blue-grey-lighten-5">
                <v-card-title class="font-weight-bold">
                  Customers Booked for: {{ selectedDay }}
                </v-card-title>
                <v-card-text>
                  <v-list v-if="selectedDateBookings.length" density="compact">
                    <v-list-item v-for="booking in selectedDateBookings" :key="booking.id">
                      <v-list-item-title>
                        Date: {{ new Date(booking.start_time).toLocaleDateString() }}
                      </v-list-item-title>
                      <v-list-item-title>
                        Facility: {{ booking.facilities.facility_name }}
                      </v-list-item-title>
                      <v-list-item-title class="font-weight-medium">
                        {{ new Date(booking.start_time).toLocaleTimeString() }} -
                        {{ new Date(booking.end_time).toLocaleTimeString() }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        User ID: {{ booking.user_id }} | Price: ₱{{ booking.price.toFixed(2) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" class="mt-4">
                    No accepted bookings for {{ selectedDay }}.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-card class="pa-4 mt-4" rounded="lg">
                <v-card-title class="font-weight-bold">Pending Booking Requests</v-card-title>
                <v-card-text>
                  <v-list v-if="pendingBookings.length">
                    <v-list-item v-for="booking in pendingBookings" :key="booking.id">
                      <v-list-item-content>
                        <v-list-item-title>
                          Date: {{ new Date(booking.start_time).toLocaleDateString() }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          Time: {{ new Date(booking.start_time).toLocaleTimeString() }} -
                          {{ new Date(booking.end_time).toLocaleTimeString() }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                          From User: {{ booking.profiles.full_name}}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                          Duration: {{ booking.duration_hours }}
                        </v-list-item-subtitle>
                      </v-list-item-content>
                      <v-list-item-action>
                        <v-btn
                          color="success"
                          class="mr-2"
                          @click="handleBookingStatus(booking.id, 'accepted')"
                          >Accept</v-btn
                        >
                        <v-btn color="error" @click="handleBookingStatus(booking.id, 'rejected')"
                          >Reject</v-btn
                        >
                      </v-list-item-action>
                    </v-list-item>
                  </v-list>
                  <v-alert v-else type="info" class="mt-4">No pending requests.</v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div v-if="currentPage === 'availability'">
          <v-row>
            <v-col cols="12">
              <v-card class="pa-4" rounded="lg">
                <v-card-title class="font-weight-bold">Regular Operating Hours</v-card-title>
                <v-card-text>
                  <v-row v-for="day in daysOfWeek" :key="day">
                    <v-col cols="12" sm="4" class="d-flex align-center">
                      <v-checkbox
                        v-model="regularHours[day].isOpen"
                        :label="day.charAt(0).toUpperCase() + day.slice(1)"
                      ></v-checkbox>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="regularHours[day].openTime"
                        label="Open Time"
                        type="time"
                        :disabled="!regularHours[day].isOpen"
                        variant="outlined"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="regularHours[day].closeTime"
                        label="Close Time"
                        type="time"
                        :disabled="!regularHours[day].isOpen"
                        variant="outlined"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-btn color="primary" @click="saveRegularHours">Save Regular Hours</v-btn>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-card class="pa-4 mt-4" rounded="lg">
                <v-card-title class="font-weight-bold"
                  >Custom Schedules (Closures, Special Hours)</v-card-title
                >
                <v-card-text>
                  <v-form @submit.prevent="addCustomSchedule">
                    <v-row>
                      <v-col cols="12" sm="4">
                        <v-text-field
                          v-model="newCustomSchedule.date"
                          label="Date"
                          type="date"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <v-text-field
                          v-model="newCustomSchedule.startTime"
                          label="Start Time"
                          type="time"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="4">
                        <v-text-field
                          v-model="newCustomSchedule.endTime"
                          label="End Time"
                          type="time"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field
                          v-model="newCustomSchedule.reason"
                          label="Reason"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    <v-btn color="secondary" type="submit">Add Custom Schedule</v-btn>
                  </v-form>
                  <v-divider class="my-4"></v-divider>
                  <v-list>
                    <v-list-item v-for="schedule in customSchedules" :key="schedule.id">
                      <v-list-item-title>{{ schedule.date }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ schedule.startTime }} - {{ schedule.endTime }} ({{ schedule.reason }})
                      </v-list-item-subtitle>
                      <v-list-item-action>
                        <v-btn
                          icon
                          size="small"
                          variant="text"
                          color="red"
                          @click="openDeleteModal(schedule)"
                        >
                          <v-icon>mdi-close-circle-outline</v-icon>
                        </v-btn>
                      </v-list-item-action>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div v-if="currentPage === 'settings'">
          <v-card class="pa-4" rounded="lg">
            <v-card-title class="font-weight-bold">Account Settings</v-card-title>
            <v-card-text>
              <p>User ID: {{ userId }}</p>
              <p>You can manage your account and profile settings here.</p>
            </v-card-text>
          </v-card>
        </div>
      </v-container>
    </v-main>

    <v-dialog v-model="showEditModal" persistent max-width="600px">
      <v-card
        style="
          background-color: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(4px);
          border: 2px solid #2196f3;
          border-radius: 20px;
        "
      >
        <v-card-title class="text-h5">Edit Facility Details</v-card-title>
        <v-card-text>
          <v-container>
            <v-text-field
              v-model="editedFacility.facility_name"
              label="Facility Name"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="editedFacility.price_per_hour"
              label="Price per hour"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="editedFacility.amenities"
              label="Amenities"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="editedFacility.address"
              label="Address"
              variant="outlined"
            ></v-text-field>

            <v-text-field
              v-model="editedFacility.phone_number"
              label="Contact Number"
              variant="outlined"
            ></v-text-field>

            <v-textarea
              v-model="editedFacility.briefdescription"
              label="Brief Description"
              variant="outlined"
            ></v-textarea>

            <h3 class="mt-4 mb-2">Primary Facility Photo</h3>
            <v-divider class="mb-4"></v-divider>

            <v-img
              v-if="editedFacility.image_url"
              :src="editedFacility.image_url"
              aspect-ratio="1.7778"
              cover
              class="rounded-lg mb-4 elevation-2"
              max-height="250"
            />

            <v-file-input
              v-model="primaryPhotoFile"
              accept="image/*"
              label="Select or replace primary photo"
              prepend-icon="mdi-camera"
              variant="outlined"
              density="compact"
              :clearable="true"
              hint="Select a new image. It will be uploaded when you click 'Save Facility Details'."
              persistent-hint
              class="mb-2"
            ></v-file-input>

            <v-btn
              v-if="editedFacility.image_url"
              color="error"
              variant="text"
              prepend-icon="mdi-delete"
              @click="removePrimaryPhoto"
            >
              Remove Current Photo
            </v-btn>

            <v-divider class="my-4"></v-divider>

            <h3 class="mt-4 mb-2">Additional Facility Photos (Gallery)</h3>

            <v-divider class="mb-4"></v-divider>

            <v-row v-if="existingPhotoUrls.length">
              <v-col cols="12">
                <p class="text-subtitle-1">Current Gallery Photos:</p>
                <div class="d-flex flex-wrap gap-2">
                  <div v-for="(url, index) in existingPhotoUrls" :key="url" class="ma-2">
                    <v-card class="pa-2" outlined>
                      <v-img :src="url" height="100px" width="100px" cover></v-img>
                      <v-btn
                        color="red"
                        size="x-small"
                        block
                        @click="removeExistingPhoto(index)"
                        class="mt-1"
                      >
                        Remove
                      </v-btn>
                    </v-card>
                  </div>
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-file-input
                  label="Select New Gallery Photos"
                  multiple
                  accept="image/*"
                  @change="handleGalleryFileChange"
                  variant="outlined"
                  prepend-icon="mdi-camera-plus"
                  clearable
                ></v-file-input>
              </v-col>
            </v-row>

            <v-row v-if="newGalleryFiles.length">
              <v-col cols="12">
                <p class="text-subtitle-1">New Photos Queued for Upload:</p>
                <v-list density="compact">
                  <v-list-item v-for="(file, index) in newGalleryFiles" :key="index">
                    <v-list-item-title>{{ file.name }}</v-list-item-title>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-close"
                        color="error"
                        size="x-small"
                        variant="text"
                        @click="removeNewGalleryFile(index)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="showEditModal = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveFacilityDetails">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteConfirmModal" max-width="450">
      <v-card>
        <v-card-title class="text-h5 bg-red-darken-1 text-white">
          <v-icon start icon="mdi-alert-circle-outline"></v-icon>
          Confirm Deletion
        </v-card-title>

        <v-card-text class="pt-4 text-body-1">
          Are you sure you want to permanently remove the custom schedule for
          <span class="font-weight-bold text-red-darken-1">{{ scheduleToDeleteDate }}</span
          >? This action cannot be undone.
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="flat" @click="showDeleteConfirmModal = false">
            Cancel
          </v-btn>
          <v-btn
            color="red-darken-1"
            variant="flat"
            @click="removeCustomSchedule"
            :loading="loadingState"
          >
            <v-icon start>mdi-delete</v-icon>
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert
      v-if="alertMessageText"
      :type="alertColor"
      class="mb-4"
      style="position: fixed; top: 20px; right: 20px; z-index: 1000"
    >
      {{ alertMessageText }}
    </v-alert>
  </v-app>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { supabase } from '@/supabaseClient'
import { useRouter } from 'vue-router'

const loading = ref(false)
const customSchedules = ref([])
// 🌟 MODAL STATE VARIABLES - KEPT
const showDeleteConfirmModal = ref(false)
const scheduleToDeleteId = ref(null)
const scheduleToDeleteDate = ref('')
// NOTE: This now holds the full list of accepted bookings from the database on fetch.
const acceptedBookings = ref([])
const selectedDateBookings = ref([]) // List of accepted customers for the selected date
const calendarDate = ref(new Date().toISOString().substring(0, 10)) // The date currently shown by the calendar
const selectedDay = ref(null) // The specific date the user clicks for the customer list

// Utility to check which dates have accepted bookings for the calendar indicator
const bookingDates = computed(() => {
  // Return an array of date strings ('YYYY-MM-DD') that have accepted bookings
  return acceptedBookings.value.map((b) => b.booking_date)
})
const primaryPhotoFile = ref(null) // Holds the single file selected for the primary photo
const drawer = ref(true) // Start as open on desktop, but collapsible on mobile
const newGalleryFiles = ref([]) // Holds new files selected in the modal
const existingPhotoUrls = ref([]) // Holds URLs fetched from `additional_photos`
const router = useRouter()
const userId = ref(null)
const currentPage = ref('dashboard')
const showEditModal = ref(false)

// 💥 UPDATED DASHBOARD DATA (from your new script)
const dashboardData = reactive({
  todayBookings: 0,
  monthlyRevenue: 0,
  pendingRequests: 0,
})

const facilityDetails = ref(null)

// 💥 NEW/REPLACED: Facility Rating data structure
const facilityRating = reactive({
  average: 0,
  totalReviews: 0,
})

const editedFacility = reactive({
  id: null,
  facility_name: '',
  facility_type: '', // Included for save/edit
  amenities: '',
  price_per_hour: 0,
  open_time: '', // Included for save/edit
  closing_time: '', // Included for save/edit
  address: '',
  phone_number: '',
  briefdescription: '',
  image_url: '',
})
const recentBookings = ref([])
const pendingBookings = ref([])
const regularHours = ref({
  monday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  tuesday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  wednesday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  thursday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  friday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  saturday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
  sunday: { isOpen: false, openTime: '08:00', closeTime: '17:00' },
})
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const newCustomSchedule = reactive({
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  reason: '',
})
const alertMessageText = ref(null)
const alertColor = ref(null)
const loadingState = ref(false) // 🌟 Added loading state for the modal button

// --- RATING LOGIC START ---

// 💥 NEW: Fetch ratings for this owner’s facility
const fetchRatings = async () => {
  if (!facilityDetails.value || !facilityDetails.value.id) return

  try {
    // Assuming a 'ratings' table with a 'facility_id' and 'rating_value' column
    const { data, error } = await supabase
      .from('ratings')
      .select('rating_value')
      .eq('facility_id', facilityDetails.value.id)

    if (error) throw error

    if (data && data.length > 0) {
      const total = data.reduce((sum, r) => sum + (r.rating_value || 0), 0)
      // Use the average value directly for v-rating
      facilityRating.average = total / data.length
      // Use toFixed(1) only when displaying, keep float for v-model
      facilityRating.totalReviews = data.length
    } else {
      facilityRating.average = 0
      facilityRating.totalReviews = 0
    }
  } catch (error) {
    console.error('Error fetching ratings:', error.message)
  }
}

// 💥 NEW: Utility to get the owner's facility details once
const getOwnerFacility = async () => {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user || !user.user) return null

    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('owner_id', user.user.id)
      .single()

    if (error) throw error
    facilityDetails.value = data
  } catch (error) {
    console.error('Error fetching facility:', error.message)
  }
}

// --- RATING LOGIC END ---

const openDeleteModal = (schedule) => {
  scheduleToDeleteId.value = schedule.id
  if (schedule.date) {
    scheduleToDeleteDate.value = new Date(schedule.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } else {
    scheduleToDeleteDate.value = 'this custom schedule'
  }
  showDeleteConfirmModal.value = true
}

const removeCustomSchedule = async () => {
  if (!scheduleToDeleteId.value) return

  loadingState.value = true

  try {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleToDeleteId.value)

    if (error) throw error

    alertMessage('Custom schedule removed.', 'success')
    fetchAllOwnerData()
  } catch (error) {
    console.error('Error removing custom schedule: ', error.message)
    alertMessage('Failed to remove custom schedule.', 'error')
  } finally {
    loadingState.value = false
    showDeleteConfirmModal.value = false
    scheduleToDeleteId.value = null
    scheduleToDeleteDate.value = ''
  }
}

const openRegularHours = computed(() => {
  return Object.entries(regularHours.value)
    .filter(([, data]) => data.isOpen)
    .map(([day, data]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      openTime: data.openTime,
      closeTime: data.closeTime,
    }))
})

const displayRegularHours = computed(() => {
  return daysOfWeek.map((dayKey) => {
    const data = regularHours.value[dayKey]
    const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)

    return {
      day: dayName,
      openTime: data.isOpen ? data.openTime : '--',
      closeTime: data.isOpen ? data.closeTime : '--',
    }
  })
})

const upcomingCustomSchedules = computed(() => {
  if (!customSchedules.value || customSchedules.value.length === 0) {
    return [
      {
        date: '--',
        startTime: '--',
        endTime: '--',
        reason: 'No Custom Schedules Set',
        isPlaceholder: true,
      },
    ]
  }

  const today = new Date().toISOString().substring(0, 10)

  const upcoming = customSchedules.value
    .filter((s) => s.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  if (upcoming.length === 0) {
    return [
      {
        date: '--',
        startTime: '--',
        endTime: '--',
        reason: 'All custom schedules have passed.',
        isPlaceholder: true,
      },
    ]
  }

  return upcoming.map((schedule) => {
    const formattedDate = new Date(schedule.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    return {
      date: formattedDate,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      reason: schedule.reason || 'Special Hours',
      isPlaceholder: false,
    }
  })
})

const fetchAllOwnerData = async () => {
  // 1. Fetch Facility Details first
  await getOwnerFacility()
  await new Promise(resolve => setTimeout(resolve, 500))

  if (!facilityDetails.value) {
    // If no facility, reset rating and exit
    facilityRating.average = 0
    facilityRating.totalReviews = 0
    return
  }

  try {
    // The rest of the logic remains largely the same, but simplified for clarity
    const facilityId = facilityDetails.value.id

    // Fetch hours, bookings, etc.
    // ... (Your original fetch logic for schedules, bookings, etc. goes here)
    // NOTE: I'm skipping the full schedule/booking fetch for brevity in this response,
    // but the final included code snippet has it all.

    // START: Logic for fetching regular hours
    let { data: hoursData, error: hoursError } = await supabase
      .from('schedules')
      .select('day_of_week, start_time, end_time')
      .eq('facility_id', facilityId)
      .eq('type', 'regular')

    if (hoursError) {
      console.error('Error fetching regular hours:', hoursError.message)
    }

    const newRegularHours = { ...regularHours.value }

    if (hoursData && hoursData.length > 0) {
      hoursData.forEach((item) => {
        const day = item.day_of_week
        if (newRegularHours[day]) {
          const isOpen = !!item.start_time
          newRegularHours[day] = {
            isOpen: isOpen,
            openTime: item.start_time || '08:00',
            closeTime: item.end_time || '17:00',
          }
        }
      })
    } else {
      daysOfWeek.forEach((day) => {
        newRegularHours[day] = { isOpen: false, openTime: '08:00', closeTime: '17:00' }
      })
    }

    regularHours.value = newRegularHours
    // END: Logic for handling fetched regular hours

    let { data: customData, error: customError } = await supabase
      .from('schedules')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('type', 'custom')
    if (customError) console.error('Error fetching custom schedules:', customError.message)
    if (customData) customSchedules.value = customData

    // Fetch Bookings (Requires facilityDetails.value.id)
    let { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, profiles(full_name), facilities(facility_name)')
      .eq('facility_id', facilityId)
    if (bookingsError) throw bookingsError

    const allBookings = (bookingsData || []).map(b => {
      const startTime = new Date(b.start_time);
      const bookingDate = startTime.getFullYear() + '-' +
        String(startTime.getMonth() + 1).padStart(2, '0') + '-' +
        String(startTime.getDate()).padStart(2, '0');

      return {
        ...b,
        duration_hours: (new Date(b.end_time) - new Date(b.start_time)) / 3600000,
        booking_date: bookingDate, // 🌟 NEW FIELD for easier date filtering
      }
    })

    pendingBookings.value = allBookings.filter((b) => b.status === 'pending')
    acceptedBookings.value = allBookings.filter((b) => b.status === 'accepted')
    dashboardData.pendingRequests = pendingBookings.value.length

    // This block is crucial for ensuring the calendar list updates if a day is selected
    if (selectedDay.value) {
      selectDay(selectedDay.value);
    }
        // 🌟 END FIX 🌟
    // 2. Fetch facility ratings
    await fetchRatings()

    // 3. Update dashboard metrics based on acceptedBookings (as you did originally)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDay = new Date(today)
    nextDay.setDate(today.getDate() + 1)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    const todayAccepted = acceptedBookings.value.filter(
      (b) => new Date(b.start_time) >= today && new Date(b.start_time) < nextDay,
    )
    dashboardData.todayBookings = todayAccepted.length

    let monthlyRevenueCalc = 0
    acceptedBookings.value.forEach((booking) => {
      const bookingDate = new Date(booking.start_time)
      if (bookingDate >= currentMonthStart && bookingDate < nextMonthStart) {
        const durationHours = (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000
        monthlyRevenueCalc +=
          durationHours * (facilityDetails.value ? facilityDetails.value.price_per_hour : 0)
      }
    })
    dashboardData.monthlyRevenue = monthlyRevenueCalc

    const sortedBookings = acceptedBookings.value
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5)
    recentBookings.value = sortedBookings.map((booking) => {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      const hours = (end - start) / 3600000
      return {
        ...booking,
        time_range: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        hours: hours,
        user_name: booking.profiles.full_name,
        price: hours * (facilityDetails.value ? facilityDetails.value.price_per_hour : 0),
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message)
  }
}

const handleBookingStatus = async (bookingId, status) => {
  try {
    // Update booking status in the database
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()

    if (error) {
      console.error('Error updating booking status:', error.message)
      alertMessage('Failed to update booking status.', 'error')
      return
    }

    // ✅ If status is ACCEPTED
    if (status === 'accepted') {
      const updatedBooking = data[0]
      pendingBookings.value = pendingBookings.value.filter(b => b.id !== bookingId)
      acceptedBookings.value.push(updatedBooking)
      alertMessage('Booking accepted successfully!', 'success')
    }

    // ❌ If status is REJECTED
    else if (status === 'rejected') {
      // Find and remove from pending
      const rejected = pendingBookings.value.find(b => b.id === bookingId)
      pendingBookings.value = pendingBookings.value.filter(b => b.id !== bookingId)

      // Optional: Also remove from accepted list just in case
      acceptedBookings.value = acceptedBookings.value.filter(b => b.id !== bookingId)

      // 🧹 Delete or archive the booking to free up that time slot
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (deleteError) {
        console.error('Error deleting rejected booking:', deleteError.message)
        alertMessage('Failed to remove rejected booking from availability.', 'error')
      } else {
        alertMessage('Booking rejected and time slot released!', 'success')
      }

      // Update dashboard count
      dashboardData.pendingRequests = pendingBookings.value.length

      // Refresh owner dashboard data
      await fetchAllOwnerData()
      window.location.reload()

      if (facilityDetails.value && selectedDay.value && typeof fetchAvailableSlots === 'function') {
        await fetchAvailableSlots(facilityDetails.value.id, selectedDay.value)
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err.message)
    alertMessage('An unexpected error occurred while updating booking.', 'error')
  }
}


// 🌟 FIX 1: Helper function to accurately extract YYYY-MM-DD from a UTC timestamp
const getUTCDateString = (d) => {
    const year = d.getUTCFullYear()
    // getUTCMonth() is 0-indexed (Jan=0), so we add 1
    const month = String(d.getUTCMonth() + 1).padStart(2, '0') 
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}


// Replace your current `selectDay` function with this:
const selectDay = (dateString) => {
  selectedDay.value = dateString

  // Normalize both the calendar date and the booking date to YYYY-MM-DD
  const normalizeDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  selectedDateBookings.value = acceptedBookings.value.filter((booking) => {
    const normalizedBookingDate = normalizeDate(booking.start_time)
    const normalizedSelectedDate = normalizeDate(dateString)
    return normalizedBookingDate === normalizedSelectedDate
  })
}


const saveRegularHours = async () => {
  if (!facilityDetails.value || !facilityDetails.value.id) {
    alertMessage('Failed to save regular hours: Facility data is not yet loaded.', 'error')
    return
  }

  try {
    const facilityId = facilityDetails.value.id
    const promises = []

    for (const day of daysOfWeek) {
      const data = regularHours.value[day]

      if (data.isOpen) {
        const scheduleData = {
          facility_id: facilityId,
          type: 'regular',
          day_of_week: day,
          start_time: data.openTime,
          end_time: data.closeTime,
        }
        promises.push(
          supabase.from('schedules').upsert(scheduleData, {
            onConflict: 'facility_id, type, day_of_week',
          }),
        )
      } else {
        promises.push(
          supabase
            .from('schedules')
            .delete()
            .eq('facility_id', facilityId)
            .eq('type', 'regular')
            .eq('day_of_week', day),
        )
      }
    }

    const results = await Promise.all(promises)

    const hasError = results.some((result) => result.error)
    if (hasError) {
      results.forEach((result) => {
        if (result.error) console.error('Error during hours save/delete:', result.error.message)
      })
      throw new Error('One or more database operations failed during hours save.')
    }

    alertMessage('Regular hours saved successfully! Closed days were removed.', 'success')
    fetchAllOwnerData()
  } catch (error) {
    console.error('Error saving regular hours: ', error.message)
    alertMessage('Failed to save regular hours.', 'error')
  }
}

const addCustomSchedule = async () => {
  if (!newCustomSchedule.date || !newCustomSchedule.startTime || !newCustomSchedule.endTime) {
    alertMessage('Please fill all date and time fields.', 'error')
    return
  }

  if (!facilityDetails.value || !facilityDetails.value.id) {
    alertMessage('Failed to add custom schedule: Facility data is not yet loaded.', 'error')
    return
  }

  try {
    const { error } = await supabase.from('schedules').insert({
      facility_id: facilityDetails.value.id,
      date: newCustomSchedule.date,
      start_time: newCustomSchedule.startTime,
      end_time: newCustomSchedule.endTime,
      reason: newCustomSchedule.reason,
      type: 'custom',
    })
    if (error) throw error

    alertMessage('Custom schedule added successfully!', 'success')
    Object.assign(newCustomSchedule, {
      date: '',
      startTime: '08:00',
      endTime: '17:00',
      reason: '',
    })
    fetchAllOwnerData()
  } catch (error) {
    console.error('Error adding custom schedule: ', error.message)
    alertMessage(
      'Failed to add custom schedule. (Check if schedule already exists for this date).',
      'error',
    )
  }
}

const handleGalleryFileChange = (event) => {
  newGalleryFiles.value.push(...Array.from(event.target.files))
  event.target.value = null
}

const removeNewGalleryFile = (index) => {
  newGalleryFiles.value.splice(index, 1)
}

const removePrimaryPhoto = () => {
  editedFacility.image_url = null
  primaryPhotoFile.value = null
  alertMessage('Primary photo cleared. Click Save to confirm removal.', 'info')
}

const removeExistingPhoto = (index) => {
  existingPhotoUrls.value.splice(index, 1)
}

const saveFacilityDetails = async () => {
  try {
    let finalImageUrl = editedFacility.image_url
    let galleryUrlsToSave = [...existingPhotoUrls.value]

    if (primaryPhotoFile.value) {
      const file = primaryPhotoFile.value[0] || primaryPhotoFile.value
      const filePath = `${userId.value}/primary/${Date.now()}_${file.name}`

      const { error: storageError } = await supabase.storage
        .from('facility-photos')
        .upload(filePath, file, { upsert: true })

      if (storageError) {
        console.error(`Primary photo upload failed:`, storageError.message)
        alertMessage(`Failed to upload primary photo: ${storageError.message}`, 'error')
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('facility-photos')
        .getPublicUrl(filePath)

      if (publicUrlData.publicUrl) {
        finalImageUrl = publicUrlData.publicUrl
      }
    }

    if (newGalleryFiles.value.length > 0) {
      const newUrls = []
      for (const file of newGalleryFiles.value) {
        const filePath = `${userId.value}/gallery/${Date.now()}_${file.name}`

        const { error: storageError } = await supabase.storage
          .from('facility-photos')
          .upload(filePath, file, { upsert: true })

        if (storageError) {
          console.error(`Gallery upload failed for ${file.name}:`, storageError.message)
          alertMessage(`Failed to upload ${file.name}. Continuing with others.`, 'warning')
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('facility-photos')
          .getPublicUrl(filePath)

        if (publicUrlData.publicUrl) {
          newUrls.push(publicUrlData.publicUrl)
        }
      }
      galleryUrlsToSave.push(...newUrls)
    }

    const { error: updateError } = await supabase.from('facilities').upsert(
      {
        id: editedFacility.id,
        owner_id: userId.value,
        facility_name: editedFacility.facility_name,
        facility_type: editedFacility.facility_type,
        amenities: editedFacility.amenities,
        price_per_hour: editedFacility.price_per_hour,
        open_time: editedFacility.open_time,
        closing_time: editedFacility.closing_time,
        address: editedFacility.address,
        phone_number: editedFacility.phone_number,
        briefdescription: editedFacility.briefdescription,
        image_url: finalImageUrl,
        additional_photos: galleryUrlsToSave,
      },
      { onConflict: 'id' },
    )

    if (updateError) throw updateError

    alertMessage('Facility updated successfully!', 'success')
    showEditModal.value = false
    await fetchAllOwnerData()
    newGalleryFiles.value = []
  } catch (error) {
    console.error('Error updating facility:', error.message)
    alertMessage('Failed to update facility.', 'error')
  }
}

const alertMessage = (message, color) => {
  alertMessageText.value = message
  alertColor.value = color
  setTimeout(() => {
    alertMessageText.value = null
    alertColor.value = null
  }, 5000)
}

const handleLogout = async () => {
  loading.value = true
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push({ name: 'signin' })
  } catch (error) {
    console.error('Error logging out:', error.message)
    alertMessage('Failed to log out.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      userId.value = session.user.id
      await fetchAllOwnerData()
    } else {
      router.push({ name: 'signin' })
    }
  } catch (error) {
    console.error('Session fetch failed:', error.message)
  }
})

const openEditModal = () => {
  if (!facilityDetails.value) {
    alertMessage('Cannot edit facility: Facility data not loaded.', 'error')
    return
  }

  Object.assign(editedFacility, {
    id: facilityDetails.value.id,
    facility_name: facilityDetails.value.facility_name,
    facility_type: facilityDetails.value.facility_type,
    amenities: facilityDetails.value.amenities,
    price_per_hour: facilityDetails.value.price_per_hour,
    open_time: facilityDetails.value.open_time,
    closing_time: facilityDetails.value.closing_time,
    address: facilityDetails.value.address,
    phone_number: facilityDetails.value.phone_number,
    briefdescription: facilityDetails.value.briefdescription,
    image_url: facilityDetails.value.image_url,
  })

  existingPhotoUrls.value = facilityDetails.value.additional_photos || []
  newGalleryFiles.value = []
  primaryPhotoFile.value = null

  showEditModal.value = true
}
</script>

<style scoped>
.sidebar {
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(4px);
  border-right: 2px solid #2196f3;
}

.sidebar .v-list-item {
  transition: background-color 0.3s ease;
}
.sidebar .v-list-item:hover {
  background-color: rgba(158, 208, 248, 1);
}
.sidebar .v-list-item--active {
  background-color: rgba(158, 208, 248, 1);
}

.logo-section.v-list-item {
  pointer-events: none !important;
  background-color: transparent !important;
}

.logo-section .v-list-item-title {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  height: auto !important;
  line-height: 1.5;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 1.2rem;
}

.logo-section {
  padding-top: 25px !important;
  padding-bottom: 25px !important;
  min-height: unset !important;
}

.v-list-item {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.v-icon {
  margin-right: 10px !important;
  font-size: 2.1rem;
}

.v-card-title .v-btn .v-icon.mdi-pencil {
  font-size: 25px !important;
  color: white !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  margin-left: 8px !important;
  box-shadow:
    0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14),
    0px 1px 10px 0px rgba(0, 0, 0, 0.12) !important;
}

/* Style for the calendar indicator */
.booking-indicator-day {
  position: relative;
  /* Ensure the button/div itself is the position reference */
}

.booking-indicator-day::after {
  content: '';
  position: absolute;
  /* Adjust position */
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background-color: #4caf50; /* Green dot for accepted booking */
  border-radius: 50%;
}

.main-content {
  padding: 24px;
}

.header-row {
  margin-bottom: 24px;
  align-items: center;
}

.dashboard-card,
.v-card {
  background-color: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(4px);
  border: 2px solid #2196f3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.dashboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.grey-background {
  background-color: #e0e0e0;
}
</style>
