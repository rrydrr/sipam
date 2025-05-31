<template>
  <div
    class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 antialiased"
  >
    <div
      v-if="qrCodeImageSrc"
      class="bg-white p-6 sm:p-8 rounded-xl shadow-2xl flex flex-col items-center"
    >
      <img
        :src="qrCodeImageSrc"
        alt="Order QR Code"
        class="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 object-contain"
      />
      <p
        v-if="orderIdForContext"
        class="mt-4 text-center text-sm text-gray-600 tracking-wide"
      >
        Order ID: {{ orderIdForContext }}
      </p>
    </div>

    <div
      v-else-if="errorMessage"
      class="bg-white p-8 rounded-lg shadow-xl text-center max-w-md"
    >
      <h2 class="text-xl font-semibold text-red-600 mb-3">
        QR Code Display Error
      </h2>
      <p class="text-gray-700">{{ errorMessage }}</p>
      <button
        @click="goBack"
        class="mt-6 px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150"
      >
        Go Back
      </button>
    </div>

    <div v-else class="text-center">
      <div
        class="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
      ></div>
      <p class="mt-5 text-gray-600 text-lg font-medium">Loading QR Code...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "#app"; // Nuxt 3 composable for router

// This tells Nuxt to not use any layout (or a specific one if you have 'minimal.vue')
// This is good for a page that should be very focused, like displaying a QR code.
definePageMeta({
  layout: false, // Disables the default layout. Or use 'minimal' if you have such a layout.
});

const qrCodeImageSrc = ref<string | null>(null);
const orderIdForContext = ref<string | null>(null); // To store orderId from state
const errorMessage = ref<string | null>(null);

const router = useRouter();

onMounted(() => {
  // This code runs only on the client-side where window.history is available.
  const navigationState = window.history.state;

  if (navigationState && navigationState.qrCodeData) {
    qrCodeImageSrc.value = navigationState.qrCodeData;
    if (navigationState.orderId) {
      orderIdForContext.value = navigationState.orderId;
    }
  } else {
    errorMessage.value =
      "QR Code data not found. Please go back and try generating it again.";
    console.warn(
      "QR Code data or orderId was not found in window.history.state:",
      navigationState
    );
  }
});

const goBack = () => {
  router.go(-1); // Navigates to the previous page in the browser history
};
</script>

<style scoped>
/* Ensure QR codes are rendered sharply */
img {
  image-rendering: -webkit-optimize-contrast; /* For Chrome, Safari, Edge */
  image-rendering: crisp-edges; /* For Firefox */
  /* For a pixelated effect if QR codes are small and need to be scaled up sharply:
  image-rendering: pixelated;
  */
}
/* Tailwind CSS classes are used for the rest of the styling. */
</style>
