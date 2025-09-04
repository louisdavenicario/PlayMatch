<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Import the useRouter function

// Get the router instance
const router = useRouter();

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const formData = ref({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
});

const form = ref(null);

const requiredRule = [v => !!v || 'This field is required'];
const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
];
const passwordRules = [
    v => !!v || 'Password is required',
    v => (v && v.length >= 8) || 'Must be at least 8 characters',
    v => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
    v => /[a-z]/.test(v) || 'Must contain a lowercase letter',
    v => /[!@#$%^&*()]/.test(v) || 'Must contain a symbol !@#$%^&*()',
];
const confirmPasswordRule = [
    v => !!v || 'Confirm Password is required',
    v => v === formData.value.password || 'Passwords do not match',
];
const phoneRules = [
    v => !!v || 'Phone number is required',
    v => /^\d{11}$/.test(v) || 'Phone number must be 11 digits',
];
const zipCodeRules = [
    v => !!v || 'Zip code is required',
    v => /^\d{4,5}$/.test(v) || 'Zip code must be 4-5 digits',
];

const validateAndSubmit = async () => {
    const { valid } = await form.value.validate();
    if (valid) {
        console.log('Form submitted successfully:', formData.value);
        // Navigate to a sign-in page, assuming a route named 'signIn' exists
        router.push({ name: 'signIn' });
    }
};

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
                            <v-btn icon @click="router.push({ name: 'user' })" class="mb-4">
                                <v-icon>mdi-arrow-left</v-icon>
                            </v-btn>
                            <v-card-title class="text-h5 text-center font-weight-bold">Create Customer Account</v-card-title>
                            <v-form ref="form" @submit.prevent="validateAndSubmit">
                                <v-card-text>
                                    <v-list-item class="mb-4">
                                        <v-list-item-title class="font-weight-bold">Personal Information</v-list-item-title>
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
                                                    variant="outlined"
                                                ></v-text-field>
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
                                        <v-list-item-title class="font-weight-bold">Contact Information</v-list-item-title>
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
    </v-app>
</template>
