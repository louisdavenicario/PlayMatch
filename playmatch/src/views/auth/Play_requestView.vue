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
        Playmate Requests
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="dialog = true" color="white">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container>
        <v-card class="pa-4 mb-4" rounded="lg" elevation="1">
          <v-text-field
            v-model="search"
            label="Search by Sport or Location"
            prepend-inner-icon="mdi-magnify"
            clearable
            solo
            dense
            hide-details
          ></v-text-field>
        </v-card>

        <v-card class="pa-3 mb-4" rounded="lg" elevation="1">
          <v-tabs v-model="mainTab" background-color="transparent" grow>
            <v-tab>Active Requests</v-tab>
            <v-tab>Recently Played</v-tab>
          </v-tabs>

          <div v-if="mainTab === 0" class="pt-3">
            <v-chip-group
              v-model="matchTypeFilter"
              active-class="blue white--text"
              column
              mandatory
            >
              <v-chip value="all"> All Requests </v-chip>
              <v-chip value="individual" color="light-blue" text-color="white">
                Seeking Players
              </v-chip>
              <v-chip value="team" color="deep-purple" text-color="white"> Opponent Teams </v-chip>
            </v-chip-group>
          </div>
        </v-card>

        <div v-if="mainTab === 0">
          <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="blue"></v-progress-circular>
            <p class="mt-2 grey--text">Loading playmate requests...</p>
          </div>

          <div v-else-if="filteredRequests.length === 0" class="text-center py-10">
            <v-icon large color="grey lighten-1">mdi-account-group-outline</v-icon>
            <h3 class="mt-2 text-h6 grey--text">
              No active requests found for your current filters.
            </h3>
            <p class="grey--text">Be the first to create a playmate request!</p>
            <v-btn color="blue" dark class="mt-4" rounded @click="dialog = true">
              <v-icon left>mdi-plus-circle-outline</v-icon> Create Request
            </v-btn>
          </div>

          <v-row v-else>
            <v-col cols="12" v-for="request in filteredRequests" :key="request.id">
              <v-card class="pa-4" rounded="lg" elevation="2">
                <div class="d-flex align-center">
                  <v-avatar
                    color="blue lighten-4"
                    size="50"
                    class="mr-4"
                    style="cursor: pointer"
                    @click="viewUserProfile(request.creator_id)"
                  >
                    <span class="white--text font-weight-bold">{{ request.creator_name[0] }}</span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-bold text-subtitle-1">
                      {{ request.sport }}
                      <v-chip
                        x-small
                        :color="
                          request.status === 'open'
                            ? 'green'
                            : request.status === 'canceled'
                              ? 'red'
                              : 'orange'
                        "
                        dark
                        class="ml-2"
                      >
                        {{ request.status }}
                      </v-chip>
                      <v-chip
                        x-small
                        :color="request.match_type === 'team' ? 'deep-purple' : 'light-blue'"
                        dark
                        class="ml-1"
                      >
                        {{ request.match_type === 'team' ? 'Team Match' : 'Seeking Players' }}
                      </v-chip>
                    </div>
                    <div class="text-caption grey--text">
                      <span
                        style="cursor: pointer; text-decoration: underline"
                        class="blue--text"
                        @click="viewUserProfile(request.creator_id)"
                      >
                        {{ request.creator_name }}
                      </span>
                      wants to play at {{ request.location }}
                    </div>
                  </div>
                </div>

                <v-divider class="my-3"></v-divider>

                <div class="d-flex justify-space-between text-caption">
                  <span class="d-flex align-center">
                    <v-icon small class="mr-1">mdi-calendar-range</v-icon>
                    {{ formatDate(request.date) }}
                  </span>
                  <span class="d-flex align-center">
                    <v-icon small class="mr-1">mdi-clock-time-four-outline</v-icon>
                    {{ formatTime(request.start_time) }} - {{ formatTime(request.end_time) }}
                  </span>

                  <span class="d-flex align-center">
                    <v-icon small class="mr-1">{{
                      request.match_type === 'team' ? 'mdi-trophy' : 'mdi-account-group'
                    }}</v-icon>
                    {{
                      request.match_type === 'team'
                        ? `Seeking Team (Max ${request.max_joins} players)`
                        : `${request.joins_count} / ${request.max_joins} joined`
                    }}
                  </span>
                </div>

                <p class="text-body-2 mt-3 mb-1 grey--text text-truncate">
                  {{ request.description || 'No specific notes provided.' }}
                </p>

                <v-card
                  v-if="request.joins_count > 0 || request.match_type === 'team'"
                  flat
                  class="mt-3 pa-2 rounded-sm"
                  :class="
                    request.match_type === 'team' ? 'deep-purple lighten-5' : 'light-blue lighten-5'
                  "
                >
                  <div
                    class="text-body-2"
                    :class="
                      request.match_type === 'team'
                        ? 'deep-purple--text text-darken-2'
                        : 'light-blue--text text-darken-2'
                    "
                  >
                    <span v-if="request.match_type === 'team'">
                      <span class="font-weight-bold">{{ request.creator_name }} Team</span>
                      vs.
                      <span v-if="request.joiners && request.joiners.length > 0">
                        <strong
                          class="mx-1"
                          style="cursor: pointer; text-decoration: underline"
                          @click="viewUserProfile(request.joiners[0].user_id)"
                        >
                          {{ request.joiners[0].full_name }} Team
                        </strong>
                        (Opponent Contact)
                      </span>
                      <span v-else class="grey--text font-italic">No opponent yet.</span>
                    </span>

                    <span v-else class="d-flex flex-column">
                      <span class="font-weight-medium mb-1">Joiners:</span>
                      <span
                        v-for="(joiner, index) in request.joiners"
                        :key="index"
                        class="text-body-2"
                      >
                        <span
                          class="blue--text"
                          style="cursor: pointer; text-decoration: underline"
                          @click="viewUserProfile(joiner.user_id)"
                        >
                          {{ joiner.full_name }}
                        </span>
                      </span>
                      <span v-if="request.joins_count === 0" class="grey--text font-italic">
                        Be the first to join!
                      </span>
                    </span>
                  </div>
                </v-card>

                <v-card-actions class="pa-0 pt-2">
                  <v-btn
                    small
                    :color="
                      isJoined(request.id)
                        ? 'red'
                        : isCreator(request.creator_id)
                          ? 'orange darken-1'
                          : request.match_type === 'team'
                            ? 'deep-purple'
                            : 'blue'
                    "
                    dark
                    rounded
                    block
                    :disabled="request.status !== 'open' && !isCreator(request.creator_id)"
                    @click="handleJoinToggle(request)"
                  >
                    {{
                      isCreator(request.creator_id)
                        ? 'Manage'
                        : isJoined(request.id)
                          ? 'Withdraw'
                          : request.status === 'full' && request.match_type === 'individual'
                            ? 'Full'
                            : request.match_type === 'team'
                              ? 'Accept Challenge'
                              : 'Join'
                    }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <div v-if="mainTab === 1">
          <v-alert
            type="info"
            class="mt-4 mb-4"
            variant="tonal"
            title="Rating Window"
            text="Matches that ended in the last 24 hours are displayed here for rating. The rating window closes 7 days after the match ends."
            colored-border
            border="left"
            prominent
          >
          </v-alert>

          <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="blue"></v-progress-circular>
            <p class="mt-2 grey--text">Loading recently played...</p>
          </div>

          <div
            v-else-if="!finishedPlaymates || finishedPlaymates.length === 0"
            class="text-center py-10"
          >
            <v-icon large color="grey lighten-1">mdi-history</v-icon>
            <h3 class="mt-2 text-h6 grey--text">No recently played matches found.</h3>
            <p class="grey--text">Go play some sports!</p>
          </div>

          <v-card
            v-for="play in finishedPlaymates"
            :key="play.id"
            class="mb-3 pa-4"
            rounded="lg"
            elevation="2"
            color="blue-grey lighten-5"
          >
            <div class="font-weight-bold text-h6 primary--text mb-1">
              {{ play.sport }} - {{ play.location }}
            </div>
            <div class="text-caption grey--text mb-3">
              Ended: {{ formatDate(play.date) }} at {{ formatTime(play.end_time) }}
            </div>

            <v-divider class="mb-3"></v-divider>

            <div class="text-body-2 font-weight-medium mb-2">Rate Your Playmates:</div>

            <v-chip-group column>
              <v-chip
                v-for="p in play.players"
                :key="p.user_id"
                class="ma-1"
                :color="isRatingWindowExpired(play.end_time_ts) ? 'grey' : 'blue lighten-1'"
                :text-color="isRatingWindowExpired(play.end_time_ts) ? 'grey darken-3' : 'white'"
                @click="openRateDialog(p, play.id)"
                :disabled="isRatingWindowExpired(play.end_time_ts)"
              >
                {{ p.full_name }}
                <v-icon right x-small>{{
                  isRatingWindowExpired(play.end_time_ts) ? 'mdi-close-octagon' : 'mdi-star-face'
                }}</v-icon>
              </v-chip>
            </v-chip-group>

            <div
              class="text-caption mt-2 red--text font-weight-medium"
              v-if="isRatingWindowExpired(play.end_time_ts)"
            >
              <v-icon small color="red" class="mr-1">mdi-alert-circle-outline</v-icon>
              Rating window for this match has expired.
            </div>
          </v-card>
        </div>
      </v-container>
    </v-main>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card rounded="lg">
        <v-card-title class="text-h5 blue white--text">Create New Request</v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-select
              v-model="newRequest.sport"
              :items="sportChoices"
              label="Sport"
              :rules="[(v) => !!v || 'Sport is required']"
              required
              class="mb-3"
              @change="handleSportChange"
            ></v-select>

            <v-text-field
              v-if="isSportOther"
              v-model="otherSportText"
              label="Specify Other Sport"
              :rules="[(v) => !!v || 'Custom sport is required']"
              required
              class="mt-0 mb-3"
            ></v-text-field>

            <v-radio-group
              v-model="newRequest.match_type"
              label="What are you looking for?"
              :rules="[(v) => !!v || 'Match type is required']"
              required
              row
              class="mt-0 mb-3"
            >
              <v-radio label="Individual Players" value="individual"></v-radio>
              <v-radio label="An Opponent Team" value="team"></v-radio>
            </v-radio-group>
            <v-select
              v-model="newRequest.location"
              :items="locationChoices"
              label="Location (Facility or Area Name)"
              :rules="[(v) => !!v || 'Location is required']"
              :loading="facilityLoading"
              required
              clearable
              class="mb-3"
              @change="handleLocationChange"
            ></v-select>

            <v-text-field
              v-if="isLocationOther"
              v-model="otherLocationText"
              label="Specify Other Location"
              :rules="[(v) => !!v || 'Custom location is required']"
              required
              class="mt-0 mb-3"
            ></v-text-field>

            <v-text-field
              v-model.number="newRequest.max_joins"
              :label="
                newRequest.match_type === 'team'
                  ? 'Opponent Team Size (e.g., 5 for 5v5)'
                  : 'Max Participants (excluding creator)'
              "
              type="number"
              min="1"
              :rules="[
                (v) => !!v || 'Max participants is required',
                (v) => v >= 1 || 'Must be at least 1',
              ]"
              required
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="newRequest.date"
              label="Date"
              type="date"
              :min="todayDate"
              :rules="[(v) => !!v || 'Date is required']"
              required
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="newRequest.start_time"
              label="Start Time"
              type="time"
              :rules="[(v) => !!v || 'Start time is required']"
              required
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="newRequest.end_time"
              label="End Time"
              type="time"
              :rules="[
                (v) => !!v || 'End time is required',
                (v) =>
                  !newRequest.start_time ||
                  v > newRequest.start_time ||
                  'End time must be after start time',
              ]"
              required
              class="mb-3"
            ></v-text-field>

            <v-textarea
              v-model="newRequest.description"
              label="Description (e.g., skill level, rules, duration)"
              rows="2"
              class="mb-3"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="dialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="createRequest" :loading="creating">
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="manageDialog" max-width="600px">
      <v-card rounded="lg">
        <v-card-title class="text-h5 orange darken-1 white--text">Manage Your Request</v-card-title>
        <v-card-text class="pt-4">
          <v-tabs v-model="manageTab" background-color="transparent" color="orange darken-1">
            <v-tab>{{
              selectedRequest.match_type === 'team'
                ? 'Opponent Status'
                : `Participants (${participants.length})`
            }}</v-tab>
            <v-tab>Edit Details</v-tab>
          </v-tabs>

          <v-tabs-items v-model="manageTab" class="mt-4">
            <v-tab-item>
              <v-list dense>
                <v-list-item v-if="participants.length === 1">
                  <v-list-item-content>
                    <v-list-item-title class="grey--Text">{{
                      selectedRequest.match_type === 'team'
                        ? 'No opponent team has accepted the challenge yet.'
                        : 'No players have joined yet.'
                    }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item
                  v-for="p in participants"
                  :key="p.user_id"
                  style="cursor: pointer"
                  @click="viewUserProfile(p.user_id)"
                >
                  <v-list-item-avatar color="grey lighten-3" size="40">
                    <span class="font-weight-bold">{{ p.full_name[0] }}</span>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-medium">{{
                      p.full_name
                    }}</v-list-item-title>
                    <v-list-item-subtitle v-if="p.user_id === currentUserId">
                      (You - Creator)
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-else-if="selectedRequest.match_type === 'team'">
                      (Opponent Team Contact)
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>

              <v-alert v-if="selectedRequest.status === 'full'" type="success" class="mt-4" dense>
                {{
                  selectedRequest.match_type === 'team'
                    ? 'This match has been accepted!'
                    : 'This request is **FULL**'
                }}
                ({{ selectedRequest.joins_count }} / {{ selectedRequest.max_joins }}).
              </v-alert>
            </v-tab-item>

            <v-tab-item>
              <v-form ref="editForm" v-if="selectedRequest">
                <v-text-field
                  :value="
                    selectedRequest.match_type === 'team'
                      ? 'Seeking Opponent Team'
                      : 'Seeking Individual Players'
                  "
                  label="Match Type"
                  readonly
                  class="mb-3"
                  prepend-icon="mdi-information-outline"
                ></v-text-field>

                <v-text-field
                  v-model="selectedRequest.sport"
                  label="Sport"
                  :rules="[(v) => !!v || 'Sport is required']"
                  required
                  class="mb-3"
                  :readonly="
                    !sportChoices.includes(selectedRequest.sport) &&
                    !baseSports.includes(selectedRequest.sport)
                  "
                  :hint="
                    !baseSports.includes(selectedRequest.sport)
                      ? 'This is a custom sport and can be edited here.'
                      : ''
                  "
                  persistent-hint
                ></v-text-field>

                <v-text-field
                  v-model="selectedRequest.location"
                  label="Location"
                  :rules="[(v) => !!v || 'Location is required']"
                  required
                  class="mb-3"
                ></v-text-field>

                <v-text-field
                  v-model.number="selectedRequest.max_joins"
                  :label="
                    selectedRequest.match_type === 'team'
                      ? 'Opponent Team Size (e.g., 5 for 5v5)'
                      : 'Max Participants (excluding creator)'
                  "
                  type="number"
                  min="1"
                  :rules="[
                    (v) => !!v || 'Max participants is required',
                    (v) => v >= 1 || 'Must be at least 1',
                  ]"
                  required
                  class="mb-3"
                ></v-text-field>

                <v-text-field
                  v-model="selectedRequest.date"
                  label="Date"
                  type="date"
                  :rules="[(v) => !!v || 'Date is required']"
                  required
                  class="mb-3"
                ></v-text-field>

                <v-text-field
                  v-model="selectedRequest.start_time"
                  label="Start Time"
                  type="time"
                  :rules="[(v) => !!v || 'Start time is required']"
                  required
                  class="mb-3"
                ></v-text-field>

                <v-text-field
                  v-model="selectedRequest.end_time"
                  label="End Time"
                  type="time"
                  :rules="[
                    (v) => !!v || 'End time is required',
                    (v) =>
                      !selectedRequest.start_time ||
                      v > selectedRequest.start_time ||
                      'End time must be after start time',
                  ]"
                  required
                  class="mb-3"
                ></v-text-field>

                <v-textarea
                  v-model="selectedRequest.description"
                  label="Description"
                  rows="2"
                  class="mb-3"
                ></v-textarea>
              </v-form>
              <v-alert type="warning" dense outlined v-else>
                Error loading request details.
              </v-alert>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>

        <v-card-actions class="d-flex justify-space-between pa-4 pt-0">
          <v-btn
            color="red darken-1"
            text
            @click="cancelRequest"
            :disabled="selectedRequest.status === 'canceled'"
          >
            <v-icon left>mdi-cancel</v-icon>
            {{ selectedRequest.status === 'canceled' ? 'Canceled' : 'Cancel Request' }}
          </v-btn>
          <div>
            <v-btn color="grey" text @click="manageDialog = false">Close</v-btn>
            <v-btn
              color="orange darken-1"
              dark
              @click="editRequest"
              :loading="creating"
              :disabled="manageTab === 0 || selectedRequest.status === 'canceled'"
            >
              <v-icon left>mdi-content-save</v-icon> Save Edits
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="profileDialog" max-width="480px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center mt-4">
          <v-avatar size="48" class="mr-3" color="blue lighten-4">
            <span class="white--text font-weight-bold">{{ profileInitials }}</span>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ profile.full_name || 'Profile' }}</div>
            <div class="text-caption grey--text">{{ profile.role || '' }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeProfileDialog"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text>
          <div v-if="profileLoading" class="text-center py-4">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>

          <div v-else-if="!profileFound" class="text-center py-6 grey--text">
            Profile not found.
          </div>

          <div v-else>
            <v-list dense>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text-caption">Full Name</v-list-item-title>
                  <v-list-item-subtitle>{{ profile.full_name || '—' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text-caption">Phone</v-list-item-title>
                  <v-list-item-subtitle>{{ profile.phone_number || '—' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text-caption"
                    >Average Rating</v-list-item-title
                  >
                  <v-list-item-subtitle class="mt-2">
                    <div class="d-flex align-center">
                      <v-rating
                        :value="averageRating"
                        readonly
                        dense
                        half-increments
                        color="yellow darken-3"
                        background-color="grey lighten-2"
                        size="18"
                      ></v-rating>
                      <span class="ml-2 font-weight-bold"> ({{ profileRatings.length }}) </span>
                      <span class="ml-2 font-weight-bold">
                        {{ averageRating ? averageRating.toFixed(1) : 'N/A' }}
                      </span>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text-caption">Address</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ fullAddress || '—' }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text-caption"
                    >Last Updated</v-list-item-title
                  >
                  <v-list-item-subtitle>
                    {{ profile.updated_at ? new Date(profile.updated_at).toLocaleString() : '—' }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="grey" @click="closeProfileDialog">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="ratingDialog" max-width="400px">
      <v-card rounded="lg">
        <v-card-title class="blue darken-1 white--text">Rate Player</v-card-title>
        <v-card-text class="pt-4">
          <p class="text-subtitle-1 mb-2 font-weight-medium">
            Rating: {{ selectedPlayerToRate ? selectedPlayerToRate.full_name : '' }}
          </p>
          <v-rating v-model="newRating.rating" length="5" color="amber" large></v-rating>
          <v-textarea
            v-model="newRating.comment"
            label="Comment (optional)"
            class="mt-3"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="ratingDialog = false">Cancel</v-btn>
          <v-btn color="blue" dark @click="submitRating" :disabled="newRating.rating === 0">
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { supabase } from '@/supabaseClient'

export default {
  name: 'Play_requestView',
  data: () => ({
    loading: false,
    creating: false,
    dialog: false, // For Create Request
    manageDialog: false, // For Manage Request
    manageTab: 0, // 0 for Participants, 1 for Edit
    valid: true,
    search: '',
    matchTypeFilter: 'all',
    currentUserId: null,
    playmateRequests: [],
    userJoins: [],
    participants: [],
    selectedRequest: {},
    baseSports: ['Badminton', 'Basketball', 'Tennis', 'Volleyball', 'Soccer'],
    otherSportText: '',
    facilities: [],
    facilityLoading: false,
    otherLocationText: '',
    newRequest: {
      sport: null,
      location: '',
      max_joins: 4,
      date: '',
      start_time: '',
      end_time: '',
      description: '',
      match_type: 'individual',
    },
    todayDate: new Date().toISOString().split('T')[0],

    // DATA PROPERTIES FOR TABS AND RATING
    mainTab: 0, // 0 for Active Requests, 1 for Recently Played
    finishedPlaymates: [],
    ratingDialog: false,
    selectedPlayerToRate: null,
    newRating: {
      rating: 0,
      comment: '',
      request_id: null,
      rated_user_id: null,
    },
    existingRatingId: null,
    profileDialog: false,
    profileLoading: false,
    profileFound: false,
    profile: {
      id: null,
      full_name: null,
      role: null,
      address: null,
      city: null,
      zip_code: null,
      phone_number: null,
      updated_at: null,
    },
    profileRatings: [],
    statusCheckTimer: null,
  }),
  computed: {
    // Calculates the average rating for the viewed user
    averageRating() {
      if (!this.profileRatings.length) {
        return 0
      }
      const sum = this.profileRatings.reduce((acc, rating) => acc + rating.rating, 0)
      return sum / this.profileRatings.length
    },
    sportChoices() {
      return [...this.baseSports, 'Other (Specify)']
    },
    isSportOther() {
      return this.newRequest.sport === 'Other (Specify)'
    },
    locationChoices() {
      const names = this.facilities.map((f) => f.facility_name)
      return [...names, 'Other (Specify)']
    },
    isLocationOther() {
      return this.newRequest.location === 'Other (Specify)'
    },
    filteredRequests() {
      const searchTerm = this.search ? this.search.toLowerCase() : ''
      const matchTypeFiltered = this.playmateRequests.filter((request) => {
        if (this.matchTypeFilter === 'all') return true
        return request.match_type === this.matchTypeFilter
      })

      return matchTypeFiltered.filter(
        (request) =>
          (request.sport || '').toLowerCase().includes(searchTerm) ||
          (request.location || '').toLowerCase().includes(searchTerm) ||
          (request.creator_name || '').toLowerCase().includes(searchTerm),
      )
    },
    profileInitials() {
      if (!this.profile.full_name) return ''
      return this.profile.full_name
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    },
    fullAddress() {
      const parts = []
      if (this.profile.address) parts.push(this.profile.address)
      if (this.profile.city) parts.push(this.profile.city)
      if (this.profile.zip_code) parts.push(this.profile.zip_code)
      return parts.join(', ')
    },
  },
  watch: {
    mainTab(newVal) {
      // Fetch data when the tab is switched
      if (newVal === 1) {
        this.fetchFinishedPlaymates()
      } else if (newVal === 0) {
        this.fetchRequestsAndJoins()
      }
    },
  },
  async mounted() {
    await this.getCurrentUser()
    this.fetchRequestsAndJoins()
    this.fetchFacilities() // Call fetchFinishedPlaymates on initial load so data is ready when user switches tab
    this.fetchFinishedPlaymates()
    this.startStatusCheckTimer()
  },
  beforeUnmount() {
    this.stopStatusCheckTimer()
  },
  methods: {
    // UTILITY TO CHECK IF REQUEST IS PAST END_TIME
    isPastEndTime(date, endTime) {
      if (!date || !endTime) return false // Combines date and time to create a full datetime object
      const requestEnd = new Date(`${date}T${endTime}`) // Add a 30-second buffer to account for minor clock discrepancies
      requestEnd.setSeconds(requestEnd.getSeconds() + 30)
      return new Date() > requestEnd
    },

    startStatusCheckTimer() {
      this.statusCheckTimer = setInterval(async () => {
        const beforeCount = this.playmateRequests.length // This removes expired requests from the Active tab list

        this.playmateRequests = this.playmateRequests.filter((request) => {
          return !this.isPastEndTime(request.date, request.end_time)
        })

        const afterCount = this.playmateRequests.length

        if (beforeCount !== afterCount) {
          await this.fetchRequestsAndJoins()
          await this.fetchFinishedPlaymates()
        }
      }, 30000) // every 30 seconds
    },

    stopStatusCheckTimer() {
      if (this.statusCheckTimer) {
        clearInterval(this.statusCheckTimer)
        this.statusCheckTimer = null
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    },
    formatTime(timeString) {
      if (!timeString) return ''
      const [hours, minutes] = timeString.split(':')
      const tempDate = new Date()
      tempDate.setHours(hours, minutes)
      return tempDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    },

    isJoined(requestId) {
      return this.userJoins.includes(requestId)
    },
    isCreator(creatorId) {
      return this.currentUserId === creatorId
    },
    handleSportChange(value) {
      if (value !== 'Other (Specify)') {
        this.otherSportText = ''
      }
    },
    handleLocationChange(value) {
      if (value !== 'Other (Specify)') {
        this.otherLocationText = ''
      }
    },

    isRatingWindowExpired(endTimeTimestamp) {
      if (!endTimeTimestamp) return false
      const expiryDate = new Date(endTimeTimestamp)
      expiryDate.setDate(expiryDate.getDate() + 7)
      return new Date() > expiryDate
    }, //  Fetches all ratings for a given user ID

    async fetchUserRatings(userId) {
      if (!userId) {
        this.profileRatings = []
        return
      }
      try {
        const { data, error } = await supabase
          .from('playmate_ratings')
          .select('rating')
          .eq('rated_user_id', userId)

        if (error) throw error

        this.profileRatings = data || []
      } catch (err) {
        console.error('Error fetching user ratings:', err.message)
        this.profileRatings = []
      }
    }, // Function to check if a rating already exists

    async checkExistingRating(raterId, ratedUserId, requestId) {
      try {
        const { data, error } = await supabase
          .from('playmate_ratings')
          .select('id, rating, comment')
          .eq('rater_id', raterId)
          .eq('rated_user_id', ratedUserId)
          .eq('request_id', requestId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means 'No rows found'
          throw error
        }
        return data
      } catch (err) {
        console.error('Error checking existing rating:', err)
        return null
      }
    },

    async openRateDialog(player, requestId) {
      const request = this.finishedPlaymates.find((p) => p.id === requestId)

      if (this.isRatingWindowExpired(request?.end_time_ts)) {
        alert('The rating window for this match has expired.')
        return
      }

      if (!this.currentUserId) {
        alert('You must be logged in to submit a rating.')
        return
      } // 1. Check for existing rating

      const existingRating = await this.checkExistingRating(
        this.currentUserId,
        player.user_id,
        requestId,
      )

      this.selectedPlayerToRate = player
      this.newRating.request_id = requestId
      this.newRating.rated_user_id = player.user_id // 2. Populate state based on existing rating

      if (existingRating) {
        this.existingRatingId = existingRating.id
        this.newRating.rating = existingRating.rating
        this.newRating.comment = existingRating.comment
      } else {
        this.existingRatingId = null
        this.newRating.rating = 0
        this.newRating.comment = ''
      }

      this.ratingDialog = true
    },

    async submitRating() {
      if (this.newRating.rating === 0) {
        alert('Please select a star rating.')
        return
      }
      if (!this.selectedPlayerToRate || !this.newRating.request_id || !this.currentUserId) {
        alert('Rating context missing. Please try again.')
        return
      }

      this.creating = true
      try {
        const ratingPayload = {
          rating: this.newRating.rating,
          comment: this.newRating.comment,
        }

        let query
        let successMessage

        if (this.existingRatingId) {
          // RATING EXISTS: Perform UPDATE
          query = supabase
            .from('playmate_ratings')
            .update(ratingPayload)
            .eq('id', this.existingRatingId)
          successMessage = `Successfully updated rating for ${this.selectedPlayerToRate.full_name}!`
        } else {
          // NEW RATING: Perform INSERT
          const insertPayload = {
            ...ratingPayload,
            request_id: this.newRating.request_id,
            rater_id: this.currentUserId,
            rated_user_id: this.newRating.rated_user_id,
          }
          query = supabase.from('playmate_ratings').insert([insertPayload])
          successMessage = `Successfully rated ${this.selectedPlayerToRate.full_name}!`
        }

        const { error } = await query

        if (error) throw error

        alert(successMessage)
        this.ratingDialog = false
        this.fetchFinishedPlaymates() // Refresh list to update state
      } catch (err) {
        alert(`Failed to submit/update rating: ${err.message}`)
      } finally {
        this.creating = false
        this.existingRatingId = null // Clean up state
      }
    },

    async fetchFinishedPlaymates() {
      if (!this.currentUserId) return

      try {
        const { data: requests, error } = await supabase.rpc('get_past_playmate_matches', {
          user_id_in: this.currentUserId,
        })

        if (error) throw error

        const now = new Date()
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        const validFinished = (requests || [])
          .map((req) => {
            const endDateTime = req.end_time_ts
              ? new Date(req.end_time_ts)
              : new Date(`${req.date}T${req.end_time}`)

            return {
              ...req,
              combined_end_time: endDateTime,
              end_time_ts: req.end_time_ts || endDateTime.toISOString(),
            }
          }) // Filter for display: ended AND within last 24 hours
          .filter(
            (req) => req.combined_end_time <= now && req.combined_end_time >= twentyFourHoursAgo,
          )
          .sort((a, b) => b.combined_end_time - a.combined_end_time)

        const finishedIds = validFinished.map((r) => r.id)

        if (!finishedIds.length) {
          this.finishedPlaymates = []
          return
        }

        const { data: joins } = await supabase
          .from('playmate_joins')
          .select('request_id, user_id, user:user_id(full_name)')
          .in('request_id', finishedIds)

        const joinsByRequest = (joins || []).reduce((acc, j) => {
          if (!acc[j.request_id]) acc[j.request_id] = []
          if (j.user_id !== this.currentUserId) {
            acc[j.request_id].push({
              user_id: j.user_id,
              full_name: j.user?.full_name || 'Anonymous Player',
            })
          }
          return acc
        }, {}) // Fetch existing ratings for these matches

        const { data: existingRatings } = await supabase
          .from('playmate_ratings')
          .select('rated_user_id, request_id')
          .in('request_id', finishedIds)
          .eq('rater_id', this.currentUserId)

        const ratedSet = new Set(
          (existingRatings || []).map((r) => `${r.request_id}-${r.rated_user_id}`),
        )

        this.finishedPlaymates = validFinished.map((req) => ({
          ...req,
          players: (joinsByRequest[req.id] || []).map((player) => ({
            ...player,
            isRated: ratedSet.has(`${req.id}-${player.user_id}`),
          })),
        }))
      } catch (err) {
        console.error('Error fetching finished playmates:', err.message)
      }
    },
    async getCurrentUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          this.currentUserId = user.id
        }
      } catch (err) {
        console.error('Error getting current user:', err)
      }
    },

    async fetchFacilities() {
      this.facilityLoading = true
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('facility_name')
          .order('facility_name', { ascending: true })

        if (error) throw error

        this.facilities = data || []
      } catch (err) {
        console.error('Error fetching facilities:', err.message)
      } finally {
        this.facilityLoading = false
      }
    },

    async checkRequestStatus(requestId) {
      const { data, error } = await supabase
        .from('playmate_requests')
        .select('max_joins, status, playmate_joins(count), match_type')
        .eq('id', requestId)
        .single()

      if (error || !data) {
        console.error('Error fetching request data for status check:', error?.message)
        return
      }

      const currentJoins = data.playmate_joins[0]?.count || 0
      const maxJoins = data.max_joins
      const currentStatus = data.status
      const isTeamMatch = data.match_type === 'team'
      let newStatus = currentStatus

      if (currentStatus === 'canceled') return

      if (isTeamMatch) {
        newStatus = currentJoins >= 1 ? 'full' : 'open'
      } else {
        newStatus = currentJoins >= maxJoins ? 'full' : 'open'
      }

      if (newStatus !== currentStatus) {
        const { error: updateError } = await supabase
          .from('playmate_requests')
          .update({ status: newStatus })
          .eq('id', requestId)

        if (updateError) {
          console.error(`Error updating status to ${newStatus}:`, updateError.message)
        }
      }
    },

    async fetchRequestsAndJoins() {
      this.loading = true
      try {
        // Fetch requests starting from today
        const { data: requestsData, error: requestsError } = await supabase
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name), playmate_joins(count), match_type')
          .gte('date', this.todayDate)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (requestsError) throw requestsError

        const requestIds = (requestsData || []).map((r) => r.id)
        let allJoinsData = []
        if (requestIds.length > 0) {
          const { data: joins, error: joinsError } = await supabase
            .from('playmate_joins')
            .select('request_id, user_id, user:user_id (full_name)')
            .in('request_id', requestIds)

          if (joinsError) throw joinsError
          allJoinsData = joins || []
        }

        const joinsByRequest = allJoinsData.reduce((acc, join) => {
          if (!acc[join.request_id]) acc[join.request_id] = []
          acc[join.request_id].push({
            user_id: join.user_id,
            full_name: join.user?.full_name || 'Anonymous Player',
          })
          return acc
        }, {})

        this.playmateRequests = (requestsData || [])
          .map((request) => ({
            ...request,
            creator_name: request.creator?.full_name || 'Anonymous User',
            joins_count: request.playmate_joins[0]?.count || 0,
            joiners: joinsByRequest[request.id] || [],
          })) // Filter out expired requests based on end_time for the Active list
          .filter((request) => !this.isPastEndTime(request.date, request.end_time))

        if (this.currentUserId) {
          const { data: joinsData, error: joinsError } = await supabase
            .from('playmate_joins')
            .select('request_id')
            .eq('user_id', this.currentUserId)

          if (joinsError) throw joinsError

          this.userJoins = joinsData.map((j) => j.request_id)
        }

        this.playmateRequests = this.playmateRequests.filter(
          (r) => r.status !== 'canceled' || r.creator_id === this.currentUserId,
        )
      } catch (err) {
        console.error('Error fetching playmate data:', err.message)
      } finally {
        this.loading = false
      }
    },

    async fetchJoinsForRequest(requestId) {
      this.participants = []
      try {
        const { data, error } = await supabase
          .from('playmate_joins')
          .select('user_id, user:user_id (full_name)')
          .eq('request_id', requestId)

        if (error) throw error

        const joinedUsers = data.map((j) => ({
          user_id: j.user_id,
          full_name: j.user.full_name || 'Anonymous Player',
        }))

        const creator = this.playmateRequests.find((r) => r.id === requestId)

        const creatorParticipant = {
          user_id: creator.creator_id,
          full_name: creator.creator_name + ' (Creator)',
        }

        const uniqueJoined = joinedUsers.filter((p) => p.user_id !== creatorParticipant.user_id)

        this.participants = [creatorParticipant, ...uniqueJoined]
      } catch (err) {
        console.error('Error fetching participants:', err.message)
      }
    },

    openManageDialog(request) {
      this.selectedRequest = { ...request }
      this.manageDialog = true
      this.manageTab = 0
      this.fetchJoinsForRequest(request.id)
    },

    async handleJoinToggle(request) {
      if (this.isCreator(request.creator_id)) {
        this.openManageDialog(request)
        return
      }

      const requestId = request.id
      const isTeamMatch = request.match_type === 'team'

      if (!this.currentUserId) {
        alert('Please log in to join or manage requests.')
        return
      }

      if (this.isJoined(requestId)) {
        const msg = isTeamMatch
          ? 'Successfully withdrawn the opponent team from the challenge.'
          : 'Successfully withdrawn from the request.'
        await this.supabaseAction(
          supabase
            .from('playmate_joins')
            .delete()
            .eq('request_id', requestId)
            .eq('user_id', this.currentUserId),
          msg,
          'Failed to withdraw from request.',
        )
      } else {
        const isFull = isTeamMatch ? request.joins_count >= 1 : request.status === 'full'

        if (isFull) {
          alert(`This play request is currently full and cannot be joined.`)
          return
        }

        const msg = isTeamMatch
          ? 'You have successfully accepted the team challenge!'
          : 'Successfully joined the request!'
        await this.supabaseAction(
          supabase
            .from('playmate_joins')
            .insert([{ request_id: requestId, user_id: this.currentUserId }]),
          msg,
          'Failed to join request. It may be full or closed.',
        )
      }

      await this.checkRequestStatus(requestId)
      await this.fetchRequestsAndJoins()
    },

    async editRequest() {
      if (this.$refs.editForm && !this.$refs.editForm.validate()) {
        alert('Please correct the validation errors before saving.')
        return
      }

      if (this.selectedRequest.status === 'canceled') {
        alert('Cannot edit a canceled request.')
        return
      }

      this.creating = true
      try {
        const { error } = await supabase
          .from('playmate_requests')
          .update({
            sport: this.selectedRequest.sport,
            location: this.selectedRequest.location,
            max_joins: this.selectedRequest.max_joins,
            date: this.selectedRequest.date,
            start_time: this.selectedRequest.start_time,
            end_time: this.selectedRequest.end_time,
            description: this.selectedRequest.description,
          })
          .eq('id', this.selectedRequest.id)
          .eq('creator_id', this.currentUserId)

        if (error) throw error

        alert('Request updated successfully!')
        this.manageDialog = false
        await this.checkRequestStatus(this.selectedRequest.id)
        await this.fetchRequestsAndJoins()
      } catch (err) {
        alert(`Failed to update request: ${err.message}`)
      } finally {
        this.creating = false
      }
    },

    async cancelRequest() {
      if (!this.selectedRequest?.id) return

      const confirmCancel = confirm(
        'Are you sure you want to cancel this request? This will permanently delete it.',
      )
      if (!confirmCancel) return

      try {
        const { error } = await supabase
          .from('playmate_requests')
          .delete()
          .eq('id', this.selectedRequest.id)
          .eq('creator_id', this.currentUserId)

        if (error) throw error

        this.playmateRequests = this.playmateRequests.filter(
          (r) => r.id !== this.selectedRequest.id,
        )

        this.manageDialog = false
        alert('Request permanently deleted.')
        this.fetchRequestsAndJoins()
      } catch (err) {
        console.error('Error deleting request:', err)
        alert('Failed to delete the request. Please try again.')
      }
    },

    async supabaseAction(promise, successMsg, failMsg) {
      this.creating = true
      try {
        const { data, error } = await promise

        if (error) {
          console.error('Supabase Error Details (Action Failed):', error)
          throw error
        }

        alert(successMsg)
        return data
      } catch (err) {
        console.error('Supabase action failed:', err.message)
        let customFailMsg = failMsg
        if (err.code === '42501') {
          customFailMsg += ' (Check your RLS Policy on the table!)'
        } else if (err.code === '23502') {
          customFailMsg += ' (A required field is NULL, e.g., creator_id!)'
        }

        alert(customFailMsg)
        throw err
      } finally {
        this.creating = false
      }
    },

    async createRequest() {
      if (!this.$refs.form.validate() || !this.currentUserId) {
        if (!this.currentUserId) {
          alert('You must be logged in to create a request.')
        }
        return
      }

      let finalSport = this.newRequest.sport
      if (this.isSportOther) {
        if (!this.otherSportText) {
          alert('Please specify the sport you wish to play.')
          return
        }
        finalSport = this.otherSportText.trim()
      }

      let finalLocation = this.newRequest.location
      if (this.isLocationOther) {
        if (!this.otherLocationText) {
          alert('Please specify the location you wish to play at.')
          return
        }
        finalLocation = this.otherLocationText.trim()
      }

      try {
        await this.supabaseAction(
          supabase.from('playmate_requests').insert([
            {
              creator_id: this.currentUserId,
              sport: finalSport,
              location: finalLocation,
              max_joins: this.newRequest.max_joins,
              date: this.newRequest.date,
              start_time: this.newRequest.start_time,
              end_time: this.newRequest.end_time,
              description: this.newRequest.description,
              status: 'open',
              match_type: this.newRequest.match_type,
            },
          ]),
          'Playmate request created successfully!',
          'Failed to create request. See console for error details.',
        )

        this.dialog = false
        this.$refs.form.reset()
        this.newRequest.sport = null
        this.newRequest.location = ''
        this.newRequest.match_type = 'individual'
        this.otherSportText = ''
        this.otherLocationText = ''
        this.fetchRequestsAndJoins() // Explicitly switch to the Active Requests tab to show the newly created item
        this.mainTab = 0
      } catch (e) {
        console.log('Create request process aborted after failure.')
      }
    },

    async viewUserProfile(userId) {
      if (!userId) return
      this.profileDialog = true
      await this.fetchProfile(userId)
    },

    async fetchProfile(userId) {
      this.profileLoading = true
      this.profileFound = false // Reset data for the new user profile
      this.profileRatings = []
      this.profile = {
        id: null,
        full_name: null,
        role: null,
        address: null,
        city: null,
        zip_code: null,
        phone_number: null,
        updated_at: null,
      }

      try {
        // 1. Fetch basic profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, address, city, zip_code, phone_number, updated_at')
          .eq('id', userId)
          .single()

        if (error) {
          if (error.code === 'PGRST116' || error.message === 'No rows found') {
            // no profile found
            this.profileFound = false
            return
          }
          throw error
        }
        if (data) {
          this.profile = data
          this.profileFound = true // 2. Fetch the ratings for the successfully loaded profile
          await this.fetchUserRatings(userId)
        } else {
          this.profileFound = false
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        this.profileFound = false
      } finally {
        this.profileLoading = false
      }
    },

    closeProfileDialog() {
      this.profileDialog = false
      setTimeout(() => {
        this.profile = {
          id: null,
          full_name: null,
          role: null,
          address: null,
          city: null,
          zip_code: null,
          phone_number: null,
          updated_at: null,
        }
        this.profileRatings = []
        this.profileFound = false
      }, 250)
    },
  },
}
</script>

<style scoped>
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
