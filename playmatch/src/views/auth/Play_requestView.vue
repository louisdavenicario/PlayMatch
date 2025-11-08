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

        <div v-if="loading" class="text-center py-10">
          <v-progress-circular indeterminate color="blue"></v-progress-circular>
          <p class="mt-2 grey--text">Loading playmate requests...</p>
        </div>

        <div v-else-if="filteredRequests.length === 0" class="text-center py-10">
          <v-icon large color="grey lighten-1">mdi-account-group-outline</v-icon>
          <h3 class="mt-2 text-h6 grey--text">No active requests found.</h3>
          <p class="grey--text">Be the first to create a playmate request!</p>
          <v-btn color="blue" dark class="mt-4" rounded @click="dialog = true">
            <v-icon left>mdi-plus-circle-outline</v-icon> Create Request
          </v-btn>
        </div>

        <v-row v-else>
          <v-col cols="12" v-for="request in filteredRequests" :key="request.id">
            <v-card class="pa-4" rounded="lg" elevation="2">
              <div class="d-flex align-center">
                <v-avatar color="blue lighten-4" size="50" class="mr-4">
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
                    {{ request.creator_name }} wants to play at {{ request.location }}
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
                  {{ formatTime(request.start_time) }}
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

              <v-card-actions class="pa-0 pt-2">
                <v-btn
                  small
                  :color="
                    isJoined(request.id)
                      ? 'red'
                      : isCreator(request.creator_id)
                        ? 'orange darken-1'
                        : request.match_type === 'team'
                          ? 'deep-purple' // Distinct color for team match join
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
                            ? 'Accept Challenge' // New label for team join
                            : 'Join'
                  }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
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
                    <v-list-item-title class="grey--text">{{
                      selectedRequest.match_type === 'team'
                        ? 'No opponent team has accepted the challenge yet.'
                        : 'No players have joined yet.'
                    }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item v-for="p in participants" :key="p.user_id">
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
    currentUserId: null,
    playmateRequests: [],
    userJoins: [],
    participants: [], // List of users who joined the selected request
    selectedRequest: {}, // The request object currently being managed or edited

    // Sport specific data
    baseSports: ['Badminton', 'Basketball', 'Tennis', 'Volleyball', 'Soccer'],
    otherSportText: '', // Stores the manually typed sport if "Other" is chosen

    // Location specific data
    facilities: [],
    facilityLoading: false,
    otherLocationText: '', // Stores the manually typed location if "Other" is chosen

    newRequest: {
      sport: null,
      location: '', // Holds selected facility name OR 'Other (Specify)'
      max_joins: 4, // DEFAULT VALUE
      date: '',
      start_time: '',
      description: '',
      // NEW FIELD: Default to individual match
      match_type: 'individual',
    },
    todayDate: new Date().toISOString().split('T')[0],
  }),
  computed: {
    // ... (sportChoices, isSportOther, locationChoices, isLocationOther, filteredRequests remain the same)
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
      if (!this.search) return this.playmateRequests

      const searchLower = this.search.toLowerCase()
      return this.playmateRequests.filter(
        (request) =>
          request.sport.toLowerCase().includes(searchLower) ||
          request.location.toLowerCase().includes(searchLower) ||
          request.creator_name.toLowerCase().includes(searchLower),
      )
    },
  },
  async mounted() {
    await this.getCurrentUser()
    this.fetchRequestsAndJoins()
    this.fetchFacilities()
  },
  methods: {
    // --- Utility Methods ---
    // ... (formatDate, formatTime, isJoined, isCreator, handleSportChange, handleLocationChange remain the same)
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

    // --- Core Interaction Methods ---

    // ... (getCurrentUser and fetchFacilities remain the same)
    async getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        this.currentUserId = user.id
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

    // Centralized function to check and update request status
    async checkRequestStatus(requestId) {
      const { data, error } = await supabase
        // ADD 'match_type' TO SELECT FOR LOGIC CHECK
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

      // Logic updated to check team match (1 join is "full")
      if (isTeamMatch) {
        if (currentJoins >= 1) {
          newStatus = 'full'
        } else {
          newStatus = 'open'
        }
      } else {
        // Original logic for individual matches
        if (currentJoins >= maxJoins) {
          newStatus = 'full'
        } else {
          newStatus = 'open'
        }
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

      this.fetchRequestsAndJoins()
    },

    async fetchRequestsAndJoins() {
      this.loading = true
      try {
        const { data: requestsData, error: requestsError } = await supabase
          // ADD 'match_type' TO SELECT LIST
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name), playmate_joins(count), match_type')
          .gte('date', this.todayDate)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (requestsError) throw requestsError

        this.playmateRequests = requestsData.map((request) => ({
          ...request,
          creator_name: request.creator?.full_name || 'Anonymous User',
          joins_count: request.playmate_joins[0]?.count || 0,
        }))

        if (this.currentUserId) {
          const { data: joinsData, error: joinsError } = await supabase
            .from('playmate_joins')
            .select('request_id')
            .eq('user_id', this.currentUserId)

          if (joinsError) throw joinsError

          this.userJoins = joinsData.map((j) => j.request_id)
        }

        // --- Status Management (Initial Load) ---
        const requestsToUpdate = this.playmateRequests
          .filter((r) => r.status !== 'canceled')
          .map((r) => {
            const isTeamMatch = r.match_type === 'team'
            const shouldBeOpen =
              (isTeamMatch && r.joins_count === 0) || (!isTeamMatch && r.joins_count < r.max_joins)
            const shouldBeFull =
              (isTeamMatch && r.joins_count >= 1) || (!isTeamMatch && r.joins_count >= r.max_joins)

            let newStatus = r.status
            if (shouldBeFull && r.status !== 'full') newStatus = 'full'
            if (shouldBeOpen && r.status !== 'open') newStatus = 'open'

            return { id: r.id, oldStatus: r.status, newStatus }
          })
          .filter((u) => u.oldStatus !== u.newStatus)

        const requestsToOpen = requestsToUpdate
          .filter((u) => u.newStatus === 'open')
          .map((u) => u.id)
        const requestsToClose = requestsToUpdate
          .filter((u) => u.newStatus === 'full')
          .map((u) => u.id)

        if (requestsToOpen.length > 0) {
          await supabase
            .from('playmate_requests')
            .update({ status: 'open' })
            .in('id', requestsToOpen)
        }
        if (requestsToClose.length > 0) {
          await supabase
            .from('playmate_requests')
            .update({ status: 'full' })
            .in('id', requestsToClose)
        }

        this.playmateRequests.forEach((r) => {
          if (requestsToOpen.includes(r.id)) r.status = 'open'
          if (requestsToClose.includes(r.id)) r.status = 'full'
        })

        // Filter the main display list
        this.playmateRequests = this.playmateRequests.filter(
          (r) => r.status !== 'canceled' || r.creator_id === this.currentUserId,
        )
      } catch (err) {
        console.error('Error fetching playmate data:', err.message)
      } finally {
        this.loading = false
      }
    },

    // ... (fetchJoinsForRequest and openManageDialog remain the same)
    // Fetches participants for the Manage Request modal
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

    // Opens the Manage Request dialog for the creator
    openManageDialog(request) {
      this.selectedRequest = { ...request }
      this.manageDialog = true
      this.manageTab = 0
      this.fetchJoinsForRequest(request.id)
    },

    // Main button handler logic
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

      // Updated logic for team matches: it's "full" if joins_count >= 1
      if (
        (isTeamMatch && request.joins_count >= 1 && !this.isJoined(requestId)) ||
        (!isTeamMatch && request.status === 'full' && !this.isJoined(requestId))
      ) {
        alert(`This play request is currently full and cannot be joined.`)
        return
      }

      // Safety check: ensure only one "Opponent Team" can join a team match
      if (isTeamMatch && request.joins_count > 0 && !this.isJoined(requestId)) {
        alert('An opponent team has already accepted this challenge.')
        return
      }

      if (this.isJoined(requestId)) {
        // Withdraw logic
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
        // Join logic
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
    },

    // Updates the request details
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
            description: this.selectedRequest.description,
            // Match type is intentionally not editable after creation
          })
          .eq('id', this.selectedRequest.id)
          .eq('creator_id', this.currentUserId)

        if (error) throw error

        alert('Request updated successfully!')
        this.manageDialog = false
        await this.checkRequestStatus(this.selectedRequest.id)
      } catch (err) {
        alert(`Failed to update request: ${err.message}`)
      } finally {
        this.creating = false
      }
    },

    // Cancels (updates status to 'canceled') the request
    async cancelRequest() {
      if (!this.selectedRequest?.id) return

      const confirmCancel = confirm(
        'Are you sure you want to cancel this request? This will permanently delete it.',
      )
      if (!confirmCancel) return

      try {
        // ✅ Delete request based on creator_id
        const { error } = await supabase
          .from('playmate_requests')
          .delete()
          .eq('id', this.selectedRequest.id)
          .eq('creator_id', this.currentUserId)

        if (error) throw error

        // ✅ Remove locally so UI updates immediately
        this.playmateRequests = this.playmateRequests.filter(
          (r) => r.id !== this.selectedRequest.id,
        )

        this.manageDialog = false
        alert('Request permanently deleted.')
      } catch (err) {
        console.error('Error deleting request:', err)
        alert('Failed to delete the request. Please try again.')
      }
    },
    // Helper for Supabase actions - MODIFIED FOR BETTER ERROR LOGGING
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
        // Log the exact error for developer debugging
        console.error('Supabase action failed:', err.message)
        // Check for specific error codes (RLS: 42501, NOT NULL: 23502)
        let customFailMsg = failMsg
        if (err.code === '42501') {
          customFailMsg += ' (Check your RLS Policy on the table!)'
        } else if (err.code === '23502') {
          customFailMsg += ' (A required field is NULL, e.g., creator_id!)'
        }

        alert(customFailMsg) // Show the user the generic/custom failure message
        throw err
      } finally {
        this.creating = false
      }
    },

    // Create Request method
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
              description: this.newRequest.description,
              status: 'open',
              // NEW FIELD INSERT
              match_type: this.newRequest.match_type,
            },
          ]),
          'Playmate request created successfully!',
          'Failed to create request. See console for error details.',
        )

        // --- Success Logic ---
        this.dialog = false
        this.$refs.form.reset()
        this.newRequest.sport = null
        this.newRequest.location = ''
        this.newRequest.match_type = 'individual' // Reset new field
        this.otherSportText = ''
        this.otherLocationText = ''
        this.fetchRequestsAndJoins()
      } catch (e) {
        console.log('Create request process aborted after failure.')
      }
    },
  },
}
</script>

<style scoped>
.v-card {
  transition: all 0.2s ease-in-out;
}
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
}
</style>
