<template>
  <div class="p-4 md:p-6 bg-gray-50 min-h-screen">
    <div
      v-if="welcomeMessage"
      class="mb-6 p-4 bg-blue-500 text-white rounded-lg shadow-md"
    >
      <h1 class="text-xl font-semibold">{{ welcomeMessage }}</h1>
      <p v-if="userInfo" class="text-sm">
        Last Login: {{ formatDate(userInfo.lastLogin) }}
      </p>
    </div>
    <div
      v-else-if="fetchError"
      class="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md"
    >
      <h1 class="text-xl font-semibold">Error loading dashboard data</h1>
      <p class="text-sm">{{ fetchError }}</p>
    </div>
    <div
      v-else
      class="mb-6 p-4 bg-gray-200 text-gray-700 rounded-lg shadow-md animate-pulse"
    >
      <h1 class="text-xl font-semibold">Loading dashboard data...</h1>
    </div>

    <div class="flex flex-col md:flex-row md:items-start gap-6">
      <div class="w-full md:flex-[2] xl:flex-[3]">
        <Card :max-width="'max-w-full'" class="shadow-lg">
          <div class="p-4 sm:p-6">
            <h1
              class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center sm:text-left"
            >
              Pending Order Details
            </h1>
            <hr class="my-4 border-gray-200" />

            <div v-if="isLoading">
              <p class="text-center text-gray-500 py-4">Loading orders...</p>
            </div>
            <div v-else-if="incompleteOrders && incompleteOrders.length > 0">
              <div
                v-for="(order, orderIndex) in incompleteOrders"
                :key="order.id"
                class="mb-6 bg-white p-4 rounded-md shadow"
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 mb-3">
                  <div>
                    <h2
                      class="text-sm font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </h2>
                    <p class="text-base font-medium text-gray-700 break-all">
                      {{ order.id }}
                    </p>
                    <p
                      class="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-1"
                    >
                      Meja:
                      <span class="text-gray-700 font-bold">{{
                        order.meja
                      }}</span>
                    </p>
                  </div>
                  <div class="mt-2 sm:mt-0 sm:text-right">
                    <h2
                      class="text-sm font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Payment Status
                    </h2>
                    <span
                      :class="
                        order.isPaid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      "
                      class="font-semibold px-2 py-0.5 rounded-full text-xs"
                    >
                      {{ order.isPaid ? "Paid" : "Unpaid" }}
                    </span>
                    <p
                      class="mt-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1"
                    >
                      Total:
                      <span class="text-gray-700 font-bold"
                        >Rp {{ order.total.toLocaleString("id-ID") }}</span
                      >
                    </p>
                  </div>
                </div>

                <h3
                  class="text-sm font-semibold text-gray-500 mt-4 mb-2 pt-3 border-t border-gray-200 uppercase tracking-wider"
                >
                  Items
                </h3>

                <div v-if="order.items && order.items.length > 0">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <p class="text-base font-medium text-gray-800">
                      {{ item.name }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      Qty: {{ item.qty }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      Price: Rp {{ item.price.toLocaleString("id-ID") }}
                    </p>
                    <div class="flex items-center mt-2">
                      <p class="text-xs text-gray-500">
                        Item Status:
                        <span
                          :class="
                            item.isComplete
                              ? 'text-green-600 font-semibold'
                              : 'text-yellow-600 font-semibold'
                          "
                        >
                          {{ item.isComplete ? "Completed" : "Pending" }}
                        </span>
                      </p>
                      <button
                        @click="handleItemStatusToggle(order, item)"
                        :disabled="item.isComplete"
                        :class="[
                          'ml-3 text-[11px] leading-tight font-medium py-1 px-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-150',
                          item.isComplete
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-500',
                        ]"
                      >
                        {{ item.isComplete ? "Finished" : "Mark Finished" }}
                      </button>
                    </div>
                    <hr
                      v-if="orderIndex < incompleteOrders.length - 1"
                      class="my-6 border-t border-gray-300"
                    />
                  </div>
                </div>
                <div v-else class="py-3">
                  <p class="text-sm text-gray-500 italic">
                    No items in this order.
                  </p>
                </div>

                <button
                  @click="handleOrderStatusToggle(order)"
                  :disabled="order.isComplete || !order.isPaid"
                  :class="[
                    'mt-5 w-full text-sm font-semibold py-2 px-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all duration-150 ease-in-out',
                    order.isComplete || !order.isPaid
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-indigo-500 hover:shadow-md',
                  ]"
                  :title="
                    order.isComplete
                      ? 'Order is already completed.'
                      : !order.isPaid
                      ? 'Order must be paid before it can be completed.'
                      : 'Complete this order'
                  "
                >
                  {{
                    order.isComplete ? "Order Completed" : "Complete This Order"
                  }}
                </button>
              </div>
            </div>
            <div v-else-if="!isLoading">
              <p class="text-center text-gray-500 py-6">
                No pending orders to display.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div class="w-full md:flex-1">
        <Card :max-width="'max-w-full'" class="shadow-lg">
          <div class="p-4 sm:p-6">
            <div v-if="isLoading || !cabangInfo">
              <h1
                class="text-xl sm:text-2xl font-semibold text-gray-800 mb-1 animate-pulse"
              >
                Loading status...
              </h1>
              <p class="text-xs text-gray-500 mb-4 animate-pulse">
                Please wait...
              </p>
              <div
                class="w-full h-10 bg-gray-300 rounded-lg animate-pulse"
              ></div>
            </div>
            <div v-else>
              <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
                Status Toko: {{ cabangInfo.name }}
                <span
                  :class="cabangInfo.isOpen ? 'text-green-600' : 'text-red-600'"
                  class="font-bold"
                >
                  {{ cabangInfo.isOpen ? "Buka" : "Tutup" }}
                </span>
              </h1>
              <p class="text-xs text-gray-500 mb-4">
                Terakhir
                {{ cabangInfo.isOpen ? "Dibuka Kembali" : "Ditutup" }} pada:
                {{ formatDate(cabangInfo.lastOpened) }}
              </p>
              <button
                @click="toggleShopStatus"
                :class="[
                  'w-full font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75',
                  cabangInfo.isOpen
                    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                    : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
                ]"
              >
                {{ cabangInfo.isOpen ? "Tutup Toko" : "Buka Toko" }}
              </button>
            </div>
          </div>
        </Card>
        <Card :max-width="'max-w-full'" class="shadow-lg" :margin="'mt-6'">
          <div class="p-4 sm:p-6">
            <h1 class="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
              Generate QR Code Order
            </h1>
            <div v-if="isLoading || !userInfo">
              <p class="text-center text-gray-500 py-4 animate-pulse">
                Loading...
              </p>
            </div>
            <div v-else>
              <Input
                v-model="meja"
                label="Meja"
                type="text"
                name="meja"
                id="order-meja"
                required
              />
              <button
                @click="generateOrder"
                :class="[
                  'w-full font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75',
                  'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
                ]"
              >
                Generate QR Code
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { useCookie, useAsyncData, useRouter } from "#app";

useHead({
  title: "Admin Dashboard",
});

definePageMeta({
  layout: "admin",
});

interface ApiOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  isDelivered: boolean;
}

interface ApiOrder {
  id: string;
  meja: number;
  total: number;
  isDone: boolean;
  isPaid: boolean;
  items: ApiOrderItem[];
}

interface CabangData {
  id: number;
  name: string;
  isOpen: boolean;
  lastOpened: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  username: string;
  level: number;
  lastLogin: string;
}

interface AdminDashboardResponse {
  success: boolean;
  message: string;
  userData: UserData;
  data: {
    cabang: CabangData;
    orders: ApiOrder[];
  };
}

interface CabangTutupResponse {
  success: boolean;
  message: string;
  data: CabangData;
}

interface CabangBukaResponse {
  success: boolean;
  message: string;
  data: CabangData;
}

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  isComplete: boolean;
}

interface Order {
  id: string;
  total: number;
  meja: number;
  isComplete: boolean;
  isPaid: boolean;
  items: OrderItem[];
}

interface CompleteItemResponse {
  success: boolean;
  message: string;
  data?: {
    item: {
      id: string;
      isDelivered: boolean; // Maps to our local isComplete
    };
  };
}

interface CompleteOrderResponse {
  success: boolean;
  message: string;
  // No 'data' field was specified in the expected success response
}

const meja = ref<string>("");
const welcomeMessage = ref<string | null>(null);
const userInfo = ref<UserData | null>(null);
const cabangInfo = ref<CabangData | null>(null);
const allOrders = ref<Order[]>([]);
const isLoading = ref(true);
const fetchError = ref<string | null>(null);
let pollingIntervalId: ReturnType<typeof setInterval> | undefined = undefined;

const authToken = useCookie<string | undefined>("authToken");
const router = useRouter();

const {
  data: dashboardData,
  error: asyncDataError,
  pending,
  refresh: refreshDashboardData,
} = await useAsyncData<AdminDashboardResponse>(
  "adminDashboardData",
  async () => {
    const token = authToken.value;
    if (!token) {
      return Promise.reject(
        new Error("Authentication token is missing. Please log in.")
      );
    }

    try {
      const response = await $fetch<AdminDashboardResponse>(
        "/api/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response && response.success && response.data && response.userData) {
        return response;
      } else {
        throw new Error("Received invalid data from the server.");
      }
    } catch (err: any) {
      const message =
        err.data?.message || err.message || "Failed to load dashboard data.";
      return Promise.reject(new Error(message));
    }
  }
);

watchEffect(() => {
  isLoading.value = pending.value;

  if (asyncDataError.value) {
    fetchError.value =
      asyncDataError.value.message || "An unknown error occurred.";
    welcomeMessage.value = null;
    userInfo.value = null;
    cabangInfo.value = null;
    allOrders.value = [];
  } else if (dashboardData.value) {
    if (dashboardData.value.success) {
      welcomeMessage.value = dashboardData.value.message;
      userInfo.value = dashboardData.value.userData;
      cabangInfo.value = dashboardData.value.data.cabang;
      allOrders.value = dashboardData.value.data.orders.map((apiOrder) => ({
        id: apiOrder.id,
        meja: apiOrder.meja,
        total: apiOrder.total,
        isComplete: apiOrder.isDone,
        isPaid: apiOrder.isPaid,
        items: apiOrder.items.map((apiItem) => ({
          id: apiItem.id,
          name: apiItem.name,
          price: apiItem.price,
          qty: apiItem.qty,
          isComplete: apiItem.isDelivered,
        })),
      }));
      fetchError.value = null;
    } else {
      fetchError.value =
        dashboardData.value.message || "API request was not successful.";
    }
  }
});

onMounted(() => {
  pollingIntervalId = setInterval(() => {
    refreshDashboardData();
  }, 30000); // Poll every 30 seconds
});

onUnmounted(() => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
  }
});

const incompleteOrders = computed(() => {
  return allOrders.value.filter((order) => !order.isComplete);
});

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return dateString;
  }
};

// const handleItemStatusToggle = (order: Order, item: OrderItem) => {
//   if (!item.isComplete) {
//     const targetOrder = allOrders.value.find((o) => o.id === order.id);
//     if (targetOrder) {
//       const targetItem = targetOrder.items.find((i) => i.id === item.id);
//       if (targetItem) {
//         targetItem.isComplete = true;
//       }
//     }
//   }
// };
const handleItemStatusToggle = async (order: Order, item: OrderItem) => {
  if (item.isComplete) {
    // Optionally inform the user or simply do nothing if already complete
    // console.log("Item is already complete.");
    return;
  }

  // Optional: Add an item-specific loading state if you want to disable the button
  // or show a spinner during the API call. For this, you would need to add
  // an `isLoading` property to your `OrderItem` interface and manage it.
  // For example: item.isLoading = true;

  const token = authToken.value;
  if (!token) {
    alert("Authentication error: You might need to log in again.");
    // if (item.isLoading) item.isLoading = false;
    return;
  }

  try {
    const response = await $fetch<CompleteItemResponse>(
      "/api/admin/order/completeItem",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: {
          idItem: item.id,
        },
      }
    );

    if (response.success && response.data?.item) {
      const targetOrder = allOrders.value.find((o) => o.id === order.id);
      if (targetOrder) {
        const targetItem = targetOrder.items.find((i) => i.id === item.id);
        if (targetItem) {
          targetItem.isComplete = response.data.item.isDelivered;
          // Optionally, show a success message, e.g., using a toast notification
          // alert(response.message);
          console.log(
            "Item status updated successfully via API:",
            response.message
          );

          // Check if all items in this order are now complete
          const allItemsComplete = targetOrder.items.every((i) => i.isComplete);
          if (allItemsComplete && !targetOrder.isComplete) {
            // If you have a separate API to mark the order as complete, call it here
            // or prompt the user to mark the order as complete.
            // For now, let's assume the "Complete This Order" button is still the way
            // to mark the entire order as complete explicitly by the user.
            console.log(
              `All items for order ${targetOrder.id} are complete. User can now mark order as complete.`
            );
          }
        }
      }
    } else {
      // API returned success: false or data was missing
      alert(
        `Failed to update item: ${
          response.message || "Unknown error from server."
        }`
      );
      console.error(
        "API Error - Failed to update item status:",
        response.message,
        response
      );
    }
  } catch (err: any) {
    const errorMessage =
      err.data?.message ||
      err.message ||
      "An unexpected network error occurred.";
    alert(`Error updating item status: ${errorMessage}`);
    console.error("Fetch/Network Error - Failed to update item status:", err);
    // You could also set fetchError.value = errorMessage; to display it in the main error area.
  } finally {
    // if (item.isLoading) item.isLoading = false; // Reset item-specific loading state
  }
};

// const handleOrderStatusToggle = (order: Order) => {
//   if (!order.isComplete) {
//     const targetOrder = allOrders.value.find((o) => o.id === order.id);
//     if (targetOrder) {
//       targetOrder.isComplete = true;
//       targetOrder.items.forEach((item) => (item.isComplete = true));
//     }
//   }
// };

const handleOrderStatusToggle = async (order: Order) => {
  // Double-check conditions, though the button's :disabled state should mostly handle this.
  if (order.isComplete) {
    // This case should ideally not be reachable if the button is correctly disabled.
    alert("This order is already marked as complete.");
    return;
  }
  if (!order.isPaid) {
    // This case should also ideally not be reachable.
    alert("Order must be paid before it can be completed.");
    return;
  }

  // Optional: Implement a loading state for the specific order or button if desired
  // For example, you could add an `isCompleting` property to the Order interface:
  // order.isCompleting = true;

  const token = authToken.value;
  if (!token) {
    alert(
      "Authentication error: Unable to process request. Please log in again."
    );
    // if (order.isCompleting) order.isCompleting = false;
    return;
  }

  try {
    const response = await $fetch<CompleteOrderResponse>(
      "/api/admin/order/completeOrder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: {
          idOrder: order.id, // Send the order ID in the request body
        },
      }
    );

    if (response.success) {
      // alert(response.message); // Optionally show success message to the user

      // For immediate UI feedback, update the local state.
      // The refreshDashboardData call will later fetch the authoritative state.
      const targetOrderInAllOrders = allOrders.value.find(
        (o) => o.id === order.id
      );
      if (targetOrderInAllOrders) {
        targetOrderInAllOrders.isComplete = true;
        // As the backend auto-completes items, reflect this on the frontend too.
        targetOrderInAllOrders.items.forEach((item) => {
          item.isComplete = true;
        });
      }

      console.log("Order completed successfully via API:", response.message);

      // Refresh the dashboard data to get the latest state from the server.
      // This will typically remove the order from the 'incompleteOrders' list.
      await refreshDashboardData();
    } else {
      // API returned success: false
      alert(
        `Failed to complete order: ${
          response.message || "An unknown server error occurred."
        }`
      );
      console.error(
        "API Error - Failed to complete order:",
        response.message,
        response
      );
    }
  } catch (err: any) {
    const errorMessage =
      err.data?.message ||
      err.message ||
      "An unexpected network error occurred while completing the order.";
    alert(`Error: ${errorMessage}`);
    console.error("Fetch/Network Error - Failed to complete order:", err);
    // You might want to set a general fetchError here if it's a persistent issue.
    // fetchError.value = errorMessage;
  } finally {
    // if (order.isCompleting) order.isCompleting = false; // Reset loading state
  }
};

const toggleShopStatus = async () => {
  if (cabangInfo.value) {
    const endpoint = cabangInfo.value.isOpen
      ? "/api/admin/cabang/tutup"
      : "/api/admin/cabang/buka";
    const action = cabangInfo.value.isOpen ? "Closing" : "Opening";

    const { data: apiResponse, error: asyncDataErrorVal } = await useAsyncData<
      CabangTutupResponse | CabangBukaResponse
    >(
      `cabang${action}Data`,
      async () => {
        try {
          const token = authToken.value;
          if (!token) {
            throw new Error("Authentication token is missing. Please log in.");
          }

          const response = await $fetch<
            CabangTutupResponse | CabangBukaResponse
          >(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response && response.success && response.data) {
            if (cabangInfo.value) {
              cabangInfo.value.isOpen = !cabangInfo.value.isOpen;
              cabangInfo.value.lastOpened = new Date().toISOString();
            }
            return response;
          } else {
            throw new Error(
              `Received invalid data from the server when trying to ${action.toLowerCase()} the shop.`
            );
          }
        } catch (err: any) {
          const message =
            err.data?.message ||
            err.message ||
            `Failed to ${action.toLowerCase()} shop.`;
          throw new Error(message);
        }
      },
      {
        immediate: true,
      }
    );

    if (asyncDataErrorVal.value) {
      // Handle error in UI if needed
    } else if (apiResponse.value && apiResponse.value.success) {
      // Optionally refresh other data
      // await refreshDashboardData();
    }
  }
};

// Assume these are defined in your Vue component's setup script:
// import { ref } from 'vue';
// const meja = ref<string>(""); // <<< meja ref as specified
// const userInfo = ref<UserType | null>(null); // Replace UserType with your actual user type
// const authToken = ref<string | null>(null);
// const fetchError = ref<string | null>(null);
//
// Assume $fetch is available (e.g., from Nuxt or a library like ohmyfetch)
// Assume a router instance is available for navigation (e.g., from Vue Router's useRouter())

const generateOrder = async () => {
  if (!userInfo.value) {
    console.error("User information or user ID is not available.");
    return;
  }

  // --- Get and validate idMeja from meja.value ---
  if (!meja.value || meja.value.trim() === "") {
    if (fetchError && typeof fetchError.value !== "undefined") {
      alert("Table ID (meja) is required and cannot be empty.");
      fetchError.value = "Table ID (meja) is required and cannot be empty.";
    }
    return;
  }

  const idMejaFromString = meja.value;
  const parsedIdMeja = parseInt(idMejaFromString, 10);

  if (isNaN(parsedIdMeja)) {
    if (fetchError && typeof fetchError.value !== "undefined") {
      alert(`Invalid Table ID: '${idMejaFromString}' is not a valid number.`);
      fetchError.value = `Invalid Table ID: '${idMejaFromString}' is not a valid number. Please enter a valid numeric table ID.`;
    }
    return;
  }

  try {
    console.log(
      `Attempting to create order for user: ${userInfo.value.username}, Table: ${parsedIdMeja}`
    );

    const requestBody = {
      idMeja: parsedIdMeja,
    };

    const response = await $fetch<any>("/api/admin/order/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken.value}`,
      },
      body: requestBody,
    });

    if (response && response.success && response.data && response.data.qrCode) {
      console.log("Order created successfully:", response.message);
      const qrCodeBase64 = response.data.qrCode;
      const orderId = response.data.order.id;

      router.push({
        path: "/admin/qrcode",
        state: {
          qrCodeData: qrCodeBase64,
          orderId: orderId,
        },
      });
    } else {
      const errorMessage =
        response?.message ||
        "Failed to create order or QR code not found in response.";
      console.error(
        "API Error - Failed to create order:",
        errorMessage,
        "Full response:",
        response
      );
      if (fetchError && typeof fetchError.value !== "undefined") {
        fetchError.value = errorMessage;
      }
    }
  } catch (error: any) {
    if (fetchError && typeof fetchError.value !== "undefined") {
      const message =
        error?.data?.message ||
        error?.message ||
        "An unexpected error occurred.";
      fetchError.value = message;
      alert(`Error: ${message}`);
    }
  }
};
</script>

<style scoped>
.break-all {
  word-break: break-all;
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.shadow-lg
  > div:has(
    h1.text-xl.sm\\:text-2xl.font-semibold.text-gray-800.mb-4:contains(
        "Generate QR Code Order"
      )
  ) {
  padding: 1rem;
}

@media (min-width: 640px) {
  .shadow-lg
    > div:has(
      h1.text-xl.sm\\:text-2xl.font-semibold.text-gray-800.mb-4:contains(
          "Generate QR Code Order"
        )
    ) {
    padding: 1.5rem;
  }
}
</style>
