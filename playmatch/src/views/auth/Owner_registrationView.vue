<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabaseClient';

// Get the router instance
const router = useRouter();

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const formData = ref({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    facilityName: '',
    facilityType: '',
    address: '',
    amenities: '',
    briefDescription: '',
    price: '',
    openingTime: null,
    closingTime: null,
    facilityPhotos: null,
});

const previewUrl = ref(null);
const fileInput = ref(null);
const form = ref(null);
const passwordFocused = ref(false);
const showSuccessDialog = ref(false);
const alertMessage = ref(null);
const alertColor = ref(null);

const requiredRule = [(v) => !!v || 'This field is required'];
const emailRules = [
    (v) => !!v || 'Email is required',
    (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
];
const passwordRules = [
    (v) => !!v || 'Password is required',
    (v) => (v && v.length >= 8) || 'Must be at least 8 characters',
    (v) => /[A-Z]/.test(v) || 'Must contain an uppercase letter',
    (v) => /[a-z]/.test(v) || 'Must contain a lowercase letter',
    (v) => /[!@#$%^&*()]/.test(v) || 'Must contain a symbol (!@#$%^&*())',
];
const confirmPasswordRule = [
    (v) => !!v || 'Confirm Password is required',
    (v) => v === formData.value.password || 'Passwords do not match',
];
const phoneRules = [
    (v) => !!v || 'Phone number is required',
    (v) => /^\d{11}$/.test(v) || 'Phone number must be 11 digits',
];

const hasMinLength = computed(() => (formData.value.password?.length || 0) >= 8);
const hasUppercase = computed(() => /[A-Z]/.test(formData.value.password));
const hasLowercase = computed(() => /[a-z]/.test(formData.value.password));
const hasSymbol = computed(() => /[!@#$%^&*()]/.test(formData.value.password));

const triggerFileSelect = () => fileInput.value.click();
const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        formData.value.facilityPhotos = file;
        previewUrl.value = URL.createObjectURL(file);
    }
};
const handleDrop = (event) => {
    const file = event.dataTransfer.files[0];
    if (file) {
        formData.value.facilityPhotos = file;
        previewUrl.value = URL.createObjectURL(file);
    }
};
const removePhoto = () => {
    formData.value.facilityPhotos = null;
    previewUrl.value = null;
    fileInput.value.value = null;
};

const showTemporaryAlert = (message, color) => {
    alertMessage.value = message;
    alertColor.value = color;
    setTimeout(() => {
        alertMessage.value = null;
        alertColor.value = null;
    }, 5000);
};

const validateAndSubmit = async () => {
    const { valid } = await form.value.validate();
    if (!valid) {
        showTemporaryAlert("Please fill in all required fields correctly.", 'error');
        return;
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.value.email,
            password: formData.value.password,
        });

        if (authError) {
            throw authError;
        }

        const newUserId = authData.user.id;
        console.log("New user created with ID:", newUserId);

        let photoUrl = null;
        if (formData.value.facilityPhotos) {
            const file = formData.value.facilityPhotos;
            const filePath = `${newUserId}/${file.name}`;
            const { error: storageError } = await supabase.storage
                .from('facility-photos')
                .upload(filePath, file);

            if (storageError) {
                console.error("Storage upload failed:", storageError);
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from('facility-photos')
                    .getPublicUrl(filePath);
                photoUrl = publicUrlData.publicUrl;
            }
        }

        const { error: facilityError } = await supabase.from('facilities').insert({
            owner_id: newUserId,
            name: formData.value.facilityName,
            type: formData.value.facilityType,
            location: formData.value.address,
            amenities: formData.value.amenities,
            description: formData.value.briefDescription,
            price_per_hour: parseFloat(formData.value.price),
            opening_time: formData.value.openingTime,
            closing_time: formData.value.closingTime,
            photo_url: photoUrl,
        });

        if (facilityError) {
            throw facilityError;
        }

        console.log("Facility data successfully inserted.");
        showSuccessDialog.value = true;
    } catch (error) {
        console.error("Registration failed:", error.message);
        showTemporaryAlert(`Registration failed: ${error.message}`, 'error');
    }
};

const goToSignIn = () => {
    showSuccessDialog.value = false;
    router.push({ name: 'signin' });
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
                            <v-btn icon @click="router.push({ name: 'choose-role' })" class="mb-4">
                                <v-icon>mdi-arrow-left</v-icon>
                            </v-btn>
                            <v-card-title class="text-h5 text-center font-weight-bold">
                                Owner Registration
                            </v-card-title>

                            <v-form ref="form" @submit.prevent="validateAndSubmit">
                                <v-card-text>
                                    <v-list-item class="mb-4">
                                        <v-list-item-title class="font-weight-bold"
                                            >Account Information</v-list-item-title
                                        >
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="formData.email"
                                                    label="Email Address"
                                                    :rules="emailRules"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="formData.phone"
                                                    label="Phone Number"
                                                    :rules="phoneRules"
                                                    variant="outlined"
                                                />
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
                                                />
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
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-list-item>

                                    <v-list-item class="mb-4">
                                        <v-list-item-title class="font-weight-bold">Facility Details</v-list-item-title>
                                        <v-row>
                                            <v-col cols="12" sm="6">
                                                <v-text-field
                                                    v-model="formData.facilityName"
                                                    label="Facility Name"
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-text-field
                                                    v-model="formData.facilityType"
                                                    label="Facility Type"
                                                    placeholder="e.g. basketball, badminton, or..."
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="formData.address"
                                                    label="Address"
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="formData.amenities"
                                                    label="Amenities"
                                                    placeholder="What amenities do you offer?"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12">
                                                <v-textarea
                                                    v-model="formData.briefDescription"
                                                    label="Brief Description"
                                                    placeholder="Brief description of your facility..."
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-list-item>

                                    <v-list-item class="mb-4">
                                        <v-list-item-title class="font-weight-bold"
                                            >Operating Hours & Price</v-list-item-title
                                        >
                                        <v-row>
                                            <v-col cols="12">
                                                <v-text-field
                                                    v-model="formData.price"
                                                    label="Price per Hour"
                                                    type="number"
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-text-field
                                                    v-model="formData.openingTime"
                                                    label="Opening Time"
                                                    type="time"
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-text-field
                                                    v-model="formData.closingTime"
                                                    label="Closing Time"
                                                    type="time"
                                                    :rules="requiredRule"
                                                    variant="outlined"
                                                />
                                            </v-col>
                                        </v-row>
                                    </v-list-item>

                                    <v-list-item class="mb-4">
                                        <v-list-item-title class="font-weight-bold">Facility Photo</v-list-item-title>

                                        <div
                                            v-if="!previewUrl"
                                            class="file-upload-container"
                                            @click="triggerFileSelect"
                                            @dragover.prevent
                                            @drop.prevent="handleDrop"
                                        >
                                            <v-icon size="48">mdi-cloud-upload-outline</v-icon>
                                            <p>Click to upload or drag and drop</p>
                                            <p class="text-caption text-grey-darken-1">
                                                SVG, PNG, JPG or GIF (MAX. 800x400px)
                                            </p>
                                            <input
                                                type="file"
                                                ref="fileInput"
                                                accept="image/*"
                                                class="d-none"
                                                @change="handleFileChange"
                                            />
                                        </div>

                                        <div v-else class="uploaded-photo-container">
                                            <img :src="previewUrl" alt="Uploaded Facility" class="preview-image" />
                                            <div class="d-flex justify-center mt-2 gap-2">
                                                <v-btn color="primary" size="small" @click="triggerFileSelect">
                                                    Replace
                                                </v-btn>

                                                <v-btn color="error" size="small" @click="removePhoto" class="mr-2"
                                                    >Remove</v-btn
                                                >
                                            </div>
                                            <input
                                                type="file"
                                                ref="fileInput"
                                                accept="image/*"
                                                class="d-none"
                                                @change="handleFileChange"
                                            />
                                        </div>
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
        
        <v-alert
            v-if="alertMessage"
            :type="alertColor"
            class="mb-4"
            style="position: fixed; top: 20px; right: 20px; z-index: 1000;"
        >{{ alertMessage }}</v-alert>

        <v-dialog v-model="showSuccessDialog" persistent max-width="400">
            <v-card class="text-center pa-4" style="border-radius: 20px">
                <v-card-title class="text-h5 text-green-darken-2">Registration Successful</v-card-title>
                <v-card-text>
                    Your facility has been successfully registered. Sign in to continue.
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

.file-upload-container {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    color: #888;
    cursor: pointer;
}

.uploaded-photo-container {
    text-align: center;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    border: 1px solid #ccc;
}

.submit-button {
    transition: all 0.3s ease-in-out;
}

.submit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

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