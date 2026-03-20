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
      <v-btn icon @click="goBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-bold" style="color: white">
        Facility Details
      </v-toolbar-title>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container>
        <v-card class="pa-4" rounded="xl" elevation="2">
          <v-row v-if="allPhotos.length === 1" class="mb-4 mx-auto" style="max-width: 1200px">
            <v-col cols="12" class="pa-1">
              <v-img
                :src="allPhotos[0]"
                aspect-ratio="16/9"
                cover
                class="rounded-lg"
                style="cursor: pointer"
                @click="openZoom(allPhotos[0])"
                title="Click to Zoom"
              />
            </v-col>
          </v-row>
          <v-row
            v-else-if="allPhotos.length >= 2 && allPhotos.length <= 4"
            class="mb-4 mx-auto"
            style="max-width: 1200px"
          >
            <v-col v-for="(photoUrl, i) in allPhotos" :key="i" cols="12" sm="6" md="6" class="pa-1">
              <v-img
                :src="photoUrl"
                aspect-ratio="4/3"
                cover
                class="rounded-lg h-100"
                style="cursor: pointer"
                @click="openZoom(photoUrl)"
                title="Click to Zoom"
              />
            </v-col>
          </v-row>
          <v-row
            v-else-if="allPhotos.length >= 5"
            class="mb-4 mx-auto align-stretch"
            style="max-width: 1200px"
          >
            <v-col cols="12" md="7" class="pa-1">
              <v-img
                :src="allPhotos[0]"
                cover
                class="rounded-lg h-100"
                style="cursor: pointer; height: 100%; min-height: 400px"
                @click="openZoom(allPhotos[0])"
                title="Click to Zoom"
              >
                <div class="d-flex align-end justify-end fill-height">
                  <v-chip
                    color="white"
                    class="ma-3 font-weight-bold"
                    style="opacity: 0.9"
                    @click.stop="openZoom(allPhotos[0])"
                  >
                    <v-icon left>mdi-image-multiple</v-icon> See all photos
                  </v-chip>
                </div>
              </v-img>
            </v-col>
            <v-col cols="12" md="5" class="pa-1 d-flex flex-column">
              <v-row no-gutters class="flex-grow-1">
                <v-col
                  v-for="(photoUrl, i) in allPhotos.slice(1, 3)"
                  :key="i + 1"
                  cols="6"
                  class="pa-1"
                >
                  <v-img
                    :src="photoUrl"
                    aspect-ratio="1/1"
                    cover
                    class="rounded-lg h-100"
                    style="cursor: pointer"
                    @click="openZoom(photoUrl)"
                    title="Click to Zoom"
                  />
                </v-col>
              </v-row>
              <v-row no-gutters class="flex-grow-1">
                <v-col
                  v-for="(photoUrl, i) in allPhotos.slice(3, 5)"
                  :key="i + 3"
                  cols="6"
                  class="pa-1"
                >
                  <v-img
                    :src="photoUrl"
                    aspect-ratio="1/1"
                    cover
                    class="rounded-lg h-100"
                    style="cursor: pointer"
                    @click="openZoom(photoUrl)"
                    title="Click to Zoom"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-img
            v-else
            src="/images/default-facility.jpg"
            height="400"
            class="mb-4 mx-auto"
            rounded="lg"
          />

          <h2 class="font-weight-bold">{{ facility.facility_name }}</h2>
          <p class="grey--text mb-2">Address: {{ facility.address }}</p>
          <p class="grey--text mb-2">Operating Hours (Today): {{ currentDayOperatingHours }}</p>
          <p class="grey--text mb-2">Contact/G-Cash Number: {{ facility.phone_number }}</p>
          <p class="grey--text mb-2">Amenities: {{ facility.amenities }}</p>
          <p class="grey--text mb-2">
            Price:
            <v-chip color="green darken-1" dark class="mt-2 mt-sm-0">
              ₱{{ facility.price_per_hour || 'N/A' }} / hour
            </v-chip>
          </p>

          <v-divider class="my-4"></v-divider>

          <p class="grey--text mb-4">
            {{ facility.briefdescription || 'No description available.' }}
          </p>

          <v-divider class="my-6"></v-divider>

          <div class="d-flex align-center flex-wrap mb-4">
            <div class="d-flex align-center mr-4">
              <v-icon
                v-for="star in 5"
                :key="star"
                :color="star <= userRating ? 'amber' : 'grey lighten-1'"
                large
                @click="rateFacility(star)"
                style="cursor: pointer"
              >
                {{ star <= userRating ? 'mdi-star' : 'mdi-star-outline' }}
              </v-icon>
              <span class="ml-2 grey--text text-body-2">
                {{ averageRating }} ({{ totalRatings }} reviews)
              </span>
            </div>
          </div>

          <div>
            <h3 class="text-h6 font-weight-medium mb-4">Reviews & Comments</h3>

            <div v-if="currentUserId">
              <v-textarea
                v-model="newComment"
                label="Write your comment..."
                outlined
                rows="2"
                class="mb-0"
                rounded="lg"
              />
              <v-btn
                color="blue"
                dark
                rounded
                class="text-none"
                @click="submitReview"
                :loading="submittingReview"
                :disabled="!newComment.trim()"
              >
                Submit
              </v-btn>
            </div>
            <div v-else class="grey--text mb-4">Please log in to leave a review.</div>

            <v-divider class="my-4"></v-divider>

            <v-list two-line>
              <v-list-item v-for="review in displayedReviews" :key="review.id" class="mb-2">
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">
                    {{ review.user_name || 'Anonymous' }}
                    <v-icon
                      v-for="n in review.rating_value"
                      :key="'filled-' + n"
                      color="amber"
                      small
                      >mdi-star</v-icon
                    >
                    <v-icon
                      v-for="n in 5 - review.rating_value"
                      :key="'outline-' + n"
                      color="grey lighten-1"
                      small
                      >mdi-star-outline</v-icon
                    >
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ review.comment }}</v-list-item-subtitle>
                  <span class="grey--text text-caption">{{ formatDate(review.created_at) }}</span>
                </v-list-item-content>
              </v-list-item>
              <div v-if="reviews.length === 0" class="grey--text">No reviews yet.</div>
            </v-list>

            <v-btn
              v-if="!showAllReviews && reviews.length > 2"
              text
              rounded
              color="blue"
              class="text-none"
              @click="showAllReviews = true"
            >
              See More Reviews
            </v-btn>
            <v-btn
              v-else-if="showAllReviews && reviews.length > 2"
              text
              rounded
              color="blue"
              @click="showAllReviews = false"
            >
              See Less Reviews
            </v-btn>
          </div>
        </v-card>

        <v-divider class="my-6"></v-divider>

        <v-card class="pa-4 mt-6" rounded="xl" elevation="2">
          <h3 class="text-h6 font-weight-medium mb-3">Book this Facility</h3>

          <v-skeleton-loader v-if="loadingSchedules" type="date-picker, text" />

          <div v-else>
            <div class="d-flex justify-center calendar-container">
              <v-date-picker
                v-model="selectedDate"
                :allowed-dates="allowedDates"
                :events="availableDates"
                event-color="blue"
                color="blue"
                class="rounded-xl mb-4 calendar-border"
                flat
                outlined
              />
            </div>

            <v-alert
              v-if="selectedDateHasCustomSchedule"
              type="info"
              color="blue-lighten-4"
              border="start"
              border-color="blue-darken-2"
              icon="mdi-information"
              class="mb-4"
              rounded="xl"
            >
              {{ selectedCustomSchedule?.reason }}
            </v-alert>

            <div
              v-if="
                selectedDate &&
                groupedSchedules[selectedDate] &&
                groupedSchedules[selectedDate].length > 0
              "
            >
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Available Slots for {{ selectedDate }} <br />Select Start Time:
              </h4>

              <div
                v-if="groupedSchedules[selectedDate] && groupedSchedules[selectedDate].length > 0"
                class="d-flex flex-wrap"
              >
                <v-chip-group column class="d-flex flex-wrap">
                  <v-chip
                    v-for="slot in groupedSchedules[selectedDate]"
                    :key="slot.start_time"
                    :color="
                      isSlotSelected(slot.start_time)
                        ? 'blue'
                        : isSlotDisabled(slot.start_time)
                          ? 'red lighten-4'
                          : 'grey lighten-2'
                    "
                    :text-color="
                      isSlotSelected(slot.start_time)
                        ? 'white'
                        : isSlotDisabled(slot.start_time)
                          ? 'red darken-3'
                          : 'grey darken-3'
                    "
                    :outlined="!isSlotSelected(slot.start_time)"
                    :disabled="isSlotDisabled(slot.start_time)"
                    @click="
                      !isSlotDisabled(slot.start_time) && handleTimeSlotSelection(slot.start_time)
                    "
                    class="ma-1"
                  >
                    {{ slot.formatted_time }}
                  </v-chip>
                </v-chip-group>
              </div>

              <div v-else class="grey--text">No available slots for this date</div>
            </div>

            <div v-else class="grey--text">Select a date with available times</div>

            <div v-if="selectedStartSlot" class="mt-4">
              <h4 class="text-subtitle-1 font-weight-bold mb-2">
                Select Duration (Hours, Max: {{ MAX_BOOKING_HOURS }})
              </h4>
              <v-text-field
                v-model.number="selectedDuration"
                label="Enter Duration in Hours"
                rounded="lg"
                type="number"
                min="1"
                :max="MAX_BOOKING_HOURS"
                :error-messages="durationError"
                :color="isDurationValid(selectedDuration) ? 'blue' : 'red'"
                solo
                prepend-inner-icon="mdi-timer-sand"
              />
            </div>

            <v-alert
              v-if="selectedStartSlot && selectedDuration > 0 && isDurationValid(selectedDuration)"
              type="success"
              text
              color="green"
              icon="mdi-check-circle"
              class="mt-4 rounded-xl"
            >
              <div class="font-weight-bold">Selected Booking:</div>
              Date: {{ selectedDate }}<br />
              Time: {{ formattedSelectedTime }} - {{ formattedEndTime }} ({{
                selectedDuration
              }}
              hours)<br />
              Total Cost: ₱{{ totalBookingCost }}
            </v-alert>

            <v-alert
              v-if="selectedStartSlot && selectedDuration > 0 && durationError"
              type="error"
              text
              color="red"
              icon="mdi-alert-circle"
              class="mt-4"
            >
              {{ durationError }}
            </v-alert>

            <v-btn
              block
              color="blue darken-1"
              dark
              rounded
              class="mt-4 text-none"
              @click="addToBucket"
              :disabled="!selectedStartSlot || !!durationError"
            >
              <v-icon left>mdi-plus-box</v-icon>
              Reserve Slot
            </v-btn>

            <v-btn
              v-if="cart.length > 0"
              block
              color="blue"
              dark
              rounded
              class="mt-2 text-none"
              @click="cartDialog = true"
            >
              <v-badge color="red" :content="cart.length" overlap class="mr-2">
                <v-icon>mdi-bucket</v-icon>
              </v-badge>
              View Reservation(s) (₱{{ cartTotal }})
            </v-btn>
          </div>
        </v-card>

        <!-- Payment Proof Upload Dialog -->
        <v-dialog v-model="paymentDialog" max-width="600" persistent>
          <v-card rounded="xl" elevation="4">
            <v-toolbar color="blue" dark flat class="px-4" height="auto" style="min-height: 56px;">
              <v-icon left>mdi-cash-multiple</v-icon>
              <v-toolbar-title class="font-weight-bold" style="white-space: normal; font-size: 18px;">
                Upload Proof of Payment
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="closePaymentDialog">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>

            <v-card-text class="pt-6">
              <v-alert
                type="info"
                color="blue-lighten-4"
                border="start"
                border-color="blue-darken-2"
                icon="mdi-information"
                class="mb-4"
                rounded="xl"
              >
                <div class="font-weight-bold mb-2">Payment Instructions:</div>
                <div class="text-body-2">
                  1. Transfer ₱{{ totalBookingCost }} to the facility's payment account<br />
                  2. Take a screenshot or photo of your payment confirmation<br />
                  3. Upload the proof of payment below<br />
                  4. Your booking will be reviewed once payment is verified
                </div>
              </v-alert>


              <div class="mb-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-3">Booking Summary:</h4>

                <div
                  v-for="(item, index) in cart"
                  :key="item.id"
                  class="d-flex align-center pa-3 mb-2 rounded-lg"
                  style="background: #f5f5f5; gap: 10px;"
                >
                  <!-- Date Badge -->
                  <div
                    class="rounded-lg text-center d-flex flex-column align-center justify-center"
                    style="background: #E3F2FD; min-width: 44px; padding: 6px 8px;"
                  >
                    <span style="font-size: 10px; font-weight: 600; color: #1565C0; line-height: 1; text-transform: uppercase;">
                      {{ formatBadgeMonth(item.date) }}
                    </span>
                    <span style="font-size: 18px; font-weight: 600; color: #0D47A1; line-height: 1.3;">
                      {{ formatBadgeDay(item.date) }}
                    </span>
                  </div>

                  <!-- Booking Info -->
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="font-weight-medium" style="font-size: 13px; color: #212121;">
                      {{ item.formattedTime }}
                    </div>
                    <div style="font-size: 12px; color: #757575;">
                      {{ item.duration }} {{ item.duration === 1 ? 'hour' : 'hours' }} · ₱{{ item.cost }}
                    </div>
                  </div>

                  <!-- Booking number badge -->
                  <div
                    class="rounded-lg text-center"
                    style="background: #E3F2FD; padding: 4px 8px;"
                  >
                    <span style="font-size: 11px; font-weight: 600; color: #1565C0;">#{{ index + 1 }}</span>
                  </div>
                </div>

                <v-divider class="my-3"></v-divider>

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-caption grey--text">{{ cart.length }} {{ cart.length === 1 ? 'booking' : 'bookings' }}</div>
                    <div class="font-weight-bold" style="font-size: 18px; color: #212121;">Total Amount</div>
                  </div>
                  <span class="font-weight-bold blue--text text-h6">₱{{ cartTotal }}</span>
                </div>
              </div>

              <v-divider class="my-4"></v-divider>

              <div>
                <h4 class="text-subtitle-1 font-weight-bold mb-3">
                  <v-icon color="red" small>mdi-asterisk</v-icon>
                  Upload Proof of Payment:
                </h4>

                <v-file-input
                  v-model="paymentProofFile"
                  accept=".jpg,.jpeg,.png,.webp"
                  label="Select payment proof image"
                  prepend-icon="mdi-camera"
                  outlined
                  rounded="lg"
                  show-size
                  :error-messages="paymentProofError"
                  @change="handleFileSelect"
                  :multiple="false"
                />

                <!-- Preview of uploaded image -->
                <v-card v-if="paymentProofPreview" class="mt-3" outlined rounded="lg" elevation="0">
                  <v-card-title class="text-subtitle-2 py-2">
                    <v-icon small left color="green">mdi-check-circle</v-icon>
                    Payment Proof Preview:
                  </v-card-title>
                  <v-card-text class="pa-2">
                    <v-img
                      :src="paymentProofPreview"
                      max-height="300"
                      contain
                      class="rounded-lg"
                    ></v-img>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>

            <v-card-actions class="px-6 pb-4">
              <v-btn text rounded @click="closePaymentDialog" class="text-none"> Cancel </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="blue"
                dark
                rounded
                class="text-none px-6"
                @click="submitBookingWithPayment"
                :loading="loading"
                :disabled="!paymentProofFile"
              >
                <v-icon left>mdi-check</v-icon>
                Submit Payment
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Receipt Dialog (Enhanced with Payment Proof) -->
        <v-dialog v-model="receiptDialog" max-width="500">
          <v-card rounded="xl" elevation="4">
            <v-toolbar color="blue" dark flat class="px-4">
              <v-icon left>mdi-calendar-check</v-icon>
              <v-toolbar-title class="font-weight-bold">Booking Submitted!</v-toolbar-title>
            </v-toolbar>

            <v-card-text class="pt-4">
              <p class="text-h6 font-weight-bold">{{ facility.facility_name }}</p>
              <v-divider class="my-3"></v-divider>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="grey--text">Status:</span>
                <v-chip color="orange" dark small>Pending Approval</v-chip>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">Date:</span>
                <span class="font-weight-medium">{{ receiptDetails.date }}</span>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">Time:</span>
                <span class="font-weight-medium">
                  {{ receiptDetails.startTime }} - {{ receiptDetails.endTime }}
                </span>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="grey--text">Duration:</span>
                <span class="font-weight-medium">{{ receiptDetails.duration }} hour(s)</span>
              </div>

              <v-divider class="my-2" style="border-style: dashed"></v-divider>

              <div class="d-flex justify-space-between text-h6 mt-2">
                <span>Total Cost:</span>
                <span class="blue--text font-weight-bold">₱{{ receiptDetails.cost }}</span>
              </div>

              <!-- Payment Proof Display -->
              <v-card
                v-if="receiptDetails.paymentProofUrl"
                class="mt-4"
                outlined
                rounded="lg"
                elevation="0"
              >
                <v-card-title class="text-subtitle-2 py-2">
                  <v-icon small left color="green">mdi-check-circle</v-icon>
                  Payment Proof Submitted:
                </v-card-title>
                <v-card-text class="pa-2">
                  <v-img
                    :src="receiptDetails.paymentProofUrl"
                    max-height="200"
                    contain
                    class="rounded-lg"
                    @click="openPaymentProofZoom"
                    style="cursor: pointer"
                  ></v-img>
                  <div class="text-center mt-2">
                    <v-btn
                      class="text-none rounded-xl"
                      small
                      text
                      color="blue"
                      @click="openPaymentProofZoom"
                    >
                      <v-icon small left>mdi-magnify</v-icon>
                      View Full Size
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>

              <v-alert
                type="warning"
                color="orange-lighten-4"
                border="start"
                border-color="orange-darken-2"
                icon="mdi-camera"
                class="mt-4"
                rounded="xl"
              >
                <div class="font-weight-bold">Please take a screenshot of this receipt.</div>
                <div class="caption">
                  This serves as your proof of booking while awaiting approval.
                </div>
              </v-alert>
              <p class="caption grey--text text-center mt-4">
                The facility manager will review your payment and booking request. You will be
                notified once the status changes.
              </p>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="receiptDialog = false" class="text-none">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Payment Proof Zoom Dialog -->
        <v-dialog v-model="paymentProofZoomDialog" max-width="90vw">
          <v-card dark color="black">
            <v-toolbar dense flat color="transparent">
              <v-spacer></v-spacer>
              <v-btn icon @click="paymentProofZoomDialog = false">
                <v-icon color="white">mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text class="pa-0">
              <v-img
                :src="receiptDetails.paymentProofUrl"
                max-height="90vh"
                contain
                class="mx-auto"
              ></v-img>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Facility Photos Zoom Dialog -->
        <v-dialog v-model="zoomDialog" fullscreen transition="dialog-bottom-transition">
          <v-card dark color="black">
            <v-toolbar dense flat color="white">
              <v-spacer></v-spacer>
              <v-btn icon @click="zoomDialog = false">
                <v-icon color="#1a65a2">mdi-close</v-icon>
              </v-btn>
            </v-toolbar>

            <v-container fluid fill-height>
              <v-row align="center" justify="center">
                <v-col cols="12" class="text-center">
                  <v-carousel
                    v-model="zoomCarouselIndex"
                    hide-delimiter-background
                    height="90vh"
                    show-arrows-on-hover
                    delimiter-icon="mdi-circle-small"
                    delimiter-size="12"
                    cycle
                  >
                    <v-carousel-item v-for="(photoUrl, index) in allPhotos" :key="index">
                      <v-img :src="photoUrl" contain max-height="90vh" class="mx-auto"></v-img>
                    </v-carousel-item>
                  </v-carousel>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-dialog>

        <!-- Cart Review Dialog -->
        <v-dialog v-model="cartDialog" max-width="500" scrollable>
          <v-card rounded="xl">
            <v-toolbar color="blue darken-2" dark flat>
              <v-toolbar-title class="font-weight-bold">Selected Bookings</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="cartDialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </v-toolbar>

            <v-card-text class="pa-3">
              <v-list v-if="cart.length > 0" class="pa-0">
                <div
                  v-for="(item, index) in cart"
                  :key="item.id"
                  class="d-flex align-center pa-3 mb-2 rounded-lg"
                  style="background: #f5f5f5; gap: 10px;"
                >
                  <!-- Date Badge -->
                  <div
                    class="rounded-lg text-center d-flex flex-column align-center justify-center"
                    style="background: #E3F2FD; min-width: 44px; padding: 6px 8px;"
                  >
                    <span
                      style="font-size: 10px; font-weight: 600; color: #1565C0; line-height: 1; text-transform: uppercase;"
                    >
                      {{ formatBadgeMonth(item.date) }}
                    </span>
                    <span style="font-size: 18px; font-weight: 600; color: #0D47A1; line-height: 1.3;">
                      {{ formatBadgeDay(item.date) }}
                    </span>
                  </div>

                  <!-- Booking Info -->
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="font-weight-medium text-truncate" style="font-size: 13px; color: #212121;">
                      {{ item.formattedTime }}
                    </div>
                    <div style="font-size: 12px; color: #757575;">
                      {{ item.duration }} {{ item.duration === 1 ? 'hour' : 'hours' }} · ₱{{ item.cost }}
                    </div>
                  </div>

                  <!-- Delete Button -->
                  <v-btn
                    icon
                    small
                    @click="removeFromBucket(index)"
                    style="background: #FFEBEE; border-radius: 8px; width: 32px; height: 32px;"
                  >
                    <v-icon small color="red darken-3">mdi-delete-outline</v-icon>
                  </v-btn>
                </div>
              </v-list>
              <div v-else class="text-center grey--text pa-6">
                No bookings added yet.
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4 d-flex justify-space-between align-center">
              <div>
                <div class="text-caption grey--text">{{ cart.length }} {{ cart.length === 1 ? 'booking' : 'bookings' }}</div>
                <div class="font-weight-bold" style="font-size: 18px; color: #212121;">₱{{ cartTotal }}</div>
              </div>
              <v-btn
                color="blue darken-2"
                dark
                rounded
                class="text-none px-5"
                @click="cartDialog = false; openPaymentDialog()"
              >
                Pay all & submit
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'FacilityDetails',
  props: ['id'],

  data: () => ({
    facility: {},
    // Review/Photo Data
    reviews: [],
    newComment: '',
    submittingReview: false,
    showAllReviews: false,

    // Booking/Schedule Data
    schedules: [],
    bookings: [],
    availableSchedules: [],
    groupedSchedules: {},
    availableDates: [],
    selectedDate: null,
    customSchedules: [],

    // Multi-Hour Booking Data
    selectedStartSlot: null,
    selectedDuration: 1,
    MAX_BOOKING_HOURS: 4,
    durationError: '',

    // Payment Proof Data
    paymentDialog: false,
    paymentProofFile: null,
    paymentProofPreview: null,
    paymentProofError: '',
    uploadingPaymentProof: false,
    paymentProofZoomDialog: false,

    // General State
    loading: false,
    loadingSchedules: false,
    SLOT_DURATION_MINUTES: 60,
    DAYS_TO_GENERATE: 90,

    // Ratings
    userRating: 0,
    averageRating: '0.0',
    totalRatings: 0,
    currentUserId: null,

    // Carousel & Zoom
    zoomDialog: false,
    zoomCarouselIndex: 0,

    // Cart/Bucket Data
    cart: [],
    cartDialog: false,

    // Receipt Dialog
    receiptDialog: false,
    receiptDetails: {
      date: '',
      startTime: '',
      endTime: '',
      duration: 0,
      cost: '0.00',
      paymentProofUrl: '',
    },
  }),

  computed: {
    // Reviews Computed Property
    displayedReviews() {
      if (this.showAllReviews) return this.reviews
      return this.reviews.slice(0, 2)
    },

    // Cart Computed Property
    cartTotal() {
      const total = this.cart.reduce((sum, item) => sum + parseFloat(item.cost), 0);
      return total.toFixed(2);
    },

    // Photos Computed Property
    allPhotos() {
      const photos = []
      if (this.facility.image_url) photos.push(this.facility.image_url)
      if (this.facility.additional_photos && Array.isArray(this.facility.additional_photos)) {
        photos.push(...this.facility.additional_photos.filter((url) => url))
      }
      return photos
    },
    // Scheduling Computed Properties
    currentDayOperatingHours() {
      if (!this.schedules || this.schedules.length === 0) return 'N/A'
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const todayDayOfWeek = days[new Date().getDay()]

      const schedules = this.schedules.find(
        (s) => s.type === 'regular' && s.day_of_week === todayDayOfWeek,
      )

      if (schedules && schedules.start_time && schedules.end_time) {
        return `${schedules.start_time} - ${schedules.end_time}`
      }
      return 'N/A'
    },
    formattedSelectedTime() {
      if (!this.selectedStartSlot) return ''
      return new Date(this.selectedStartSlot).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
    formattedEndTime() {
      if (!this.selectedStartSlot || this.selectedDuration <= 0) return ''
      const start = new Date(this.selectedStartSlot)
      const end = new Date(
        start.getTime() + this.selectedDuration * this.SLOT_DURATION_MINUTES * 60000,
      )
      return end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    },
    totalBookingCost() {
      const price = this.facility.price_per_hour || 0
      return (price * this.selectedDuration).toFixed(2)
    },
    selectedCustomSchedule() {
      if (!this.customSchedules || !this.selectedDate) return null
      return this.customSchedules.find((s) => s.date === this.selectedDate)
    },
    selectedDateHasCustomSchedule() {
      return !!this.selectedCustomSchedule
    },
  },

  async mounted() {
    await this.getCurrentUser()
    await this.fetchFacility()
    await this.fetchCustomSchedules()
    await this.fetchSchedulesAndBookings()
    await this.fetchRatings()
    await this.fetchReviews()
    this.autoSelectFirstAvailableDate()
  },

  watch: {
    selectedDate(newDate) {
      if (newDate && newDate instanceof Date) {
        const year = newDate.getFullYear()
        const month = String(newDate.getMonth() + 1).padStart(2, '0')
        const day = String(newDate.getDate()).padStart(2, '0')
        this.selectedDate = `${year}-${month}-${day}`
        return
      }
      this.handleDateSelection()
    },
    selectedStartSlot() {
      this.selectedDuration = 1
      this.durationError = ''
    },
    selectedDuration(newDuration) {
      if (this.selectedStartSlot) {
        this.validateDuration(newDuration)
      } else {
        this.durationError = ''
      }
    },
  },

  methods: {
    goBack() {
      this.$router.push({ name: 'customer-dashboard' })
    },

    // --- Cart/Bucket Methods ---
    addToBucket() {
      if (!this.selectedStartSlot || this.durationError || !this.isDurationValid(this.selectedDuration)) {
        alert('Please select a valid time slot and duration first.');
        return;
      }

      const endTime = new Date(
        new Date(this.selectedStartSlot).getTime() + this.selectedDuration * 60 * 60000
      );

      const bookingItem = {
        id: Date.now(),
        facility_id: this.facility.id,
        date: this.selectedDate,
        start_time: this.selectedStartSlot,
        end_time: endTime.toISOString(),
        duration: this.selectedDuration,
        cost: this.totalBookingCost,
        formattedTime: `${this.formattedSelectedTime} - ${this.formattedEndTime}`,
      };

      this.cart.push(bookingItem);

      // Reset time selection — the slot chips will auto-update via isSlotDisabled()
      this.selectedStartSlot = null;
      this.selectedDuration = 1;
      this.durationError = '';
    },

    formatBadgeMonth(dateStr) {
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return months[new Date(dateStr + 'T00:00:00').getMonth()];
    },
    formatBadgeDay(dateStr) {
      return new Date(dateStr + 'T00:00:00').getDate();
    },

    removeFromBucket(index) {
      this.cart.splice(index, 1);
    },

    // --- Authentication ---
    async getCurrentUser() {
      const { data } = await supabase.auth.getUser()
      this.currentUserId = data?.user?.id || null
    },

    // --- Facility Details ---
    async fetchFacility() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*, additional_photos')
        .eq('id', this.id)
        .single()

      if (!error) {
        this.facility = data
        if (typeof this.facility.additional_photos === 'string') {
          try {
            this.facility.additional_photos = JSON.parse(this.facility.additional_photos)
          } catch (e) {
            this.facility.additional_photos = []
          }
        } else if (!Array.isArray(this.facility.additional_photos)) {
          this.facility.additional_photos = []
        }
      } else console.error('Error fetching facility:', error.message)
    },

    // --- Ratings Logic ---
    async fetchRatings() {
      try {
        const { data: allRatings, error: allError } = await supabase
          .from('ratings')
          .select('rating_value, user_id')
          .eq('facility_id', this.id)

        if (allError) throw allError
        const ratings = allRatings || []
        const ratingValues = ratings.map((r) => r.rating_value)

        this.totalRatings = ratingValues.length
        this.averageRating =
          ratingValues.length > 0
            ? (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length).toFixed(1)
            : '0.0'

        this.userRating = 0
        if (this.currentUserId) {
          const userRatingRecord = ratings.find((r) => r.user_id === this.currentUserId)
          if (userRatingRecord) this.userRating = userRatingRecord.rating_value
        }
      } catch (err) {
        console.error('Error fetching ratings:', err.message)
      }
    },
    async rateFacility(star) {
      if (!this.currentUserId) {
        alert('Please log in to rate this facility.')
        return
      }
      try {
        this.userRating = star
        const { data: existing } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', this.id)
          .limit(1)

        const existingRatingId = existing?.[0]?.id || null
        if (existingRatingId) {
          await supabase.from('ratings').update({ rating_value: star }).eq('id', existingRatingId)
        } else {
          await supabase
            .from('ratings')
            .insert([{ facility_id: this.id, user_id: this.currentUserId, rating_value: star }])
        }

        await this.fetchRatings()
        await this.fetchReviews()
      } catch (err) {
        console.error('Error submitting rating:', err.message)
      }
    },

    // --- Reviews/Comments Logic ---
    async fetchReviews() {
      const { data, error } = await supabase
        .from('ratings')
        .select('id, user_id, rating_value, comment, created_at, profiles(full_name)')
        .eq('facility_id', this.id)

      if (!error) {
        this.reviews = data
          .filter((r) => r.comment && r.comment.trim() !== '')
          .map((r) => ({
            ...r,
            user_name: r.profiles?.full_name || 'Anonymous',
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else console.error('Error fetching reviews:', error)
    },
    async submitReview() {
      if (!this.newComment.trim() || !this.currentUserId)
        return alert('Comment cannot be empty, and you must be logged in.')

      this.submittingReview = true
      try {
        const { data: existing } = await supabase
          .from('ratings')
          .select('id, rating_value')
          .eq('user_id', this.currentUserId)
          .eq('facility_id', this.id)
          .limit(1)

        const existingRatingId = existing?.[0]?.id || null
        const ratingToUse = existing?.[0]?.rating_value || this.userRating || 5

        if (existingRatingId) {
          await supabase
            .from('ratings')
            .update({ comment: this.newComment.trim(), rating_value: ratingToUse })
            .eq('id', existingRatingId)
        } else {
          await supabase.from('ratings').insert([
            {
              user_id: this.currentUserId,
              facility_id: this.id,
              rating_value: ratingToUse,
              comment: this.newComment.trim(),
            },
          ])
        }

        this.newComment = ''
        await this.fetchRatings()
        await this.fetchReviews()
      } catch (err) {
        console.error('Error submitting review:', err.message)
        alert('Failed to submit review. Please try again.')
      } finally {
        this.submittingReview = false
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString()
    },

    // --- Booking/Scheduling Logic ---

    async fetchCustomSchedules() {
      try {
        if (!this.id) return
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
          .eq('type', 'custom')

        if (error) throw error
        this.customSchedules = data || []
      } catch (err) {
        console.error('Error fetching custom schedules:', err.message)
      }
    },
    async fetchSchedulesAndBookings() {
      this.loadingSchedules = true
      try {
        const { data: schedulesData } = await supabase
          .from('schedules')
          .select('*')
          .eq('facility_id', this.id)
          .eq('type', 'regular')
        this.schedules = schedulesData || []

        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('start_time, duration_hours, status')
          .eq('facility_id', this.id)
          .not('status', 'in', '("cancelled","rejected")')

        const activeBookings = Array.isArray(bookingsData) ? bookingsData : []
        const reservedSlots = new Set()
        activeBookings.forEach((booking) => {
          const start = new Date(booking.start_time)
          const duration = booking.duration_hours || 1

          for (let i = 0; i < duration; i++) {
            const reservedTime = new Date(start.getTime() + i * this.SLOT_DURATION_MINUTES * 60000)
            reservedSlots.add(reservedTime.toISOString())
          }
        })

        const generatedSlots = this.generateFutureSlots()

        this.availableSchedules = generatedSlots.filter(
          (slot) => !reservedSlots.has(slot.start_time),
        )

        this.groupAvailableSchedules()
      } catch (err) {
        console.error('Error fetching schedules or bookings:', err.message)
      } finally {
        this.loadingSchedules = false
      }
    },
    generateFutureSlots() {
      const slots = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

      for (let i = 0; i < this.DAYS_TO_GENERATE; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dayOfWeekName = days[date.getDay()]
        const dateString = date.toISOString().split('T')[0]

        const customSchedule = this.customSchedules.find(
          (s) => s.date === dateString && s.type === 'custom' && s.facility_id === this.id,
        )

        const regularSchedule = this.schedules.find(
          (s) => s.type === 'regular' && s.day_of_week === dayOfWeekName,
        )

        const effectiveSchedule = customSchedule || regularSchedule

        if (!effectiveSchedule || !effectiveSchedule.start_time || !effectiveSchedule.end_time)
          continue

        const [startHour, startMinute] = effectiveSchedule.start_time.split(':').map(Number)
        const [endHour, endMinute] = effectiveSchedule.end_time.split(':').map(Number)

        let currentSlotTime = new Date(date)
        currentSlotTime.setHours(startHour, startMinute, 0, 0)
        const closingTime = new Date(date)
        closingTime.setHours(endHour, endMinute, 0, 0)
        if (closingTime < currentSlotTime) closingTime.setDate(closingTime.getDate() + 1)

        while (currentSlotTime < closingTime) {
          if (currentSlotTime > new Date()) {
            slots.push({
              start_time: currentSlotTime.toISOString(),
              formatted_time: currentSlotTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }),
            })
          }
          currentSlotTime = new Date(currentSlotTime.getTime() + this.SLOT_DURATION_MINUTES * 60000)
        }
      }
      return slots
    },
    groupAvailableSchedules() {
      const grouped = {}
      this.availableSchedules.forEach((slot) => {
        const dateObj = new Date(slot.start_time)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        const dateKey = `${year}-${month}-${day}`

        if (!grouped[dateKey]) grouped[dateKey] = []
        grouped[dateKey].push(slot)
      })

      for (const dateKey in grouped) {
        grouped[dateKey].sort((a, b) => {
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        })
      }

      this.groupedSchedules = grouped
      this.availableDates = Object.keys(grouped)
    },
    
    /*isSlotDisabled(slotStartTime) {
      if (!this.selectedCustomSchedule) return false

      const slotTime = new Date(slotStartTime)
      const [customStartHour, customStartMinute] = this.selectedCustomSchedule.start_time
        .split(':')
        .map(Number)
      const [customEndHour, customEndMinute] = this.selectedCustomSchedule.end_time
        .split(':')
        .map(Number)

      const customStart = new Date(slotTime)
      customStart.setHours(customStartHour, customStartMinute, 0, 0)
      const customEnd = new Date(slotTime)
      customEnd.setHours(customEndHour, customEndMinute, 0, 0)

      return slotTime >= customStart && slotTime < customEnd
    },*/

    isSlotDisabled(slotStartTime) {
      // Check against cart items for this date
      const isInCart = this.cart.some(item => {
        if (item.date !== this.selectedDate) return false;
        const cartStart = new Date(item.start_time).getTime();
        const cartEnd = new Date(item.end_time).getTime();
        const slotTime = new Date(slotStartTime).getTime();
        // Disable the slot if it falls within any cart item's time range
        return slotTime >= cartStart && slotTime < cartEnd;
      });

      if (isInCart) return true;

      // Check custom schedule restriction (your original logic)
      if (!this.selectedCustomSchedule) return false;
      const slotTime = new Date(slotStartTime);
      const [customStartHour, customStartMinute] = this.selectedCustomSchedule.start_time.split(':').map(Number);
      const [customEndHour, customEndMinute] = this.selectedCustomSchedule.end_time.split(':').map(Number);
      const customStart = new Date(slotTime);
      customStart.setHours(customStartHour, customStartMinute, 0, 0);
      const customEnd = new Date(slotTime);
      customEnd.setHours(customEndHour, customEndMinute, 0, 0);
      return slotTime >= customStart && slotTime < customEnd;
    },

    allowedDates(date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const picked = new Date(date)
      picked.setHours(0, 0, 0, 0)

      return picked >= today
    },
    handleDateSelection() {
      this.selectedStartSlot = null
      this.selectedDuration = 1
      this.durationError = ''
    },
    autoSelectFirstAvailableDate() {
      if (this.availableDates.length > 0) this.selectedDate = this.availableDates[0]
    },
    handleTimeSlotSelection(startTime) {
      if (this.selectedStartSlot === startTime) {
        this.selectedStartSlot = null
        this.selectedDuration = 1
        this.durationError = ''
      } else {
        this.selectedStartSlot = startTime
        this.selectedDuration = 1
        this.durationError = ''
      }
    },
    isSlotSelected(slotTime) {
      return this.selectedStartSlot === slotTime
    },
    isDurationPossible(duration) {
      if (!this.selectedStartSlot || duration <= 0) return false
      return this._checkSlotAvailability(duration)
    },
    isDurationValid(duration) {
      const numDuration = parseInt(duration)
      if (
        !this.selectedStartSlot ||
        numDuration <= 0 ||
        isNaN(numDuration) ||
        numDuration > this.MAX_BOOKING_HOURS
      ) {
        return false
      }
      return this._checkSlotAvailability(numDuration)
    },
    validateDuration(duration) {
      this.durationError = ''
      const numDuration = parseInt(duration)

      if (!this.selectedStartSlot) return

      if (isNaN(numDuration) || numDuration <= 0) {
        this.durationError = 'Duration must be a positive number of hours.'
        return
      }

      if (numDuration > this.MAX_BOOKING_HOURS) {
        this.durationError = `Maximum booking duration is ${this.MAX_BOOKING_HOURS} hours.`
        return
      }

      if (!this._checkSlotAvailability(numDuration)) {
        this.durationError = `A ${numDuration}-hour booking starting at ${this.formattedSelectedTime} is not fully available. Please choose a shorter duration.`
      }
    },

    /*_checkSlotAvailability(duration) {
      const slotDurationMs = this.SLOT_DURATION_MINUTES * 60000
      const selectedStart = new Date(this.selectedStartSlot)
      const currentSlots = this.groupedSchedules[this.selectedDate] || []

      const availableStartTimes = new Set(currentSlots.map((slot) => slot.start_time))

      for (let i = 0; i < duration; i++) {
        const requiredTime = new Date(selectedStart.getTime() + i * slotDurationMs)
        const requiredTimeISO = requiredTime.toISOString()

        if (!availableStartTimes.has(requiredTimeISO)) {
          return false
        }
      }
      return true
    },*/

    _checkSlotAvailability(duration) {
      const slotDurationMs = this.SLOT_DURATION_MINUTES * 60000;
      const selectedStart = new Date(this.selectedStartSlot);
      const currentSlots = this.groupedSchedules[this.selectedDate] || [];

      // Build set of available times from schedule
      const availableStartTimes = new Set(currentSlots.map(slot => slot.start_time));

      // Remove times already occupied by cart items
      this.cart.forEach(item => {
        if (item.date !== this.selectedDate) return;
        const cartStart = new Date(item.start_time).getTime();
        const cartEnd = new Date(item.end_time).getTime();
        for (const timeISO of availableStartTimes) {
          const t = new Date(timeISO).getTime();
          if (t >= cartStart && t < cartEnd) {
            availableStartTimes.delete(timeISO);
          }
        }
      });

      for (let i = 0; i < duration; i++) {
        const requiredTime = new Date(selectedStart.getTime() + i * slotDurationMs);
        if (!availableStartTimes.has(requiredTime.toISOString())) return false;
      }
      return true;
    },

    // --- Payment Proof Methods ---
    openPaymentDialog() {
      this.paymentDialog = true
      this.paymentProofFile = null
      this.paymentProofPreview = null
      this.paymentProofError = ''
    },
    closePaymentDialog() {
      this.paymentDialog = false
      this.paymentProofFile = null
      this.paymentProofPreview = null
      this.paymentProofError = ''
    },
    handleFileSelect(files) {
      this.paymentProofError = ''

      const file = Array.isArray(files) ? files[0] : files

      if (!file) {
        this.paymentProofFile = null
        this.paymentProofPreview = null
        return
      }

      console.log('Selected file:', file)
      console.log('File type:', file.type)

      // Validate by extension instead of mime type (more reliable)
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
      const fileExtension = file.name.split('.').pop().toLowerCase()

      if (!allowedExtensions.includes(fileExtension)) {
        this.paymentProofError = 'Only JPG, JPEG, PNG, or WEBP images are allowed'
        this.paymentProofFile = null
        return
      }

      // Size limit (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.paymentProofError = 'File must be less than 5MB'
        this.paymentProofFile = null
        return
      }

      this.paymentProofFile = file

      // Preview
      const reader = new FileReader()
      reader.onload = (e) => {
        this.paymentProofPreview = e.target.result
      }
      reader.readAsDataURL(file)
    },
    async uploadPaymentProof(userId, bookingId) {
      if (!this.paymentProofFile) {
        console.error('No file selected')
        return null
      }

      try {
        this.uploadingPaymentProof = true

        console.log('Uploading file:', this.paymentProofFile)

        const file = this.paymentProofFile
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error } = await supabase.storage.from('booking-documents').upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

        if (error) {
          console.error('Upload error:', error)
          throw error
        }

        const { data } = supabase.storage.from('booking-documents').getPublicUrl(filePath)

        console.log('Uploaded successfully:', data.publicUrl)

        return data.publicUrl
      } catch (error) {
        console.error('Storage Upload Failed:', error.message)
        alert('Upload failed: ' + error.message)
        return null
      } finally {
        this.uploadingPaymentProof = false
      }
    },

    /*async submitBookingWithPayment() {
      if (!this.paymentProofFile) {
        this.paymentProofError = 'Please upload proof of payment before submitting'
        return
      }

      this.loading = true

      const start = new Date(this.selectedStartSlot)
      const durationInMinutes = this.selectedDuration * this.SLOT_DURATION_MINUTES
      const durationInMs = durationInMinutes * 60000
      const endTimeMs = start.getTime() + durationInMs

      const calculatedStartTime = this.selectedStartSlot
      const calculatedEndTime = new Date(endTimeMs).toISOString()

      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) {
          alert('Please log in to make a booking.')
          this.loading = false
          return
        }

        // Create booking first to get booking ID
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .insert([
            {
              facility_id: this.facility.id,
              booking_date: this.selectedDate,
              start_time: calculatedStartTime,
              end_time: calculatedEndTime,
              duration_hours: this.selectedDuration,
              total_cost: this.totalBookingCost,
              status: 'pending',
              user_id: user.id,
            },
          ])
          .select()
          .single()

        if (bookingError) throw bookingError

        // Upload payment proof
        const paymentProofUrl = await this.uploadPaymentProof(user.id, bookingData.id)

        // Update booking with payment proof URL
        if (paymentProofUrl) {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ payment_proof_url: paymentProofUrl })
            .eq('id', bookingData.id)

          if (updateError) console.error('Error updating payment proof:', updateError)
        }

        // Close payment dialog
        this.paymentDialog = false

        // Populate and Show Receipt Dialog
        this.receiptDetails = {
          date: this.selectedDate,
          startTime: this.formattedSelectedTime,
          endTime: this.formattedEndTime,
          duration: this.selectedDuration,
          cost: this.totalBookingCost,
          paymentProofUrl: paymentProofUrl,
        }
        this.receiptDialog = true

        // Reset state and refresh data
        this.selectedStartSlot = null
        this.selectedDuration = 1
        this.durationError = ''
        this.paymentProofFile = null
        this.paymentProofPreview = null
        await this.fetchSchedulesAndBookings()
        this.autoSelectFirstAvailableDate()
      } catch (err) {
        console.error('Booking error:', err.message)
        alert('Failed to book facility. Please try again.')
      } finally {
        this.loading = false
      }
    },*/

    // --- Updated Multi-Booking Submission with Single Payment Proof ---
    async submitBookingWithPayment() {
      if (!this.paymentProofFile) {
        this.paymentProofError = 'Please upload proof of payment before submitting'
        return
      }

      this.loading = true

      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) {
          alert('Please log in to make a booking.')
          this.loading = false
          return
        }

        // 1. Upload the payment proof FIRST (since it's one receipt for all)
        // We use 'bulk' as a temporary label for the ID during upload
        const paymentProofUrl = await this.uploadPaymentProof(user.id, 'bulk-' + Date.now())

        if (!paymentProofUrl) {
          throw new Error('Payment proof upload failed.')
        }

        // 2. Loop through the CART and insert each booking
        // This replaces the single ".insert()" you had before
        for (const item of this.cart) {
          const { error: bookingError } = await supabase
            .from('bookings')
            .insert([
              {
                facility_id: this.facility.id,
                booking_date: item.date,
                start_time: item.start_time,
                end_time: item.end_time,
                duration_hours: item.duration,
                total_cost: item.cost,
                status: 'pending',
                user_id: user.id,
                payment_proof_url: paymentProofUrl // Attach the same URL to all
              },
            ])

          if (bookingError) throw bookingError
        }

        // 3. Close payment and cart dialogs
        this.paymentDialog = false
        this.cartDialog = false

        // 4. Populate and Show Receipt Dialog 
        // We use cartTotal here so the receipt shows the full amount paid
        this.receiptDetails = {
          date: 'Multiple Dates', 
          startTime: 'Multiple Slots',
          endTime: '',
          duration: this.cart.reduce((sum, i) => sum + i.duration, 0),
          cost: this.cartTotal, 
          paymentProofUrl: paymentProofUrl,
        }
        this.receiptDialog = true

        // 5. Reset state and refresh
        this.cart = [] // Clear the bucket
        this.selectedStartSlot = null
        this.selectedDuration = 1
        this.paymentProofFile = null
        this.paymentProofPreview = null
        
        await this.fetchSchedulesAndBookings()
        
      } catch (err) {
        console.error('Booking error:', err.message)
        alert('Failed to book facility. Please try again.')
      } finally {
        this.loading = false
      }
    },

    openPaymentProofZoom() {
      this.paymentProofZoomDialog = true
    },

    // --- Zoom/Carousel ---
    openZoom(photoUrl) {
      const index = this.allPhotos.findIndex((p) => p === photoUrl)
      this.zoomCarouselIndex = index >= 0 ? index : 0
      this.zoomDialog = true
    },
  },
}
</script>

<style scoped>
.calendar-border {
  border: 1px solid #e0e0e0 !important;
  overflow: hidden !important;
  width: 100% !important;
}

.calendar-border >>> .v-picker__body {
  width: 100% !important;
}

.calendar-border:focus-within {
  border-color: #2196f3 !important;
}

.calendar-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .calendar-container {
    max-width: 100%;
  }
}

@media (min-width: 601px) and (max-width: 959px) {
  .calendar-container {
    max-width: 400px;
    margin: 0 auto 20px auto;
  }
}

@media (min-width: 960px) {
  .calendar-container {
    max-width: 450px;
    margin: 0 auto 24px auto;
  }
}

.calendar-border >>> .v-date-picker-table {
  height: auto !important;
  padding: 12px !important;
}

.gradient-background {
  background: linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6));
  min-height: 100vh;
  padding: 20px;
}
</style>
