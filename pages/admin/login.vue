<template>
  <Card :max-width="'max-w-md'">
    <img src="/logo.png" alt="logo" class="mx-auto mb-4 w-20 h-20 object-contain" />
    <h2 class="text-2xl font-semibold mb-6 text-center">Admin Login</h2>
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
    />
    <Input
      v-model="password"
      label="Password"
      type="password"
      placeholder="Masukkan password anda"
      name="password"
      id="user-password"
      required
      autocomplete="password"
    />
    <button
      type="submit"
      class="w-full bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded transition-colors duration-200 mt-6"
    >
      Login
    </button>
  </Card>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const username = ref("");
const usernameError = ref("");

const password = ref("");
const passwordError = ref("");

const validateUsername = () => {
  if (username.value.length === 0) {
    usernameError.value = "Username is required.";
  } else if (username.value.length < 5) {
    usernameError.value = "Username must be at least 5 characters.";
  } else {
    usernameError.value = ""; // No error
  }
};
</script>
