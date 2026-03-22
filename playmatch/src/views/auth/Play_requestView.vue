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

      <v-toolbar-title
        class="font-weight-bold"
        style="color: white; overflow: visible; min-width: max-content"
      >
        Playmate Requests
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-btn
        rounded
        depressed
        color="white"
        class="blue--text text-none font-weight-bold px-4"
        small
        @click="openCreateDialog()"
      >
        <v-icon left small>mdi-plus</v-icon>
        Create Request
      </v-btn>
    </v-app-bar>

    <v-main
      :style="{
        background:
          'linear-gradient(to bottom right, rgba(26, 101, 162, 0.2), rgba(119, 154, 229, 0.4))',
      }"
    >
      <v-container>
        <v-card class="pa-4 mb-4" rounded="xl" elevation="1">
          <v-text-field
            v-model="search"
            label="Search by Name, Sport, or Location"
            prepend-inner-icon="mdi-magnify"
            clearable
            solo
            dense
            rounded
            hide-details
          ></v-text-field>
        </v-card>

        <v-card class="pa-3 mb-4" rounded="xl" elevation="1">
          <v-tabs v-model="mainTab" background-color="transparent" grow>
            <v-tab class="text-none">Active Matches</v-tab>
            <v-tab class="text-none">Users</v-tab>
            <v-tab class="text-none">Recently Played</v-tab>
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
              <v-chip value="direct_invite" color="purple" text-color="white"> Invites </v-chip>
            </v-chip-group>
          </div>
        </v-card>

        <div v-if="mainTab === 0">
          <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="blue"></v-progress-circular>
            <p class="mt-2 grey--text">Loading active matches...</p>
          </div>

          <div v-else-if="filteredMatches.length === 0" class="text-center py-10">
            <v-icon large color="grey lighten-1">mdi-account-group-outline</v-icon>
            <h3 class="mt-2 text-h6 grey--text">
              No active requests found for your current filters.
            </h3>
            <p class="grey--text">Be the first to create a playmate request!</p>
            <v-btn color="blue" dark class="mt-4 text-none" rounded @click="openCreateDialog()">
              <v-icon left class="mr-1">mdi-plus-circle-outline</v-icon> Create Request
            </v-btn>
          </div>

          <v-row v-else>
            <v-col cols="12" v-for="request in filteredMatches" :key="request.id">
              <v-card class="pa-4" rounded="xl" elevation="2">
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
                          request.match_type === 'direct_invite' &&
                          request.invite_status === 'pending'
                            ? 'purple'
                            : request.status === 'open'
                              ? 'green'
                              : request.status === 'canceled'
                                ? 'red'
                                : 'orange'
                        "
                        dark
                        class="ml-2"
                      >
                        {{
                          request.match_type === 'direct_invite'
                            ? request.is_invited && request.invite_status === 'pending'
                              ? 'Action Required'
                              : request.invite_status === 'accepted'
                                ? 'Confirmed'
                                : request.invite_status === 'rejected'
                                  ? 'Rejected'
                                  : 'Invite Sent'
                            : request.status
                        }}
                      </v-chip>
                      <v-chip
                        x-small
                        :color="
                          request.match_type === 'team'
                            ? 'deep-purple'
                            : request.match_type === 'direct_invite'
                              ? 'purple darken-1'
                              : 'light-blue'
                        "
                        dark
                        class="ml-1 mb-2 mt-2"
                      >
                        {{
                          request.match_type === 'team'
                            ? 'Team Match'
                            : request.match_type === 'direct_invite'
                              ? 'Direct Invite'
                              : 'Seeking Players'
                        }}
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

                <v-row no-gutters class="text-caption mt-2 align-center justify-center">
                  <v-col
                    cols="6"
                    sm="auto"
                    class="d-flex align-center justify-center justify-sm-start pr-sm-4 pb-2 pb-sm-0"
                  >
                    <v-icon small class="mr-1">mdi-calendar-range</v-icon>
                    {{ formatDate(request.date) }}
                  </v-col>

                  <v-col
                    cols="6"
                    sm="auto"
                    class="d-flex align-center justify-center justify-sm-start pr-sm-4 pb-2 pb-sm-0"
                  >
                    <v-icon small class="mr-1">mdi-clock-time-four-outline</v-icon>
                    {{ formatTime(request.start_time) }} - {{ formatTime(request.end_time) }}
                  </v-col>

                  <v-col
                    v-if="request.match_type === 'team'"
                    cols="6"
                    sm="auto"
                    class="d-flex align-center justify-center justify-sm-start pr-sm-4"
                  >
                    <v-icon small class="mr-1">mdi-account-multiple</v-icon>
                    {{ request.max_joins }}v{{ request.max_joins }} Match
                  </v-col>

                  <v-col
                    cols="6"
                    sm="auto"
                    class="d-flex align-center justify-center justify-sm-start pr-sm-4"
                  >
                    <v-icon small class="mr-1">
                      {{ request.match_type === 'team' ? 'mdi-trophy' : 'mdi-account-group' }}
                    </v-icon>
                    {{ playersDisplay(request) }}
                  </v-col>

                  <v-col
                    cols="6"
                    sm="auto"
                    class="d-flex align-center justify-center justify-sm-start"
                  >
                    <v-chip
                      v-if="request.match_type === 'direct_invite'"
                      x-small
                      color="purple"
                      outlined
                      class="ma-0"
                    >
                      Invite {{ request.invite_status || 'sent' }}
                    </v-chip>
                  </v-col>
                </v-row>

                <p
                  class="text-body-2 mt-3 mb-1 grey--text text-center mx-auto"
                  style="max-width: 80%"
                >
                  {{ request.description || 'No specific notes provided.' }}
                </p>

                <v-card-actions class="pa-0 pt-2">
                  <v-btn
                    v-if="
                      request.match_type === 'direct_invite' &&
                      request.is_invited &&
                      request.invite_status === 'pending'
                    "
                    color="green darken-1"
                    dark
                    rounded
                    class="mr-2 text-none"
                    @click="handleInviteResponse(request, 'accepted')"
                  >
                    <v-icon left>mdi-check-bold</v-icon> Accept Match
                  </v-btn>
                  <v-btn
                    v-if="
                      request.match_type === 'direct_invite' &&
                      request.is_invited &&
                      request.invite_status === 'pending'
                    "
                    color="red darken-1"
                    dark
                    rounded
                    class="text-none"
                    @click="handleInviteResponse(request, 'rejected')"
                  >
                    <v-icon left>mdi-close-thick</v-icon> Reject
                  </v-btn>

                  <v-btn
                    v-else-if="
                      !request.is_invited ||
                      request.invite_status !== 'pending' ||
                      isCreator(request.creator_id)
                    "
                    small
                    :color="
                      isJoined(request.id) && !isCreator(request.creator_id)
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
                    class="text-none"
                    :disabled="
                      getCapacity(request).isFull &&
                      !isCreator(request.creator_id) &&
                      !isJoined(request.id)
                    "
                    @click="handleJoinToggle(request)"
                  >
                    {{
                      isCreator(request.creator_id)
                        ? 'Manage'
                        : isJoined(request.id)
                          ? 'Withdraw'
                          : getCapacity(request).isFull
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

        <div v-else-if="mainTab === 1">
          <v-subheader v-if="filteredUsers.length > 0" class="font-weight-bold"
            >Users matching "{{ search }}"</v-subheader
          >
          <v-alert v-else type="info" text class="mt-4 rounded-xl" elevation="1">
            Start searching for a name or even type a letter to find users to play with!"
          </v-alert>

          <v-list v-if="filteredUsers.length > 0" two-line class="mt-2 rounded-xl" elevation="1">
            <v-list-item v-for="user in filteredUsers" :key="user.id">
              <v-list-item-avatar color="blue lighten-4" size="50">
                <span class="white--text font-weight-bold">{{ user.full_name[0] }}</span>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">
                  {{ user.full_name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Sport: {{ user.sports || 'N/A' }} | Location: {{ user.city || 'N/A' }}
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action class="d-flex flex-row my-2 mx-1">
                <v-btn
                  icon
                  class="mr-2"
                  style="width: 28px; height: 30px; min-width: 30px"
                  @click="viewUserProfile(user.id)"
                >
                  <v-icon size="16" color="blue">mdi-information-outline</v-icon>
                </v-btn>

                <v-btn
                  v-if="user.id !== currentUserId"
                  color="primary"
                  rounded
                  class="px-3 text-caption"
                  style="height: 33px; min-height: 33px"
                  @click="openMatchRequestDialog(user)"
                >
                  Let's Match
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </div>

        <div v-else-if="mainTab === 2">
          <v-alert type="info" text class="mt-4 mb-4 rounded-xl" elevation="1">
            <h3>Rating Window</h3>
            <p>Matches that ended in the last 24 hours are displayed here for rating.</p>
            Start searching for a name or even type a letter to find users to play with!"
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
            rounded="xl"
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
                <v-icon right x-small class="ml-1">{{
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
      <v-card rounded="xl" max-height="80vh">
        <v-card-title class="text-h5 blue white--text">
          {{
            isDirectInvite
              ? `Invite Match with ${selectedUserToMatch.full_name}`
              : 'Create New Request'
          }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-select
              v-model="newRequest.sport"
              :items="sportChoices"
              label="Sport"
              :rules="[(v) => !!v || 'Sport is required']"
              required
              class="mb-3"
              :readonly="lockedSport"
              :disabled="lockedSport"
            ></v-select>

            <v-text-field
              v-if="isSportOther && !lockedSport"
              v-model="otherSportText"
              label="Specify Other Sport"
              :rules="[(v) => !!v || 'Custom sport is required']"
              required
              class="mt-0 mb-3"
            />

            <v-radio-group v-model="newRequest.match_type" class="mb-3">
              <v-radio label="Seeking Individual Players" value="individual"></v-radio>
              <v-radio label="Seeking an Opponent Team" value="team"></v-radio>
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
                  ? 'Players per Team (e.g., 5 for 5v5)'
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
            />

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

            <v-alert v-if="isDirectInvite" type="info" dense outlined class="mt-4 rounded-xl">
              This will create a Direct Invite request for {{ selectedUserToMatch.full_name }}. It
              is pending until they accept or decline.
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="dialog = false" class="text-none">Cancel</v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="createRequest"
            :loading="creating"
            class="text-none"
          >
            {{ isDirectInvite ? 'Send Invite' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="manageDialog" max-width="600px" scrollable>
      <v-card rounded="xl" max-height="80vh">
        <v-card-title class="text-h5 orange darken-1 white--text">Manage Your Request</v-card-title>
        <v-card-text class="pt-4">
          <v-tabs v-model="manageTab" background-color="transparent" color="orange darken-1">
            <v-tab class="text-none">{{
              selectedRequest.match_type === 'team'
                ? 'Opponent Status'
                : selectedRequest.match_type === 'direct_invite'
                  ? 'Invite Status'
                  : `Participants (${participants.length})`
            }}</v-tab>
            <v-tab class="text-none">Edit Details</v-tab>
          </v-tabs>

          <v-tabs-items v-model="manageTab" class="mt-4">
            <v-tab-item>
              <v-list dense>
                <div
                  v-if="selectedRequest.match_type === 'direct_invite'"
                  class="pa-2 grey lighten-4 rounded"
                >
                  <div class="font-weight-medium mb-2">
                    Invite Status for
                    <span class="purple--text">{{ selectedRequest.invitee_name }}</span
                    >:
                  </div>
                  <v-chip
                    :color="
                      selectedRequest.invite_status === 'accepted'
                        ? 'green'
                        : selectedRequest.invite_status === 'rejected'
                          ? 'red'
                          : 'purple'
                    "
                    dark
                    class="font-weight-bold"
                  >
                    {{ selectedRequest.invite_status }}
                  </v-chip>
                  <p v-if="selectedRequest.invite_status === 'accepted'" class="mt-2 text-caption">
                    {{ selectedRequest.invitee_name }} has accepted. The match is confirmed!
                  </p>
                  <p
                    v-else-if="selectedRequest.invite_status === 'rejected'"
                    class="mt-2 text-caption"
                  >
                    {{ selectedRequest.invitee_name }} rejected the invite. The slot is now open for
                    a regular join, or you can send a new invite.
                  </p>
                  <p v-else class="mt-2 text-caption">
                    The invitation is still pending a response from
                    {{ selectedRequest.invitee_name }}.
                  </p>
                </div>

                <v-list-item
                  v-if="participants.length === 1 && selectedRequest.match_type !== 'direct_invite'"
                >
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

              <v-alert
                v-if="
                  selectedRequest.status === 'full' &&
                  selectedRequest.match_type !== 'direct_invite'
                "
                type="success"
                class="mt-4"
                dense
              >
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
                      : selectedRequest.match_type === 'direct_invite'
                        ? `Direct Invite to ${selectedRequest.invitee_name}`
                        : 'Seeking Individual Players'
                  "
                  label="Match Type"
                  persistent-placeholder
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

        <v-card-actions class="d-flex justify-space-between pa-4 pt-0 mt-2">
          <v-btn
            color="red darken-1"
            text
            class="text-none"
            @click="cancelRequest"
            :disabled="selectedRequest.status === 'canceled'"
          >
            <v-icon left>mdi-cancel</v-icon>
            {{ selectedRequest.status === 'canceled' ? 'Canceled' : 'Cancel Request' }}
          </v-btn>
          <div>
            <v-btn class="text-none" color="grey" text @click="manageDialog = false">Close</v-btn>
            <v-btn
              color="orange darken-1"
              dark
              class="text-none"
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
      <v-card rounded="xl">
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
                  <v-list-item-title class="grey--text text-caption">Sport</v-list-item-title>
                  <v-list-item-subtitle>{{ profile.sports || '—' }}</v-list-item-subtitle>
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
                    >Account Created</v-list-item-title
                  >
                  <v-list-item-subtitle class="d-flex align-center">
                    {{ profile.created_at ? new Date(profile.created_at).toLocaleString() : '—' }}

                    <v-chip
                      v-if="isNewUser(profile.created_at)"
                      x-small
                      color="green lighten-4"
                      class="green--text text--darken-3 ml-2 font-weight-bold"
                      label
                    >
                      NEW USER
                    </v-chip>
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
      </v-card>
    </v-dialog>

    <v-dialog v-model="ratingDialog" max-width="400px">
      <v-card rounded="xl">
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
          <v-btn text @click="ratingDialog = false" class="text-none">Cancel</v-btn>
          <v-btn
            color="blue"
            dark
            @click="submitRating"
            :disabled="newRating.rating === 0"
            class="text-none"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { supabase } from '@/supabaseClient'
import emailjs from '@emailjs/browser'

export default {
  name: 'Play_requestView',
  data: () => ({
    loading: false,
    creating: false,
    dialog: false, // For Create/Invite Request (Single Dialog)
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
    lockedSport: false,
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
    mainTab: 0, // 0 for Active Matches, 1 for Users, 2 for Recently Played
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
      created_at: null,
      sports: null,
    },
    profileRatings: [],
    statusCheckTimer: null,

    // DATA PROPERTIES FOR DIRECT INVITE
    allUsers: [],
    isDirectInvite: false, // New flag to control dialog behavior
    selectedUserToMatch: { id: null, full_name: '', sports: '', city: '' }, // Full user data
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
    // Only filters by matchTypeFilter for Tab 0, but still includes search filter.
    filteredMatches() {
      const searchTerm = this.search ? this.search.toLowerCase() : ''

      const matchTypeFiltered = this.playmateRequests.filter((request) => {
        // 1. If 'All Requests' is selected
        if (this.matchTypeFilter === 'all') {
          // Show everything EXCEPT standard direct invites
          // (Unless I am the creator or the one invited)
          if (request.match_type === 'direct_invite') {
            return request.creator_id === this.currentUserId || request.is_invited
          }
          return true
        }

        // 2. If 'Invites' chip is selected
        if (this.matchTypeFilter === 'direct_invite') {
          return request.match_type === 'direct_invite'
        }

        // 3. For 'individual' or 'team' chips, match exactly
        // This is the line that fixes your 'Seeking Players' tab
        return request.match_type === this.matchTypeFilter
      })

      // Apply search filter (Sport, Location, or Creator Name)
      return matchTypeFiltered.filter(
        (request) =>
          !searchTerm ||
          (request.sport || '').toLowerCase().includes(searchTerm) ||
          (request.location || '').toLowerCase().includes(searchTerm) ||
          (request.creator_name || '').toLowerCase().includes(searchTerm),
      )
    },
    // COMPUTED PROPERTY: Filters all users by search term on their sports or location/name for Tab 1
    filteredUsers() {
      const searchTerm = this.search ? this.search.toLowerCase() : ''
      if (!searchTerm) return []

      // Filter users whose 'sports' or 'city' or 'full_name' includes the search term, and exclude the current user
      return this.allUsers.filter((user) => {
        const userSports = (user.sports || '').toLowerCase()
        const userLocation = (user.city || '').toLowerCase()
        const userFullName = (user.full_name || '').toLowerCase()

        return (
          user.id !== this.currentUserId &&
          (userSports.includes(searchTerm) ||
            userLocation.includes(searchTerm) ||
            userFullName.includes(searchTerm))
        )
      })
    },

    playersDisplay() {
      return (request) => {
        const joined = Math.max(request.joins_count - 1, 0) // exclude creator
        const needed = request.max_joins

        if (request.match_type === 'team') {
          return `Opponent team: ${joined} / 1`
        }

        return `Players: ${joined} / ${needed}`
      }
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
      if (newVal === 2) {
        this.fetchFinishedPlaymates()
      } else if (newVal === 0) {
        this.fetchRequestsAndJoins()
      } else if (newVal === 1) {
        this.fetchAllUsers() // Fetch all users when switching to the Users tab
      }
    },
  },
  async mounted() {
    await this.getCurrentUser()
    this.fetchRequestsAndJoins()
    this.fetchFacilities() // Call fetchFacilities on initial load
    this.fetchFinishedPlaymates()
    this.fetchAllUsers() // Initial fetch of all users
    this.startStatusCheckTimer()
  },
  beforeUnmount() {
    this.stopStatusCheckTimer()
  },
  methods: {
    isNewUser(createdAt) {
      if (!createdAt) return false

      const createdDate = new Date(createdAt)
      const today = new Date()

      // Calculate difference in milliseconds
      const diffTime = Math.abs(today - createdDate)

      // Convert milliseconds to days (1000ms * 60s * 60m * 24h)
      const diffDays = diffTime / (1000 * 60 * 60 * 24)

      // Return true if the account is less than 3 days old
      return diffDays <= 3
    },

    // UTILITY TO CHECK IF REQUEST IS PAST END_TIME
    isPastEndTime(date, endTime) {
      if (!date || !endTime) return false // Combines date and time to create a full datetime object
      const requestEnd = new Date(`${date}T${endTime}`) // Add a 30-second buffer to account for minor clock discrepancies
      requestEnd.setSeconds(requestEnd.getSeconds() + 30)
      return new Date() > requestEnd
    },

    getCapacity(request) {
      const joinedPlayers = Math.max(request.joins_count - 1, 0) // exclude creator
      const maxPlayers = request.max_joins

      return {
        joinedPlayers,
        maxPlayers,
        isFull: joinedPlayers >= maxPlayers,
      }
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
    }, //  Fetches all ratings for a given user ID

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
      const isDirectInvite = data.match_type === 'direct_invite'
      let newStatus = currentStatus

      if (currentStatus === 'canceled') return

      if (isDirectInvite) {
        newStatus = currentJoins >= maxJoins + 1 ? 'full' : 'open'
      } else if (isTeamMatch) {
        // Team matches only need 1 opponent to join (creator + 1 opponent team)
        newStatus = currentJoins > 1 ? 'full' : 'open'
      } else {
        // Individual matches check against max_joins
        newStatus = currentJoins >= maxJoins + 1 ? 'full' : 'open' // Includes creator in count
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
        // 1. Fetch base requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('playmate_requests')
          .select('*, creator:creator_id (full_name), playmate_joins(count), match_type')
          .gte('date', this.todayDate)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })

        if (requestsError) throw requestsError

        const requestIds = (requestsData || []).map((r) => r.id)
        let allJoinsData = []
        let allInvitesData = []

        if (requestIds.length > 0) {
          // 2. Fetch all joins for active requests
          const { data: joins, error: joinsError } = await supabase
            .from('playmate_joins')
            .select('request_id, user_id, user:user_id (full_name)')
            .in('request_id', requestIds)

          if (joinsError) throw joinsError
          allJoinsData = joins || []

          // 3. Fetch all invites for active requests (Conceptual Table)
          // Fetch invites where the current user is EITHER the invited_user_id OR the creator_id
          const { data: invites, error: invitesError } = await supabase
            .from('playmate_invites')
            .select('id, request_id, invited_user_id, status, user:invited_user_id(full_name)')
            .in('request_id', requestIds) // Filter by requestIds from the original fetch

          if (invitesError) {
            console.warn(
              'Could not fetch playmate_invites, skipping invite data:',
              invitesError.message,
            )
          } else {
            allInvitesData = invites || []
          }
        }

        const joinsByRequest = allJoinsData.reduce((acc, join) => {
          if (!acc[join.request_id]) acc[join.request_id] = []
          acc[join.request_id].push({
            user_id: join.user_id,
            full_name: join.user?.full_name || 'Anonymous Player',
          })
          return acc
        }, {})

        const invitesByRequest = allInvitesData.reduce((acc, invite) => {
          // Note: Since a direct invite request is 1v1, only one invite record is expected per request.
          acc[invite.request_id] = {
            id: invite.id,
            invited_user_id: invite.invited_user_id,
            status: invite.status,
            full_name: invite.user?.full_name || 'Invited User',
          }
          return acc
        }, {})

        // Process requests
        let processedRequests = (requestsData || [])
          .map((request) => {
            const inviteData = invitesByRequest[request.id]
            const isInvitedUser = inviteData?.invited_user_id === this.currentUserId

            return {
              ...request,
              creator_name: request.creator?.full_name || 'Anonymous User',
              joins_count: request.playmate_joins[0]?.count || 0,
              joiners: joinsByRequest[request.id] || [],

              // Direct Invite Properties
              invite_id: inviteData ? inviteData.id : null,
              invite_status: inviteData ? inviteData.status : null,
              invitee_name: inviteData ? inviteData.full_name : null,
              is_invited: isInvitedUser,
            }
          })
          // Filter out expired requests based on end_time for the Active list
          .filter((request) => !this.isPastEndTime(request.date, request.end_time))

        if (this.currentUserId) {
          const { data: joinsData, error: joinsError } = await supabase
            .from('playmate_joins')
            .select('request_id')
            .eq('user_id', this.currentUserId)

          if (joinsError) throw joinsError

          this.userJoins = joinsData.map((j) => j.request_id)
        }

        // --- FINAL CLIENT-SIDE VISIBILITY LOGIC (CRUCIAL FOR INVITES) ---
        // Filter the requests down to only those the current user should see:

        // 👇 ADD THIS DEBUG HERE
console.log('Current User ID:', this.currentUserId)
console.log('All processed requests:', processedRequests.map(r => ({
  id: r.id,
  match_type: r.match_type,
  invite_status: r.invite_status,
  is_invited: r.is_invited,
  invited_user_id: r.invite_id,
  creator_id: r.creator_id,
})))
// 👆 END DEBUG
        this.playmateRequests = processedRequests.filter((r) => {
          const isCreator = r.creator_id === this.currentUserId
          const isJoined = this.userJoins.includes(r.id)
          const isInvited = r.is_invited

          // 1️⃣ Creator always sees their own request
          if (isCreator) return true

          // 2️⃣ Joined users always see it
          if (isJoined) return true

          // 3️⃣ Invited user sees direct invite (unless rejected)
          if (r.match_type === 'direct_invite' && isInvited && r.invite_status !== 'rejected') {
            return true
          }

          // 4️⃣ PUBLIC VISIBILITY RULE (KEY FIX)
          // Any OPEN request that still has slots should be visible
          const totalAllowed = r.max_joins + 1 // creator included

          if (r.status === 'open' && r.joins_count < totalAllowed) {
            return true
          }

          return false
        })

        // --- END FINAL CLIENT-SIDE VISIBILITY LOGIC ---
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

    async handleInviteResponse(request, response) {
      if (!request.is_invited || request.invite_status !== 'pending') return

      this.creating = true
      try {
        // 1️⃣ Update invite status using invite_id (CRITICAL FIX)
        const { error: inviteError } = await supabase
          .from('playmate_invites')
          .update({ status: response })
          .eq('id', request.invite_id)

        if (inviteError) throw inviteError

        // 2️⃣ Optimistic UI update (IMMEDIATE FIX)
        request.invite_status = response

        if (response === 'accepted') {
          // 3️⃣ Insert join
          const { error: joinError } = await supabase
            .from('playmate_joins')
            .insert([{ request_id: request.id, user_id: this.currentUserId }])

          if (joinError) throw joinError

          // 4️⃣ Mark request as full
          request.status = 'full'

          alert(`Match with ${request.creator_name} accepted!`)
        } else {
          alert(`You rejected the match from ${request.creator_name}.`)
        }

        // 5️⃣ Force refresh from DB
        await this.fetchRequestsAndJoins()
      } catch (err) {
        console.error('Invite response failed:', err.message)
        alert('Failed to update invitation.')
      } finally {
        this.creating = false
      }
    },

    /*async handleJoinToggle(request) {
      const requestId = request.id
      const isTeamMatch = request.match_type === 'team'
      const isDirectInvite = request.match_type === 'direct_invite'

      if (!this.currentUserId) {
        alert('Please log in to join or manage requests.')
        return
      }

      // Creator can manage the request
      if (this.isCreator(request.creator_id)) {
        this.openManageDialog(request)
        return
      }

      // Direct invite: only the invited user can accept/reject if pending
      if (isDirectInvite && request.is_invited && request.invite_status === 'pending') {
        if (request.invited_user_id !== this.currentUserId) {
          alert('Only the invited user can join this request.')
          return
        }
        // The invited user can continue to accept/reject normally
      }

      // Handle join/withdraw
      if (this.isJoined(requestId)) {
        // User is already joined - allow withdrawal regardless of full status
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
        // User is trying to join - check if there's space
        const maxAllowed = isTeamMatch
          ? 2 // creator + 1 team
          : request.max_joins + 1 // creator + max_joins

        if (request.joins_count >= maxAllowed) {
          alert('This play request is currently full and cannot be joined.')
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
    },*/

    async handleJoinToggle(request) {
      const requestId = request.id
      const isTeamMatch = request.match_type === 'team'
      const isDirectInvite = request.match_type === 'direct_invite'

      if (!this.currentUserId) {
        alert('Please log in to join or manage requests.')
        return
      }

      if (this.isCreator(request.creator_id)) {
        this.openManageDialog(request)
        return
      }

      if (isDirectInvite && request.is_invited && request.invite_status === 'pending') {
        if (request.invited_user_id !== this.currentUserId) {
          alert('Only the invited user can join this request.')
          return
        }
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

        // ✅ Notify creator when someone withdraws
        try {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', request.creator_id)
            .single()

          const { data: withdrawerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', this.currentUserId)
            .single()

          if (creatorProfile?.email) {
            await emailjs.send(
              'playmatch-gmail',
              'template_8gfziro',
              {
                to_email: creatorProfile.email,
                recipient_name: creatorProfile.full_name ?? 'there',
                subject: 'Someone Withdrew from Your Playmate Request',
                message: `${withdrawerProfile?.full_name ?? 'Someone'} has withdrawn from your ${request.sport} playmate request at ${request.location}. Your slot is now open again.`,
                date: request.date,
                start_time: this.formatTime(request.start_time),
                end_time: this.formatTime(request.end_time),
                sport: request.sport,
                location: request.location,
                email: 'team.playmatch@gmail.com',
                name: 'PlayMatch',
              },
              'yZZ7qBnK679PREuvG'
            )
            console.log('Withdraw notification email sent!')
          }
        } catch (emailErr) {
          console.error('Failed to send withdraw notification email:', emailErr)
        }
      } else {
        const maxAllowed = isTeamMatch ? 2 : request.max_joins + 1

        if (request.joins_count >= maxAllowed) {
          alert('This play request is currently full and cannot be joined.')
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

        // ✅ Send email to creator when someone joins
        try {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', request.creator_id)
            .single()

          const { data: joinerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', this.currentUserId)
            .single()

          if (creatorProfile?.email) {
            await emailjs.send(
              'playmatch-gmail',
              'template_8gfziro',
              {
                to_email: creatorProfile.email,
                recipient_name: creatorProfile.full_name ?? 'there',
                subject: 'Someone Joined Your Playmate Request!',
                message: `${joinerProfile?.full_name ?? 'Someone'} has joined your ${request.sport} playmate request! Head to PlayMatch to check it out.`,
                date: request.date,
                start_time: this.formatTime(request.start_time),
                end_time: this.formatTime(request.end_time),
                sport: request.sport,
                location: request.location,
                email: 'team.playmatch@gmail.com',
                name: 'PlayMatch',
              },
              'yZZ7qBnK679PREuvG'
            )
            console.log('Join notification email sent!')
          }
        } catch (emailErr) {
          console.error('Failed to send join notification email:', emailErr)
        }
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
        // Delete the request, which should cascade delete joins and invites (if you set up cascading deletes)
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

    // REFACTORED METHOD: Handles both standard creation and direct invite creation
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

      this.creating = true
      try {
        const basePayload = {
          creator_id: this.currentUserId,
          sport: finalSport,
          location: finalLocation,
          max_joins: this.newRequest.max_joins,
          date: this.newRequest.date,
          start_time: this.newRequest.start_time,
          end_time: this.newRequest.end_time,
          description: this.newRequest.description,
          status: this.isDirectInvite ? 'open' : 'open',
          match_type: this.isDirectInvite ? 'direct_invite' : this.newRequest.match_type,
        }

        // --- 1. CREATE THE PLAYMATE REQUEST ---
        const { data: requestData, error: requestError } = await supabase
          .from('playmate_requests')
          .insert([basePayload])
          .select('id')
          .single()

        if (requestError) throw requestError
        const newRequestId = requestData.id

        // --- 2. ADD CREATOR TO playmate_joins ---
        const { error: creatorJoinError } = await supabase
          .from('playmate_joins')
          .insert([{ request_id: newRequestId, user_id: this.currentUserId }])

        if (creatorJoinError) throw creatorJoinError

        // --- 3. (CONDITIONAL) INSERT INVITE IF IT'S A DIRECT INVITE ---
        if (this.isDirectInvite) {
          const invitedUserId = this.selectedUserToMatch.id
          const { error: inviteError } = await supabase.from('playmate_invites').insert([
            {
              request_id: newRequestId,
              invited_user_id: invitedUserId,
              status: 'pending',
            },
          ])

          if (inviteError) {
            console.error('Failed to insert playmate_invites record:', inviteError.message)
            alert(
              `Playmate Request created, but failed to send the direct invite: ${inviteError.message}.`,
            )
          } else {
            alert(
              `Direct Match Request created and sent successfully to ${this.selectedUserToMatch.full_name}! Waiting for acceptance.`,
            )

            // ✅ Send email to invited user
            try {
              const { data: inviteeProfile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', this.selectedUserToMatch.id)
                .single()

              const { data: creatorProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', this.currentUserId)
                .single()

              if (inviteeProfile?.email) {
                await emailjs.send(
                  'playmatch-gmail',
                  'template_8gfziro',
                  {
                    to_email: inviteeProfile.email,
                    recipient_name: inviteeProfile.full_name ?? 'there',
                    subject: 'You Have a New Playmate Invite on PlayMatch!',
                    message: `${creatorProfile?.full_name ?? 'Someone'} has sent you a Direct Match Invite for ${finalSport} at ${finalLocation}! Open PlayMatch to accept or reject.`,
                    date: this.newRequest.date,
                    start_time: this.formatTime(this.newRequest.start_time),
                    end_time: this.formatTime(this.newRequest.end_time),
                    sport: finalSport,
                    location: finalLocation,
                    email: 'team.playmatch@gmail.com',
                    name: 'PlayMatch',
                  },
                  'yZZ7qBnK679PREuvG'
                )
                console.log('Invite notification email sent!')
              }
            } catch (emailErr) {
              console.error('Failed to send invite notification email:', emailErr)
            }
          }
        } else {
          alert('Playmate request created successfully!')
        }

        this.dialog = false
        this.resetFormState()
        this.fetchRequestsAndJoins()
        this.mainTab = 0
      } catch (e) {
        console.error('Create request process aborted after failure:', e.message)
        alert('Failed to create request. See console for error details.')
      } finally {
        this.creating = false
      }
    },

    // METHOD TO RESET FORM STATE AFTER SUBMISSION/CANCELLATION
    resetFormState() {
      if (this.$refs.form) {
        this.$refs.form.reset()
      }
      this.newRequest = {
        sport: null,
        location: '',
        max_joins: 4,
        date: this.todayDate,
        start_time: '',
        end_time: '',
        description: '',
        match_type: 'individual',
      }
      this.otherSportText = ''
      this.otherLocationText = ''
      this.isDirectInvite = false
      this.selectedUserToMatch = { id: null, full_name: '', sports: '', city: '' }
    },

    // METHOD TO OPEN STANDARD CREATE DIALOG
    openCreateDialog() {
      this.isDirectInvite = false
      this.lockedSport = false
      this.selectedUserToMatch = null
      this.newRequest = {
        sport: '',
        match_type: '',
        location: '',
        max_joins: 1,
        date: '',
        start_time: '',
        end_time: '',
        description: '',
      }
      this.dialog = true
    },
    // NEW METHOD: Handles the "Let's Have a Match" button click
    openMatchRequestDialog(user) {
      if (!this.currentUserId) {
        alert('You must be logged in to send a match request.')
        return
      }

      this.resetFormState()

      this.isDirectInvite = true
      this.selectedUserToMatch = { ...user }

      this.lockedSport = true
      this.newRequest.sport = user.sports

      this.newRequest.location = user.city || ''
      this.newRequest.date = this.todayDate
      this.newRequest.start_time = '18:00'
      this.newRequest.end_time = '19:00'

      this.newRequest.description = `Inviting ${user.full_name} for a ${user.sports} match.`

      // ✅ DEFAULTS — USER CAN CHANGE THESE
      this.newRequest.match_type = 'individual'
      this.newRequest.max_joins = 1

      this.dialog = true

      setTimeout(() => {
        this.$refs.form?.resetValidation()
      }, 50)
    },
    // END NEW METHODS

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
        created_at: null,
        sports: null,
      }

      try {
        // 1. Fetch basic profile data
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'id, full_name, role, address, city, zip_code, phone_number, updated_at, created_at, sports',
          )
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
          created_at: null,
          sports: null,
        }
        this.profileRatings = []
        this.profileFound = false
      }, 250)
    },

    // NEW METHODS FOR USER SEARCH AND MATCH REQUEST
    async fetchAllUsers() {
      // Fetches a list of all users/profiles for the 'Users' tab
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, sports, city') // Select only necessary fields
          .not('sports', 'is', null) // Only show users who have specified a sport

        if (error) throw error

        this.allUsers = data || []
      } catch (err) {
        console.error('Error fetching all users:', err.message)
      }
    },
  },
}
</script>

<style scoped>
/* 1. Base Tab Styling */
.v-tab {
  background-color: transparent !important;
  border-radius: 15px !important; /* Higher value for a perfect pill shape */
  margin: 0 4px;
  min-width: 100px;
  text-transform: none !important;
  letter-spacing: normal;
  transition: background-color 0.3s ease !important; /* Smooth hover */
}

/* 2. Style the Hover State */
.v-tab:hover {
  background-color: rgba(25, 118, 210, 0.05) !important; /* Very subtle blue tint */
}

/* 3. Style the Active Tab */
.v-tab--active {
  background-color: rgba(25, 118, 210, 0.1) !important; /* Light blue pill background */
  color: #1976d2 !important;
  font-weight: 600 !important;
}

/* 4. The Critical Fix: Remove the default square overlay */
/* Vuetify uses ::before for the hover/focus grey box. We must kill it. */
.v-tab::before {
  display: none !important;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
