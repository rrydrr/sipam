<template>
  <Card>
    <div class="flex flex-row items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Menu Management</h1>
      <div class="space-x-2">
        <button
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Edit Menu
        </button>
        <button
          class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Add Menu
        </button>
      </div>
    </div>
    <div class="overflow-x-auto shadow-md sm:rounded-lg">
      <table
        class="min-w-full divide-y divide-gray-200 bg-white text-center align-middle"
      >
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              No.
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Description
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Category
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Image
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Active?
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="(menu, index) in menus"
            :key="menu.id"
            class="hover:bg-gray-100"
          >
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ index + 1 }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left"
            >
              {{ menu.name }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs text-left">
              {{ menu.description }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left"
            >
              {{ menu.category }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap"></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{
                new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(menu.price)
              }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <button
                @click="menu.active = !menu.active"
                :class="
                  menu.active
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                "
                class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors focus:outline-none"
                type="button"
              >
                {{ menu.active ? "Active" : "Inactive" }}
              </button>
            </td>
          </tr>
          <tr v-if="menus.length === 0">
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
              No menu items found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>
</template>

<script lang="ts" setup>
import Card from "~/components/Card.vue";

useHead({
  title: "Admin Dashboard | Menu",
});

definePageMeta({
  layout: "admin",
});

// Added a few more items for a better visual representation
const menus = ref([
  {
    id: 1,
    name: "Nasi Goreng",
    description: "Delicious fried rice with vegetables and chicken.",
    category: "Main Course",
    image: "nasi-goreng.jpg",
    price: 25000,
    active: true,
  },
  {
    id: 2,
    name: "Sate Ayam",
    description: "Grilled chicken skewers served with peanut sauce.",
    category: "Appetizer",
    image: "sate-ayam.jpg",
    price: 30000,
    active: true,
  },
  {
    id: 3,
    name: "Gado-Gado",
    description:
      "Indonesian salad with a variety of vegetables, tofu, and peanut sauce.",
    category: "Salad",
    image: "gado-gado.jpg",
    price: 22000,
    active: false,
  },
  {
    id: 4,
    name: "Es Teh Manis",
    description: "Classic sweet iced tea.",
    category: "Beverage",
    image: "es-teh.jpg",
    price: 8000,
    active: true,
  },
]);
</script>
