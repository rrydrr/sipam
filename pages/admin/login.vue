<template>
  <Card :max-width="'max-w-md'">
    <img
      src="/logo.png"
      alt="logo"
      class="mx-auto mb-4 w-20 h-20 object-contain"
      @error="handleImageError"
    />
    <h2 class="text-2xl font-semibold mb-6 text-center">Admin Login</h2>
    <form @submit.prevent="handleSubmit">
      <Input
        v-model="username"
        label="Username"
        type="text"
        placeholder="Masukkan username anda"
        name="username"
        id="user-name"
        required
        autocomplete="username"
        :error="usernameError"
        @blur="validateUsername"
      />
      <Input
        v-model="password"
        label="Password"
        type="password"
        placeholder="Masukkan password anda"
        name="password"
        id="user-password"
        required
        autocomplete="current-password"
        :error="passwordError"
        @blur="validatePassword"
      />
      <div v-if="apiError" class="mt-4 text-red-500 text-sm text-center">
        {{ apiError }}
      </div>
      <button
        type="submit"
        class="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded transition-colors duration-200 mt-6"
        :disabled="isLoading"
      >
        {{ isLoading ? "Logging in..." : "Login" }}
      </button>
    </form>
  </Card>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { navigateTo } from "#app";

const imageError = ref(false);

const handleImageError = (event: Event) => {
  imageError.value = true;
  const target = event.target as HTMLImageElement;
  if (target && target.parentNode) {
    // Remove the broken image
    target.remove();

    // Create a placeholder and insert it
    const placeholder = document.createElement("div");
    placeholder.className =
      "mx-auto mb-4 w-20 h-20 bg-gray-300 flex items-center justify-center rounded";
    placeholder.textContent = "Logo";

    target.parentNode.insertBefore(placeholder, target.nextSibling);
  }
};

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
}

const username = ref("");
const usernameError = ref("");
const password = ref("");
const passwordError = ref("");
const apiError = ref("");
const isLoading = ref(false);

const validateUsername = () => {
  if (username.value.length === 0) {
    usernameError.value = "Username is required.";
  } else if (username.value.length < 5) {
    usernameError.value = "Username must be at least 5 characters.";
  } else {
    usernameError.value = "";
  }
  return !usernameError.value;
};

const validatePassword = () => {
  if (password.value.length === 0) {
    passwordError.value = "Password is required.";
  } else if (password.value.length < 8) {
    passwordError.value = "Password must be at least 8 characters.";
  } else {
    passwordError.value = "";
  }
  return !passwordError.value;
};

const setCookie = (name: string, value: string, days: number) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    name +
    "=" +
    (value || "") +
    expires +
    "; path=/; SameSite=Strict" +
    secureFlag;
};

const handleSubmit = async () => {
  apiError.value = "";

  const isUsernameValid = validateUsername();
  const isPasswordValid = validatePassword();

  if (!isUsernameValid || !isPasswordValid) {
    return;
  }

  isLoading.value = true;

  try {
    const data = await useCsrfFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        username: username.value,
        password: password.value,
      },
    });
    if (data.status.value === "success") {
      if (data.data.value && data.data.value.token) {
        setCookie("authToken", data.data.value.token, 1);
        await navigateTo("/admin/dashboard", { external: false });
      } else {
        console.warn(
          "No token received in login response despite success:true."
        );
        apiError.value =
          "Login successful, but no authorization token was received. Please contact support.";
      }
    } else {
      throw new Error(data.error.value?.data.message || "Login failed");
    }
  } catch (error: any) {
    let message = "An unexpected error occurred. Please try again.";

    if (error.message) {
      message = error.message;
    }

    apiError.value = message;
  } finally {
    isLoading.value = false;
  }
};
</script>
