<template>
  <div class="relative min-h-screen min-w-screen md:flex bg-primary">
    <div
      v-if="isSidebarOpen"
      @click="closeSidebar"
      class="fixed inset-0 bg-black/50 z-30 md:hidden"
      aria-hidden="true"
    ></div>

    <div class="sticky top-0 z-20 bg-white shadow-sm md:hidden">
      <div
        class="container mx-auto px-4 py-3 flex justify-between items-center"
      >
        <img src="public/logo.png" alt="Company Logo" class="h-10 w-auto" />
        <button
          @click="toggleSidebar"
          class="text-gray-600 hover:text-gray-800 focus:outline-none p-2 rounded-lg transition-all duration-100 ease-in-out active:bg-gray-100 active:scale-90"
          aria-label="Open sidebar"
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
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <Sidebar
      :items="sidebarItems"
      :isOpen="isSidebarOpen"
      @close="closeSidebar"
    />

    <main class="flex-1 py-4 px-2 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
  <!-- <div class="min-h-screen flex bg-primary w-full">
    <Sidebar :items="sidebarItems" class="flex-shrink-0 w-64" />
    <main class="flex-grow p-4"><slot /></main>
  </div> -->
</template>

<script setup lang="ts">
import { ref } from "vue";

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const sidebarItems = ref([
  { text: "Dashboard", to: "/admin/dashboard" },
  { text: "Lorem Ipsum", to: "/" },
  { text: "Lorem Ipsum", to: "/" },
  { text: "Lorem Ipsum", to: "/" },
]);
</script>
