<script setup>
import { ref } from 'vue'
import { supabase, formActionDefault } from '@/utils/supabase.js'
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'
import AlertNotification from '../common/AlertNotification.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Default form data with ALL fields from CustomerregistrationView.vue
const formDataDefault = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  address: '',
  city: '',
  zipCode: '',
}

// Register Functionality
const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { data, error } = await supabase.auth.signUp({
    email: formData.value.email,
    password: formData.value.password,
    options: {
      data: {
        firstname: formData.value.firstname,
        lastname: formData.value.lastname,
        phone: formData.value.phone,
        address: formData.value.address,
        city: formData.value.city,
        zipCode: formData.value.zipCode,
      },
    },
  })

  if (error) {
    console.log(error)
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status
  } else if (data) {
    console.log(data)
    formAction.value.formSuccessMessage = 'Successfully Registered Account.'
    // Redirect to Login (more consistent with your CustomerregistrationView.vue)
    router.replace('/login')
  }

  // Reset Form
  refVForm.value?.reset()
  formAction.value.formProcess = false
}

// Trigger Validators
const onFormSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}

const formData = ref({ ...formDataDefault })
const formAction = ref({ ...formActionDefault })
const isConfirmPasswordVisible = ref(false)
const isPasswordvisible = ref(false)
const refVForm = ref()
</script>

<template>
  <AlertNotification
    :form-success-message="formAction.formSuccessMessage"
    :form-error-message="formAction.formErrorMessage"
  />

  <v-form class="mt-5" ref="refVForm" @submit.prevent="onFormSubmit">
    <v-text-field
      v-model="formData.firstname"
      label="First Name"
      variant="outlined"
      :rules="[requiredValidator]"
    />
    <v-text-field
      v-model="formData.lastname"
      label="Last Name"
      variant="outlined"
      :rules="[requiredValidator]"
    />
    <v-text-field
      v-model="formData.email"
      label="Email"
      variant="outlined"
      :rules="[requiredValidator, emailValidator]"
    />

    <v-text-field
      v-model="formData.password"
      label="Password"
      :type="isPasswordvisible ? 'text' : 'password'"
      :append-inner-icon="isPasswordvisible ? 'mdi-eye-off' : 'mdi-eye-outline'"
      variant="outlined"
      @click:append-inner="isPasswordvisible = !isPasswordvisible"
      :rules="[requiredValidator, passwordValidator]"
    />

    <v-text-field
      v-model="formData.password_confirmation"
      label="Password Confirmation"
      :type="isConfirmPasswordVisible ? 'text' : 'password'"
      :append-inner-icon="isConfirmPasswordVisible ? 'mdi-eye-off' : 'mdi-eye-outline'"
      variant="outlined"
      @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
      :rules="[
        requiredValidator,
        confirmedValidator(formData.password_confirmation, formData.password),
      ]"
    />

    <!-- Extra fields -->
    <v-text-field
      v-model="formData.phone"
      label="Phone Number"
      variant="outlined"
      :rules="[requiredValidator]"
    />
    <v-text-field
      v-model="formData.address"
      label="Address"
      variant="outlined"
      :rules="[requiredValidator]"
    />
    <v-text-field
      v-model="formData.city"
      label="City"
      variant="outlined"
      :rules="[requiredValidator]"
    />
    <v-text-field
      v-model="formData.zipCode"
      label="Zip Code"
      variant="outlined"
      :rules="[requiredValidator]"
    />

    <v-divider class="my-5"></v-divider>
    <h5 class="text-center">
      Already have an account?
      <RouterLink class="text-primary" to="/login">Click here to log in</RouterLink>
    </h5>
    <v-btn
      class="mt-2"
      type="submit"
      block
      color="primary"
      prepend-icon="mdi-account-plus"
      :disabled="formAction.formProcess"
      :loading="formAction.formProcess"
      >Sign Up</v-btn
    >
  </v-form>
</template>
