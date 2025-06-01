<template>
  <aside
    :class="[
      'flex flex-col bg-gray-800 text-white p-4 w-64 h-screen', // Base styles: Added flex flex-col for logout button placement
      'fixed top-0 left-0 z-40', // --- Mobile behavior ---
      'transform transition-transform duration-300 ease-in-out', // Animation: Smooth slide
      isOpen ? 'translate-x-0' : '-translate-x-full', // Visibility: Slides in if isOpen, else hidden off-screen
      // --- Desktop behavior (md breakpoint and up) ---
      'md:sticky md:top-0 md:translate-x-0 md:z-auto', // Position: Becomes sticky at the top, always visible, default z-index
    ]"
    aria-label="Sidebar"
  >
    <div class="flex justify-between items-center mb-4 md:hidden">
      <span class="text-lg font-semibold">Menu</span>
      <button
        @click="handleClose"
        class="p-1 text-gray-300 hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        aria-label="Close sidebar"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>

    <nav :class="{ 'mt-8 md:mt-0': true }">
      <ul class="space-y-1">
        <li v-for="item in navigationItems" :key="item.to.toString()">
          <NuxtLink
            :to="item.to"
            @click="handleLinkClick"
            class="block px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700 focus:text-white transition-colors duration-150 ease-in-out"
            active-class="bg-gray-700 text-white"
            exact-active-class="bg-blue-600 text-white font-semibold shadow-md"
          >
            {{ item.text }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="mt-auto pt-4 border-t border-gray-700">
      <button
        @click="handleLogout"
        type="button"
        class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:bg-gray-700 focus:text-white transition-colors duration-150 ease-in-out group"
        aria-label="Logout"
      >
        <svg
          class="w-5 h-5 mr-3 text-gray-300 group-hover:text-white transition-colors duration-150 ease-in-out"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
// Assuming `useCsrfFetch` and `MapsTo` are auto-imported by Nuxt 3.
// If `useCsrfFetch` is not auto-imported, you'll need to import it from its source, e.g.:
// import { useCsrfFetch } from '~/composables/useCsrfFetch'; // or the actual path

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  /**
   * Controls the visibility of the sidebar on mobile.
   * This should be managed by the parent layout component.
   */
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "loggedOut"]); // Added "loggedOut" to emits

const handleClose = () => {
  emit("close"); // Notify parent to update isOpen state
};

// Optional: Close sidebar when a navigation link is clicked on mobile
const handleLinkClick = () => {
  if (
    props.isOpen &&
    typeof window !== "undefined" &&
    window.innerWidth < 768 // md breakpoint
  ) {
    emit("close");
  }
};

const navigationItems = computed(() => props.items);

const handleLogout = async () => {
  try {
    // Ensure `useCsrfFetch` is available in your project.
    // This composable should handle CSRF token fetching and inclusion automatically.
    // It's assumed to behave similarly to Nuxt 3's `useFetch`.
    const { data, error } = await useCsrfFetch("/api/auth/logout", {
      method: "POST",
    });

    if (error.value) {
      console.error(
        "Logout failed:",
        error.value.data || error.value.message || error.value
      );
      // Optionally, display a user-friendly error message.
      // For example: alert(`Logout failed: ${error.value.data?.message || 'Server error'}`);
    } else {
      console.log("Logout successful:", data.value);
      await navigateTo("/admin/login");
      if (
        props.isOpen &&
        typeof window !== "undefined" &&
        window.innerWidth < 768
      ) {
        emit("close");
      }
    }
  } catch (e) {
    // This catch block handles unexpected errors during the fetch call setup
    // or if `useCsrfFetch` itself throws an error not related to the HTTP response.
    console.error("An unexpected error occurred during logout:", e);
    // Optionally, display a user-friendly error message.
    // For example: alert('An unexpected error occurred. Please try again.');
  }
};
</script>

<style>
/* No specific styles needed here if Tailwind covers everything */
</style>
