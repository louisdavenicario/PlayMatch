<template>
  <v-app
    style="
      background:
        linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6)),
        url('/images/logo.jpg') center/cover no-repeat;
    "
  >
    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.mdAndUp"
      :temporary="$vuetify.display.smAndDown"
      app
      class="sidebar"
    >
      <v-list-item class="logo-section">
        <v-list-item-title class="font-weight-bold text-h6">
          {{ facilityDetails?.facility_name }}
        </v-list-item-title>
      </v-list-item>

      <v-divider style="border-color: black; border-width: 2px"></v-divider>

      <v-list dense nav>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'dashboard' }"
          @click="navigate('dashboard')"
          link
        >
          <v-list-item-title>
            <v-icon class="mr-2">mdi-view-dashboard</v-icon>
            Dashboard
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'bookings' }"
          @click="navigate('bookings')"
          link
        >
          <v-list-item-title>
            <v-icon class="mr-2">mdi-book-check</v-icon>
            Bookings
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'availability' }"
          @click="navigate('availability')"
          link
        >
          <v-list-item-title>
            <v-icon class="mr-2">mdi-calendar-check</v-icon>
            Availability Settings</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          :class="{ 'v-list-item--active': currentPage === 'settings' }"
          @click="navigate('settings')"
          link
        >
          <v-list-item-title>
            <v-icon class="mr-2">mdi-cog</v-icon>
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
        <v-row class="header-row align-center">
          <v-col class="d-flex align-center">
            <!-- Show burger menu only on small screens -->
            <v-app-bar-nav-icon
              v-if="$vuetify.display.smAndDown"
              class="mr-2"
              @click="drawer = !drawer"
            ></v-app-bar-nav-icon>

            <h1 class="text-h4 font-weight-bold text-black m-0">
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
              <v-card class="pa-4 dashboard-card fill-height" rounded="lg">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-1 font-weight-medium">Today's Bookings</div>
                  <v-icon size="30" color="primary">mdi-calendar-today</v-icon>
                </div>
                <v-card-text class="pa-0 text-h4 font-weight-bold">
                  {{ dashboardData.todayBookings }}
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card class="pa-4 dashboard-card fill-height" rounded="lg">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-1 font-weight-medium">Monthly Revenue</div>
                  <v-icon size="30" color="green-darken-2">mdi-currency-php</v-icon>
                </div>
                <v-card-text class="pa-0 text-h4 font-weight-bold">
                  ₱{{ dashboardData.monthlyRevenue.toFixed(2) }}
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card class="pa-4 dashboard-card fill-height" rounded="lg">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-1 font-weight-medium">Pending Requests</div>
                  <v-icon size="30" color="orange-darken-2">mdi-alert-circle-outline</v-icon>
                </div>
                <v-card-text class="pa-0 text-h4 font-weight-bold">
                  {{ dashboardData.pendingRequests }}
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" sm="6" lg="3">
              <v-card class="pa-4 dashboard-card fill-height" rounded="lg">
                <div class="d-flex justify-space-between align-center mb-2">
                  <div class="text-subtitle-1 font-weight-medium">Facility Rating</div>
                  <v-icon size="30" color="amber-darken-2">mdi-star</v-icon>
                </div>

                <v-card-text class="pa-0 text-h4 font-weight-bold">
                  <template v-if="facilityRating.average > 0">
                    <div class="d-flex align-center">
                      <v-icon size="24" color="amber-darken-2" class="mr-2">mdi-star</v-icon>
                      <span class="mr-2"> {{ facilityRating.average.toFixed(1) }} </span>
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
                <v-card-subtitle> Latest 5 accepted bookings for your facility </v-card-subtitle>
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
                <v-card-title class="font-weight-bold d-flex justify-space-between align-center">
                  <span>All Bookings History 📅</span>
                  <v-btn
                    color="primary"
                    variant="flat"
                    :loading="loadingBookings"
                    @click="fetchAllBookings"
                    prepend-icon="mdi-refresh"
                  >
                    Refresh
                  </v-btn>
                </v-card-title>

                <v-card-subtitle>
                  Displays all past, present, and future bookings with their status.
                </v-card-subtitle>

                <v-card-text>
                  <v-row align="center" class="mb-2">
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="filterType"
                        :items="filterOptions"
                        label="Filter Bookings"
                        prepend-inner-icon="mdi-filter"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-select>
                    </v-col>

                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="sortOrder"
                        :items="sortOptions"
                        label="Sort By"
                        prepend-inner-icon="mdi-sort"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-select>
                    </v-col>

                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="itemsPerPageAllBookings"
                        :items="[5, 10, 25, 50, 100]"
                        label="Items Per Page"
                        prepend-inner-icon="mdi-format-list-numbered"
                        variant="outlined"
                        density="compact"
                        hide-details
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-data-table
                    :headers="allBookingsHeaders"
                    :items="paginatedBookings"
                    :loading="loadingBookings"
                    item-value="id"
                    class="elevation-1"
                    :items-per-page="itemsPerPageAllBookings"
                    hide-default-footer
                    hide-default-header
                  >
                    <template v-slot:item.status="{ item }">
                      <v-chip
                        :color="getStatusColor(item.status)"
                        label
                        size="small"
                        class="font-weight-bold"
                      >
                        {{ item.status.charAt(0).toUpperCase() + item.status.slice(1) }}
                      </v-chip>
                    </template>

                    <template v-slot:item.price="{ item }"> ₱{{ item.price.toFixed(2) }} </template>

                    <template v-slot:item.actions="{ item }">
                      <div v-if="item.status === 'pending'">
                        <v-btn
                          color="success"
                          size="small"
                          class="mr-2"
                          @click="handleBookingStatus(item.id, 'accepted')"
                        >
                          Accept
                        </v-btn>

                        <v-btn
                          color="error"
                          size="small"
                          @click="handleBookingStatus(item.id, 'rejected')"
                        >
                          Reject
                        </v-btn>
                      </div>

                      <span v-else>N/A</span>
                    </template>

                    <template v-slot:no-data>
                      <v-alert :value="true" type="info" class="mt-4">
                        No bookings match the current filter and sort criteria.
                      </v-alert>
                    </template>

                    <template v-slot:bottom>
                      <div class="d-flex justify-center pt-4">
                        <v-pagination
                          v-model="currentPageAllBookings"
                          :length="Math.ceil(sortedAllBookings.length / itemsPerPageAllBookings)"
                          :total-visible="7"
                        ></v-pagination>
                      </div>
                    </template>
                  </v-data-table>
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
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { supabase } from '@/supabaseClient'
import { useRouter } from 'vue-router'

const loading = ref(false)
const customSchedules = ref([])
// Modal state variables
const showDeleteConfirmModal = ref(false)
const scheduleToDeleteId = ref(null)
const scheduleToDeleteDate = ref('')

const acceptedBookings = ref([])
const selectedDateBookings = ref([])
const calendarDate = ref(new Date().toISOString().substring(0, 10))
const selectedDay = ref(null)

// --- FILTERING & SORTING STATE ---
const sortOrder = ref('Newest to Oldest') // Default sort order
const sortOptions = ref([
  'Newest to Oldest',
  'Oldest to Newest',
  'Price (Low to High)',
  'Price (High to Low)',
])

const filterType = ref('All Bookings') // Default filter type
const filterOptions = ref([
  // Includes all status types
  'All Bookings',
  'Pending Requests',
  'Accepted Upcoming Bookings',
  'Completed Bookings',
  'Cancelled/Rejected Bookings',
])
// --- PAGINATION STATE ---
const currentPageAllBookings = ref(1) // Tracks current page number
const itemsPerPageAllBookings = ref(10) // User-adjustable items per page
// ---------------------------------

const bookingDates = computed(() => {
  return acceptedBookings.value.map((b) => b.booking_date)
})
const primaryPhotoFile = ref(null)
const drawer = ref(true)
const newGalleryFiles = ref([])
const existingPhotoUrls = ref([])
const router = useRouter()
const userId = ref(null)
const currentPage = ref(localStorage.getItem('ownerCurrentPage') || 'dashboard')
function navigate(page) {
  currentPage.value = page
  // Automatically close the drawer if on mobile
  if (window.innerWidth <= 960) {
    // mimic Vuetify's smAndDown behavior
    drawer.value = false
  }
}
watch(currentPage, (newVal) => {
  localStorage.setItem('ownerCurrentPage', newVal)
})
const showEditModal = ref(false)

const dashboardData = reactive({
  todayBookings: 0,
  monthlyRevenue: 0,
  pendingRequests: 0,
})

const facilityDetails = ref(null)

const facilityRating = reactive({
  average: 0,
  totalReviews: 0,
})

const editedFacility = reactive({
  id: null,
  facility_name: '',
  facility_type: '',
  amenities: '',
  price_per_hour: 0,
  open_time: '',
  closing_time: '',
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
const loadingState = ref(false)

// --- BOOKINGS PAGE MODIFICATIONS ---
const allBookings = ref([])
const loadingBookings = ref(false)

// Define headers for the v-data-table
const allBookingsHeaders = ref([
  { title: 'Date', key: 'date_booked' },
  { title: 'Time Slot', key: 'time_range' },
  { title: 'Customer', key: 'customer_name' },
  { title: 'Price', key: 'price' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
])

// Computed property to apply comprehensive filtering first, then sorting.
const sortedAllBookings = computed(() => {
  const now = new Date()
  let filteredList = allBookings.value.slice()

  // 1. Apply Filtering
  switch (filterType.value) {
    case 'Pending Requests':
      // Show only bookings with status 'pending'
      filteredList = filteredList.filter((booking) => booking.status === 'pending')
      break

    case 'Accepted Upcoming Bookings':
      // Show only bookings with status 'accepted' AND end_time is in the future
      filteredList = filteredList.filter(
        (booking) => booking.status === 'accepted' && new Date(booking.end_time) > now,
      )
      break

    case 'Completed Bookings':
      // Show only bookings with status 'accepted' AND end_time is in the past
      filteredList = filteredList.filter(
        (booking) => booking.status === 'completed' && new Date(booking.end_time) <= now,
      )
      break

    case 'Cancelled/Rejected Bookings':
      // Show bookings with status 'rejected' or 'cancelled'
      filteredList = filteredList.filter(
        (booking) => booking.status === 'rejected' || booking.status === 'cancelled',
      )
      break

    case 'All Bookings':
    default:
      // No filtering applied, show all bookings
      break
  }

  // 2. Apply Sorting
  let sortedList = filteredList.slice()
  switch (sortOrder.value) {
    case 'Oldest to Newest':
      sortedList.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      break
    case 'Price (Low to High)':
      sortedList.sort((a, b) => a.price - b.price)
      break
    case 'Price (High to Low)':
      sortedList.sort((a, b) => b.price - a.price)
      break
    case 'Newest to Oldest':
    default:
      sortedList.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      break
  }

  return sortedList
})

// Computed property to apply pagination to the filtered and sorted list.
const paginatedBookings = computed(() => {
  // Recalculate max page and reset current page if needed
  const maxPage = Math.ceil(sortedAllBookings.value.length / itemsPerPageAllBookings.value)
  if (currentPageAllBookings.value > maxPage && maxPage > 0) {
    currentPageAllBookings.value = 1
  }

  const start = (currentPageAllBookings.value - 1) * itemsPerPageAllBookings.value
  const end = start + itemsPerPageAllBookings.value
  return sortedAllBookings.value.slice(start, end)
})

// Function to determine chip color based on status
function getStatusColor(status) {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'error'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'grey'
    default:
      return 'info'
  }
}

// Function to fetch ALL bookings for the current facility
async function fetchAllBookings() {
  if (!facilityDetails.value?.id) {
    loadingBookings.value = false
    console.warn('Facility details not available, cannot fetch bookings.')
    return
  }

  loadingBookings.value = true
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
                *,
                profiles (full_name),
                facilities (facility_name)
            `,
      )
      .eq('facility_id', facilityDetails.value.id)
      .order('start_time', { ascending: false }) // Fetches all, newest first (initial order)

    if (error) throw error // Transform data for display in the table

    allBookings.value = data.map((booking) => {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time) // Format date

      const dateFormatted = start.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) // Format time range

      const timeFormatted = `${start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })} - ${end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`

      return {
        ...booking,
        customer_name: booking.profiles?.full_name || 'N/A',
        date_booked: dateFormatted,
        time_range: timeFormatted,
        // Map total_cost (from Supabase schema) to 'price' for the table template
        price: booking.total_cost || 0,
        start_time: booking.start_time, // Keep start_time for date filtering/sorting
        end_time: booking.end_time, // Keep end_time for 'Completed' filtering
      }
    })
  } catch (error) {
    console.error('Error fetching all bookings:', error.message)
    alertMessage('Error loading all bookings.', 'error')
  } finally {
    loadingBookings.value = false
  }
}

// Helper function for alerts
function showAlert(message, color) {
  alertMessageText.value = message
  alertColor.value = color
  setTimeout(() => {
    alertMessageText.value = ''
  }, 5000)
}

// --- RATING LOGIC START ---

const fetchRatings = async () => {
  if (!facilityDetails.value || !facilityDetails.value.id) return

  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating_value')
      .eq('facility_id', facilityDetails.value.id)

    if (error) throw error

    if (data && data.length > 0) {
      const total = data.reduce((sum, r) => sum + (r.rating_value || 0), 0)
      facilityRating.average = total / data.length
      facilityRating.totalReviews = data.length
    } else {
      facilityRating.average = 0
      facilityRating.totalReviews = 0
    }
  } catch (error) {
    console.error('Error fetching ratings:', error.message)
  }
}

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
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!facilityDetails.value) {
    facilityRating.average = 0
    facilityRating.totalReviews = 0
    return
  }

  try {
    const facilityId = facilityDetails.value.id // Fetch regular hours

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

    let { data: customData, error: customError } = await supabase
      .from('schedules')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('type', 'custom')
    if (customError) console.error('Error fetching custom schedules:', customError.message)
    if (customData) customSchedules.value = customData // Fetch Bookings

    let { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, profiles(full_name), facilities(facility_name)')
      .eq('facility_id', facilityId)
    if (bookingsError) throw bookingsError

    const allBookingsData = (bookingsData || []).map((b) => {
      const startTime = new Date(b.start_time)
      const bookingDate =
        startTime.getFullYear() +
        '-' +
        String(startTime.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(startTime.getDate()).padStart(2, '0')

      return {
        ...b,
        duration_hours: (new Date(b.end_time) - new Date(b.start_time)) / 3600000,
        booking_date: bookingDate,
      }
    })

    pendingBookings.value = allBookingsData.filter((b) => b.status === 'pending')
    acceptedBookings.value = allBookingsData.filter((b) => b.status === 'accepted')
    dashboardData.pendingRequests = pendingBookings.value.length

    if (selectedDay.value) {
      selectDay(selectedDay.value)
    } // 2. Fetch facility ratings

    await fetchRatings() // 3. Update dashboard metrics

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
    allBookingsData.forEach((booking) => {
      const bookingDate = new Date(booking.start_time)
      const status = booking.status

      if (
        (status === 'accepted' || status === 'completed') &&
        bookingDate >= currentMonthStart &&
        bookingDate < nextMonthStart
      ) {
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

    if (status === 'accepted') {
      const updatedBooking = data[0]
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== bookingId)
      acceptedBookings.value.push(updatedBooking)
      alertMessage('Booking accepted successfully!', 'success')
    } else if (status === 'rejected') {
      const rejected = pendingBookings.value.find((b) => b.id === bookingId)
      pendingBookings.value = pendingBookings.value.filter((b) => b.id !== bookingId)
      acceptedBookings.value = acceptedBookings.value.filter((b) => b.id !== bookingId)

      const { error: deleteError } = await supabase.from('bookings').delete().eq('id', bookingId)

      if (deleteError) {
        console.error('Error deleting rejected booking:', deleteError.message)
        alertMessage('Failed to remove rejected booking from availability.', 'error')
      } else {
        alertMessage('Booking rejected and time slot released!', 'success')
      }

      dashboardData.pendingRequests = pendingBookings.value.length

      await fetchAllOwnerData()
      await fetchAllBookings()

      if (facilityDetails.value && selectedDay.value && typeof fetchAvailableSlots === 'function') {
        await fetchAvailableSlots(facilityDetails.value.id, selectedDay.value)
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message)
    alertMessage('An unexpected error occurred while updating booking.', 'error')
  }
}

const getUTCDateString = (d) => {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const selectDay = (dateString) => {
  selectedDay.value = dateString

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
      await fetchAllBookings()
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
