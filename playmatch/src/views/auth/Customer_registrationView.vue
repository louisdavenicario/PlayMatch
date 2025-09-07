<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router' // Import the useRouter function

// Get the router instance
const router = useRouter()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// State to control the visibility of the success dialog
const showSuccessDialog = ref(false)

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
  city: '',
  zipCode: '',
})

const form = ref(null)

// State to track if the password field is focused
const passwordFocused = ref(false)

// Password validation rules from the attached image
const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 8) || 'Must be at least 8 characters',
  (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
  (v) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
  (v) => /[!@#$%^&*()]/.test(v) || 'Must contain a symbol (!@#$%^&*())',
]

// Computed properties to check the validity of each rule
const hasMinLength = computed(() => (formData.value.password?.length || 0) >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(formData.value.password))
const hasLowercase = computed(() => /[a-z]/.test(formData.value.password))
const hasSymbol = computed(() => /[!@#$%^&*()]/.test(formData.value.password))

const requiredRule = [(v) => !!v || 'This field is required']
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
]
const confirmPasswordRule = [
  (v) => !!v || 'Confirm Password is required',
  (v) => v === formData.value.password || 'Passwords do not match',
]
const phoneRules = [
  (v) => !!v || 'Phone number is required',
  (v) => /^\d{11}$/.test(v) || 'Phone number must be 11 digits',
]
const zipCodeRules = [
  (v) => !!v || 'Zip code is required',
  (v) => /^\d{4,5}$/.test(v) || 'Zip code must be 4-5 digits',
]

const validateAndSubmit = async () => {
  // Validate all form fields
  const { valid } = await form.value.validate()

  // The success dialog will only show if the form is valid
  if (valid) {
    showSuccessDialog.value = true
  }
}

const goToSignIn = () => {
  showSuccessDialog.value = false
  router.push({ name: 'signin' })
}
</script>

<template>
  <v-app>
    <v-main>
      <div
        class="d-flex align-center justify-center"
        style="
          min-height: 100vh;
          background:
            linear-gradient(to bottom right, rgba(26, 101, 162, 0.6), rgba(119, 154, 229, 0.6)),
            url('/images/logo.jpg') center/cover no-repeat;
        "
      >
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card
              class="mx-auto pa-8"
              max-width="800"
              elevation="10"
              style="
                background-color: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(4px);
                border: 2px solid #2196f3;
                border-radius: 20px;
              "
            >
              <v-btn icon @click="router.push({ name: 'choose-role' })" class="mb-4">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-card-title class="text-h5 text-center font-weight-bold"
                >Create Customer Account</v-card-title
              >
              <v-form ref="form" @submit.prevent="validateAndSubmit">
                <v-card-text>
                  <v-list-item class="mb-4">
                    <v-list-item-title class="font-weight-bold"
                      >Personal Information</v-list-item-title
                    >
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.fullName"
                          label="Full Name"
                          :rules="requiredRule"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.email"
                          label="Email Address"
                          :rules="emailRules"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.password"
                          :type="showPassword ? 'text' : 'password'"
                          label="Password"
                          :rules="passwordRules"
                          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                          @click:append-inner="showPassword = !showPassword"
                          @focus="passwordFocused = true"
                          @blur="passwordFocused = false"
                          variant="outlined"
                        ></v-text-field>
                        <!-- Dynamic password validation list -->
                        <div v-if="formData.password || passwordFocused" class="password-rules">
                          <p class="text-caption font-weight-bold">Password must contain:</p>
                          <ul>
                            <li
                              :class="{
                                'text-green-darken-2': hasMinLength,
                                'text-red-darken-2': !hasMinLength,
                              }"
                            >
                              <v-icon :color="hasMinLength ? 'green' : 'red'">{{
                                hasMinLength ? 'mdi-check-circle' : 'mdi-circle'
                              }}</v-icon>
                              At least 8 characters
                            </li>
                            <li
                              :class="{
                                'text-green-darken-2': hasUppercase,
                                'text-red-darken-2': !hasUppercase,
                              }"
                            >
                              <v-icon :color="hasUppercase ? 'green' : 'red'">{{
                                hasUppercase ? 'mdi-check-circle' : 'mdi-circle'
                              }}</v-icon>
                              One uppercase letter
                            </li>
                            <li
                              :class="{
                                'text-green-darken-2': hasLowercase,
                                'text-red-darken-2': !hasLowercase,
                              }"
                            >
                              <v-icon :color="hasLowercase ? 'green' : 'red'">{{
                                hasLowercase ? 'mdi-check-circle' : 'mdi-circle'
                              }}</v-icon>
                              One lowercase letter
                            </li>
                            <li
                              :class="{
                                'text-green-darken-2': hasSymbol,
                                'text-red-darken-2': !hasSymbol,
                              }"
                            >
                              <v-icon :color="hasSymbol ? 'green' : 'red'">{{
                                hasSymbol ? 'mdi-check-circle' : 'mdi-circle'
                              }}</v-icon>
                              One symbol (e.g., !@#$%)
                            </li>
                          </ul>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.confirmPassword"
                          :type="showConfirmPassword ? 'text' : 'password'"
                          label="Confirm Password"
                          :rules="confirmPasswordRule"
                          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                          @click:append-inner="showConfirmPassword = !showConfirmPassword"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-list-item>
                  <v-list-item class="mb-4">
                    <v-list-item-title class="font-weight-bold"
                      >Contact Information</v-list-item-title
                    >
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.phone"
                          label="Phone Number"
                          :rules="phoneRules"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.address"
                          label="Address"
                          :rules="requiredRule"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.city"
                          label="City"
                          :rules="requiredRule"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="formData.zipCode"
                          label="Zip Code"
                          :rules="zipCodeRules"
                          variant="outlined"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-list-item>
                </v-card-text>
                <v-card-actions class="justify-center">
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    rounded
                    block
                    class="submit-button"
                  >
                    Submit
                  </v-btn>
                </v-card-actions>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-main>
    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card class="text-center pa-4" style="border-radius: 20px">
        <v-card-title class="text-h5 text-green-darken-2">Registration Successful</v-card-title>
        <v-card-text>
          Your account has been created successfully. Sign in to continue.
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" rounded block @click="goToSignIn" class="sign-in-button">
            Sign In
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
.password-rules {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
}

.password-rules ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-rules li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.password-rules .v-icon {
  font-size: 1rem;
}

/* Submit button styles */
.submit-button {
  transition: all 0.3s ease-in-out;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

/* Pop-up sign-in button styles */
.sign-in-button {
  transition: all 0.2s ease-in-out;
}

.sign-in-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.sign-in-button:active {
  transform: scale(0.98);
}
</style>
