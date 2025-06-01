<template>
  <div
    class="container mx-auto p-4 sm:p-6 lg:p-8 antialiased text-gray-800 min-h-screen bg-gray-50"
  >
    <div v-if="pending && !orderData" class="text-center py-20">
      <div class="inline-flex items-center bg-white p-6 rounded-lg shadow-xl">
        <svg
          class="animate-spin h-8 w-8 text-blue-600 mr-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p class="text-xl text-gray-600 font-medium">
          Loading order details...
        </p>
      </div>
    </div>

    <div
      v-else-if="pageError || fetchError"
      class="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-lg mb-8"
      role="alert"
    >
      <div class="flex">
        <div class="py-1">
          <svg
            class="fill-current h-6 w-6 text-red-500 mr-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path
              d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828-1.415-1.415L10 8.586 7.172 5.757 5.757 7.172 8.586 10l-2.829 2.828 1.415 1.415L10 11.414l2.828 2.829 1.415-1.415L11.414 10z"
            />
          </svg>
        </div>
        <div>
          <p class="font-bold text-lg">Unable to load order details</p>
          <p class="text-sm">
            {{
              pageError || fetchError?.message || "An unknown error occurred."
            }}
          </p>
          <p v-if="fetchError?.message" class="text-xs text-red-600 mt-1">
            Error Code: {{ fetchError.message }}
          </p>
        </div>
      </div>
    </div>

    <div v-else-if="orderData" class="space-y-8">
      <header class="bg-white shadow-xl rounded-lg p-6 ring-1 ring-gray-900/5">
        <div class="flex justify-between items-center mb-2">
          <h1 class="text-3xl font-bold text-gray-900">Order Details</h1>
          <div
            v-if="pending && orderData"
            class="flex items-center text-sm text-blue-600"
          >
            <svg
              class="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Refreshing...
          </div>
        </div>
        <p class="text-sm text-gray-500">
          Order ID:
          <span
            class="font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-700"
            >{{ orderData.id }}</span
          >
        </p>
      </header>

      <section
        class="mt-8 bg-white shadow-xl rounded-lg p-6 ring-1 ring-gray-900/5"
      >
        <h2 class="text-xl font-semibold text-gray-800 mb-3">
          Overall Order Status
        </h2>
        <p class="text-lg">
          <span
            :class="
              orderData.isDone
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            "
            class="px-3 py-1 rounded-full font-semibold"
          >
            {{ orderData.isDone ? "Completed" : "In Progress" }}
          </span>
        </p>
      </section>

      <section class="bg-white shadow-xl rounded-lg p-6 ring-1 ring-gray-900/5">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4 border-b pb-3">
          Items
        </h2>
        <div
          v-if="orderData.Item && orderData.Item.length > 0"
          class="space-y-4"
        >
          <div
            v-for="item in orderData.Item"
            :key="item.id"
            class="flex justify-between items-start p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150 ease-in-out"
          >
            <div>
              <p class="font-medium text-gray-800">{{ item.menu.name }}</p>
              <p class="text-sm text-gray-500">Quantity: {{ item.qty }}</p>
              <p class="text-sm text-gray-500">
                Delivered:
                <span
                  :class="
                    item.isDelivered
                      ? 'text-green-600 font-semibold'
                      : 'text-yellow-600 font-semibold'
                  "
                  >{{ item.isDelivered ? "Yes" : "No" }}</span
                >
              </p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-800">
                {{ formatCurrency(item.price * item.qty) }}
              </p>
              <p v-if="item.qty > 1" class="text-xs text-gray-400">
                ({{ formatCurrency(item.price) }} each)
              </p>
            </div>
          </div>
        </div>
        <div v-else>
          <p class="text-gray-500 italic">No items in this order.</p>
        </div>

        <div
          class="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-6"
        >
          <div
            v-if="orderData.note"
            class="w-full sm:w-1/2 md:w-2/3 bg-yellow-50 shadow-md rounded-lg p-4 ring-1 ring-yellow-500/30 order-1 sm:order-none"
          >
            <h3 class="text-lg font-semibold text-yellow-800 mb-2">
              Order Notes
            </h3>
            <p class="text-sm text-yellow-700 italic">{{ orderData.note }}</p>
          </div>

          <div
            :class="[
              'text-right',
              orderData.note
                ? 'w-full sm:w-auto order-2 sm:order-none'
                : 'w-full order-1 sm:order-none',
            ]"
            class="mt-2 sm:mt-0"
          >
            <p class="text-2xl font-bold text-gray-900">
              Total: {{ formatCurrency(orderData.total) }}
            </p>
          </div>
        </div>
      </section>

      <section class="bg-white shadow-xl rounded-lg p-6 ring-1 ring-gray-900/5">
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">
          Payment Status
        </h2>
        <p
          :class="orderData.isPaid ? 'text-green-600' : 'text-red-600'"
          class="font-bold text-xl mb-4"
        >
          {{ orderData.isPaid ? "PAID" : "NOT PAID" }}
        </p>
        <div v-if="!orderData.isPaid">
          <p class="text-gray-600 mb-4">
            Please complete your payment to proceed with the order.
          </p>
          <button
            @click="handlePayNow"
            :disabled="orderData.isPaid || processingPayment"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            <svg
              v-if="processingPayment"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ processingPayment ? "Processing Payment..." : "Pay Now" }}
          </button>
          <p v-if="paymentError" class="text-red-500 text-sm mt-3">
            {{ paymentError }}
          </p>
        </div>
        <div v-else>
          <p
            class="text-green-700 bg-green-50 p-4 rounded-md border border-green-200 text-center"
          >
            Thank you for your payment! Your order is being processed.
          </p>
        </div>
      </section>
    </div>
    <div v-else class="text-center py-20">
      <div class="inline-flex items-center bg-white p-6 rounded-lg shadow-xl">
        <svg
          class="h-8 w-8 text-gray-400 mr-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-xl text-gray-500 font-medium">No order data found.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, createError } from "#app"; // Nuxt auto-imports these

// Define interfaces for type safety
interface MenuItem {
  name: string;
}

interface OrderItem {
  id: string;
  idMenu: number;
  idOrder: string;
  qty: number;
  price: number;
  isDelivered: boolean;
  created_at: string; // Assuming string from API, can be Date if parsed
  updated_at: string; // Assuming string from API, can be Date if parsed
  menu: MenuItem;
}

interface OrderDetails {
  id: string;
  isDone: boolean;
  total: number;
  Item: OrderItem[];
  note?: string;
  isPaid: boolean;
}

interface ApiResponse {
  order: OrderDetails;
}

interface PaymentApiResponse {
  success: boolean;
  message: string;
  data?: {
    // The data field itself is optional based on typical API designs
    item: {
      id: string;
      idMeja?: number; // Marking as optional if not strictly needed by frontend logic post-payment
      idUser?: number; // Marking as optional
      idCabang?: number; // Marking as optional
      total: number;
      isPaid: boolean;
      isDone: boolean;
    };
  };
}

const route = useRoute();
const idOrder = computed(() => route.params.idOrder as string | undefined);
const customerToken = useCookie<string | undefined>("customerToken");

const pageError = ref<string | null>(null); // For custom errors or more context
const processingPayment = ref<boolean>(false);
const paymentError = ref<string | null>(null);

const POLLING_INTERVAL_MS = 30000; // 30 seconds
let pollingInterval: NodeJS.Timeout | null = null;

// useAsyncData for fetching order details
const {
  data: orderResponse, // Ref<ApiResponse | null>
  pending, // Ref<boolean>
  error: fetchError, // Ref<Error | null>
  refresh: refreshOrderDetails,
} = await useAsyncData<ApiResponse, Error>( // Explicitly type Error for fetchError
  `orderDetails-${idOrder.value}`, // Unique key for caching and refetching, reactive to idOrder
  async () => {
    pageError.value = null; // Clear previous custom errors on new fetch attempt

    if (!idOrder.value) {
      const msg = "Order ID is missing from the route.";
      pageError.value = msg;
      throw createError({ statusCode: 400, statusMessage: msg, fatal: true });
    }
    if (!customerToken.value) {
      const msg = "Authentication token not found. Please log in.";
      pageError.value = msg;
      throw createError({ statusCode: 401, statusMessage: msg, fatal: true });
    }

    try {
      // $fetch is Nuxt's utility for making API requests
      const response = await $fetch<ApiResponse>(
        `/api/order/${idOrder.value}/getItemStatus`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${customerToken.value}`,
            "Content-Type": "application/json",
          },
          // $fetch automatically throws an error for non-2xx responses
          // You can add a timeout here if needed: timeout: 5000
        }
      );

      if (!response || !response.order) {
        const msg = "Order data is malformed or missing in the API response.";
        pageError.value = msg;
        // It's better to throw an error that useAsyncData can catch
        throw createError({ statusCode: 500, statusMessage: msg });
      }
      return response;
    } catch (e: any) {
      // Log the actual error from $fetch for debugging
      console.error("Error fetching order details with $fetch:", e);

      // Set pageError for UI display, prioritize specific messages from error response
      if (e.data && e.data.message) {
        // Nuxt $fetch error structure
        pageError.value = `API Error: ${e.data.message}`;
      } else if (e.statusMessage) {
        // Error from createError
        pageError.value = e.statusMessage;
      } else if (e.message) {
        pageError.value = e.message;
      } else {
        pageError.value =
          "Failed to fetch order details. An unexpected error occurred.";
      }
      // Re-throw the error so useAsyncData can populate `fetchError`
      // and handle server-side error rendering if `fatal: true` was used.
      throw e;
    }
  },
  {
    // `watch` allows useAsyncData to re-run if these reactive sources change.
    // `idOrder` changes will trigger re-fetch due to key change.
    // `customerToken` changes could also trigger re-fetch if added to watch.
    // For polling, we'll use setInterval + refresh().
    // watch: [customerToken] // Uncomment if you want to auto-refresh if token changes
  }
);

// Computed property to safely access the nested order data
const orderData = computed(() => orderResponse.value?.order);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const handlePayNow = async () => {
  if (!orderData.value || orderData.value.isPaid) {
    return;
  }

  // Ensure idOrder (which is orderData.value.id here) is available
  if (!orderData.value.id) {
    paymentError.value = "Order ID is missing. Cannot proceed with payment.";
    console.error("Order ID missing from orderData for payment.");
    return;
  }

  if (!customerToken.value) {
    paymentError.value =
      "Authentication token not found. Please log in to pay.";
    return;
  }

  processingPayment.value = true;
  paymentError.value = null;

  try {
    // Construct the payment API endpoint using the order's ID
    const paymentApiEndpoint = `/api/order/${orderData.value.id}/payment`;

    // Perform the API call
    const response = await $fetch<PaymentApiResponse>(paymentApiEndpoint, {
      method: "POST", // Or 'PUT', depending on your API's convention for such actions
      headers: {
        Authorization: `Bearer ${customerToken.value}`,
        "Content-Type": "application/json", // Good practice, even with no body
      },
      // No request body as specified
    });

    if (response.success) {
      // Payment was successful according to the API
      // Refresh order details to get the latest status (e.g., isPaid will be true)
      await refreshOrderDetails();

      // After refresh, check if the refresh itself had issues
      if (fetchError.value) {
        paymentError.value = `Payment recorded, but failed to update order display: ${fetchError.value.message}. Please refresh.`;
        console.warn(
          "Payment successful, but order refresh failed:",
          fetchError.value
        );
      } else if (pageError.value) {
        paymentError.value = `Payment recorded, but failed to update order display: ${pageError.value}. Please refresh.`;
        console.warn(
          "Payment successful, but order refresh led to pageError:",
          pageError.value
        );
      } else {
        // Successfully paid and order details refreshed.
        // The UI will update reactively due to changes in orderData.
        console.log(
          response.message || "Payment processed and order details updated."
        );
        // You could set a temporary success message here if desired,
        // but the UI should update based on orderData.isPaid
      }
    } else {
      // API indicated payment was not successful (e.g., business logic failure)
      paymentError.value =
        response.message || "Payment was not successful. Please try again.";
    }
  } catch (e: any) {
    // Error occurred during the $fetch call (e.g., network error, non-2xx response)
    console.error("Payment processing error:", e);
    if (e.data && e.data.message) {
      // Nuxt $fetch error structure
      paymentError.value = `Payment Error: ${e.data.message}`;
    } else if (e.message) {
      paymentError.value = `Payment Error: ${e.message}`;
    } else {
      paymentError.value =
        "Payment failed due to an unexpected error. Please try again.";
    }
  } finally {
    processingPayment.value = false;
  }
};

onMounted(() => {
  // Initial fetch is handled by useAsyncData.
  // Start polling only if there's an order ID and no fatal initial error preventing data display.
  if (
    idOrder.value &&
    (!fetchError.value || (fetchError.value && !fetchError.value.message))
  ) {
    pollingInterval = setInterval(async () => {
      if (!document.hidden) {
        // Optional: only poll if the tab is active/visible
        console.log(`Polling for order updates (ID: ${idOrder.value})...`);
        try {
          await refreshOrderDetails(); // Re-runs the async function in useAsyncData
        } catch (e) {
          // Errors are handled by useAsyncData's `fetchError` and the `pageError` ref.
          console.warn(
            "Polling refresh attempt failed. Error should be reflected in UI.",
            e
          );
        }
      }
    }, POLLING_INTERVAL_MS);
  } else {
    console.log(
      "Polling not started due to missing Order ID or fatal initial error."
    );
  }
});

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("Polling stopped.");
  }
});

// Set page title (Nuxt 3 specific)
useHead({
  title: computed(() =>
    orderData.value ? `Order ${orderData.value.id}` : "Order Details"
  ),
});
</script>

<style>
/* Tailwind base, components, and utilities are typically configured in nuxt.config.ts */
/* Ensure your nuxt.config.ts has Tailwind CSS setup */
body {
  /* background-color: #f3f4f6; /* Tailwind's bg-gray-100, already set on root div */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
