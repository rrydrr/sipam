<template>
  <div class="container mx-auto p-4 antialiased text-gray-800">
    <div v-if="tokenForDisplay">
      <div v-if="isLoadingMenu" class="text-center py-10">
        <svg
          class="animate-spin h-8 w-8 text-blue-500 mx-auto"
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
        <p class="mt-2 text-gray-600">Loading Menu...</p>
      </div>

      <div
        v-else-if="menuError"
        class="text-center py-10 bg-red-50 text-red-700 p-4 rounded-md shadow"
      >
        <p class="font-semibold">Error loading menu:</p>
        <p>{{ menuError }}</p>
      </div>

      <div
        v-else-if="Object.keys(menuCategories).length === 0 && !isLoadingMenu"
        class="text-center py-10 bg-yellow-50 text-yellow-700 p-4 rounded-md shadow"
      >
        <p>No menu items available at the moment. Please check back later.</p>
      </div>

      <div v-else class="order-page">
        <h2 class="text-3xl font-bold my-8 text-center text-gray-700">
          Our Menu
        </h2>

        <div
          v-for="(items, categoryName) in menuCategories"
          :key="categoryName"
          class="mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg"
        >
          <h3
            class="text-2xl font-semibold mb-6 text-blue-600 border-b-2 border-blue-200 pb-3"
          >
            {{ categoryName }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="item in items.filter((i) => i.isActive)"
              :key="item.id"
              class="menu-item border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-gray-50"
            >
              <img
                :src="item.image"
                :alt="item.name"
                class="w-full h-48 object-cover"
              />
              <div class="p-4 sm:p-5 flex flex-col flex-grow">
                <h4 class="text-xl font-semibold text-gray-800 mb-2">
                  {{ item.name }}
                </h4>
                <p
                  v-if="item.description"
                  class="text-sm text-gray-600 mb-3 flex-grow min-h-[3em]"
                >
                  {{ item.description }}
                </p>
                <p class="text-lg font-bold text-blue-500 mb-4">
                  IDR {{ item.price.toLocaleString() }}
                </p>
                <div class="mt-auto flex items-center">
                  <label :for="'qty-' + item.id" class="sr-only"
                    >Quantity for {{ item.name }}</label
                  >
                  <button
                    @click="decrementQuantity(item.id)"
                    class="px-3 py-2 border border-gray-300 rounded-l-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="itemQuantities[item.id] === 0"
                    aria-label="Decrease quantity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <input
                    type="number"
                    :id="'qty-' + item.id"
                    v-model.number="itemQuantities[item.id]"
                    min="0"
                    @input="ensurePositiveQuantity(item.id)"
                    class="w-16 p-2 border-t border-b border-gray-300 text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                    aria-label="Item quantity"
                  />
                  <button
                    @click="incrementQuantity(item.id)"
                    class="px-3 py-2 border border-gray-300 rounded-r-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4 p-3 bg-gray-200 rounded-md shadow">
          <p class="text-sm">
            Id Order: <span class="font-semibold">{{ idOrder }}</span>
          </p>
        </div>

        <div
          v-if="orderSummaryItems.length > 0"
          class="mt-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-xl"
        >
          <h3 class="text-2xl font-semibold mb-6 text-center text-indigo-700">
            Order Summary
          </h3>
          <ul class="space-y-3 mb-6">
            <li
              v-for="summaryItem in orderSummaryItems"
              :key="summaryItem.id"
              class="flex justify-between items-center p-3 bg-white rounded-md shadow-sm"
            >
              <div>
                <span class="font-medium text-gray-800">{{
                  summaryItem.name
                }}</span>
                <span class="text-sm text-gray-600">
                  (Qty: {{ summaryItem.qty }})</span
                >
              </div>
              <span class="font-semibold text-indigo-600"
                >IDR {{ summaryItem.lineTotal.toLocaleString() }}</span
              >
            </li>
          </ul>
          <div class="border-t-2 border-indigo-200 pt-4">
            <h4
              class="flex justify-between items-center text-xl font-bold text-indigo-800"
            >
              <span>Total:</span>
              <span>IDR {{ orderTotal.toLocaleString() }}</span>
            </h4>
          </div>
          <div class="mt-6 mb-4">
            <label
              for="sellerNote"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Nota untuk Penjual (Opsional):</label
            >
            <textarea
              id="sellerNote"
              v-model="sellerNote"
              rows="3"
              class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Contoh: Tolong jangan pakai bawang, atau sambal dipisah."
            ></textarea>
          </div>
          <button
            @click="submitOrder"
            :disabled="orderItemsForPayload.length === 0 || isSubmittingOrder"
            class="mt-8 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmittingOrder ? "Placing Order..." : "Place Order" }}
          </button>
        </div>

        <div
          v-else-if="
            !isLoadingMenu &&
            !menuError &&
            Object.keys(menuCategories).length > 0
          "
          class="mt-10 text-center p-6 bg-gray-50 rounded-lg shadow"
        >
          <p class="text-gray-600">
            Your order is empty. Please add items from the menu.
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10">
      <p class="text-gray-600">
        {{
          tokenForDisplay === null && initialCheckDone
            ? "Authentication required to view the menu. You may be redirected."
            : "Initializing..."
        }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, navigateTo, useCookie } from "#app";
import { $fetch } from "ofetch";

const route = useRoute();
const idOrder = route.params.idOrder as string;
const initialCheckDone = ref(false);
const { csrf } = useCsrf();

const cookieName = "customerToken";
const cookieOptions = {
  maxAge: 60 * 60 * 6,
  path: "/order/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

const authTokenCookie = useCookie<string | null>(cookieName, cookieOptions);

const queryTokenRaw = route.query.token;
let tokenInQuery: string | null = null;

if (Array.isArray(queryTokenRaw)) {
  tokenInQuery = queryTokenRaw.length > 0 ? queryTokenRaw[0] : null;
} else if (typeof queryTokenRaw === "string") {
  tokenInQuery = queryTokenRaw;
}

let activeTokenDetermined: string | null = null;

if (tokenInQuery) {
  activeTokenDetermined = tokenInQuery;
  authTokenCookie.value = activeTokenDetermined;
} else if (authTokenCookie.value) {
  activeTokenDetermined = authTokenCookie.value;
}

const tokenForDisplay = ref<string | null>(activeTokenDetermined);

if (process.client) {
  if (!tokenForDisplay.value && route.path !== "/") {
  }
  initialCheckDone.value = true;
} else {
  if (!tokenForDisplay.value) {
    initialCheckDone.value = true;
  }
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  isActive: boolean;
}

interface MenuApiResponse {
  success: boolean;
  message: string;
  data: {
    menu: Record<string, MenuItem[]>;
  };
}

interface OrderItemStatusDetail {
  id: string;
  idMenu: number;
  idOrder: string;
  qty: number;
  price: number;
  isDelivered: boolean;
  created_at: string;
  updated_at: string;
}

interface OrderWithStatus {
  id: string;
  isDone: boolean;
  total: number;
  Item: OrderItemStatusDetail[];
  note: string;
  isPaid: boolean;
}

interface GetItemStatusApiResponse {
  order: OrderWithStatus;
  success?: boolean;
  message?: string;
}

const menuCategories = ref<Record<string, MenuItem[]>>({});
const isLoadingMenu = ref(true);
const menuError = ref<string | null>(null);
const currentOrderStatus = ref<OrderWithStatus | null>(null);
const isLoadingOrderStatus = ref(false);
const orderStatusError = ref<string | null>(null);

async function fetchMenuData() {
  if (!tokenForDisplay.value) {
    menuError.value = "Authentication token not available. Cannot fetch menu.";
    isLoadingMenu.value = false;
    return;
  }

  isLoadingMenu.value = true;
  menuError.value = null;
  try {
    const response = await $fetch<MenuApiResponse>("/api/order/getMenu", {
      headers: {
        Authorization: `Bearer ${tokenForDisplay.value}`,
        "X-CSRF-Token": csrf,
      },
    });

    if (response.success && response.data && response.data.menu) {
      menuCategories.value = response.data.menu;
      initializeQuantitiesAfterFetch();
    } else {
      throw new Error(
        response.message ||
          "Failed to fetch menu data or data is in unexpected format."
      );
    }
  } catch (error: any) {
    console.error("Error fetching menu data:", error);
    const errorMessage =
      error.data?.message ||
      error.message ||
      "An unexpected error occurred while fetching the menu.";
    menuError.value = errorMessage;
  } finally {
    isLoadingMenu.value = false;
  }
}

async function fetchOrderStatus() {
  if (!tokenForDisplay.value || !idOrder) {
    orderStatusError.value = "Token or Order ID missing for fetching status.";
    isLoadingOrderStatus.value = false;
    return;
  }

  isLoadingOrderStatus.value = true;
  orderStatusError.value = null;
  try {
    const apiEndpoint = `/api/order/${idOrder}/getItemStatus`;
    const response = await $fetch<GetItemStatusApiResponse>(apiEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenForDisplay.value}`,
        "X-CSRF-Token": csrf,
      },
    });

    if (response && response.order) {
      currentOrderStatus.value = response.order;
      prefillOrderFormFromStatus();
    } else {
      throw new Error(
        response.message ||
          "Failed to fetch order status or data in unexpected format."
      );
    }
  } catch (error: any) {
    console.error("Error fetching order status:", error);
    const errorMessage =
      error.data?.message ||
      error.message ||
      "An unexpected error occurred while fetching order status.";
    orderStatusError.value = errorMessage;
  } finally {
    isLoadingOrderStatus.value = false;
  }
}

function prefillOrderFormFromStatus() {
  if (
    !currentOrderStatus.value ||
    Object.keys(menuCategories.value).length === 0
  ) {
    return;
  }

  const orderData = currentOrderStatus.value;
  const newQuantities: { [key: number]: number } = { ...itemQuantities.value };

  if (orderData.Item && orderData.Item.length > 0) {
    orderData.Item.forEach((itemDetail) => {
      let itemExistsInMenu = false;
      for (const categoryName in menuCategories.value) {
        if (
          menuCategories.value[categoryName].some(
            (menuItem) => menuItem.id === itemDetail.idMenu && menuItem.isActive
          )
        ) {
          itemExistsInMenu = true;
          break;
        }
      }
      if (itemExistsInMenu) {
        newQuantities[itemDetail.idMenu] = itemDetail.qty;
      } else {
        console.warn(
          `Item with idMenu ${itemDetail.idMenu} from fetched order is not active or not found in current menu. Not pre-filling quantity.`
        );
      }
    });
  }
  itemQuantities.value = newQuantities;

  if (orderData.note) {
    sellerNote.value = orderData.note;
  }
}

onMounted(async () => {
  if (process.client) {
    initialCheckDone.value = true;
    if (tokenForDisplay.value && idOrder) {
      isLoadingMenu.value = true;
      isLoadingOrderStatus.value = true;

      await fetchMenuData();

      await fetchOrderStatus();
    } else {
      isLoadingMenu.value = false;
      isLoadingOrderStatus.value = false;
      const authError = !tokenForDisplay.value
        ? "Authentication required."
        : "";
      const idError = !idOrder ? "Order ID missing." : "";
      const errors = [authError, idError].filter(Boolean).join(" ");
      menuError.value = `${errors} You may be redirected.`;

      if (route.path !== "/" && !tokenForDisplay.value) {
      }
    }
  }
});

const itemQuantities = ref<{ [key: number]: number }>({});
const sellerNote = ref("");

const initializeQuantitiesAfterFetch = () => {
  const newQuantities: { [key: number]: number } = {};
  if (Object.keys(menuCategories.value).length > 0) {
    for (const categoryName in menuCategories.value) {
      const categoryItems = menuCategories.value[categoryName];
      for (const menuItem of categoryItems) {
        newQuantities[menuItem.id] = itemQuantities.value[menuItem.id] || 0;
      }
    }
    itemQuantities.value = newQuantities;
  }
};

onMounted(async () => {
  if (process.client) {
    initialCheckDone.value = true;
    if (tokenForDisplay.value) {
      await fetchMenuData();
    } else {
      isLoadingMenu.value = false;
      if (route.path !== "/") {
        menuError.value =
          "Authentication required to view the menu. You may be redirected.";
      }
    }
  }
});

const ensurePositiveQuantity = (itemId: number) => {
  let qty = itemQuantities.value[itemId];
  if (qty === null || qty === undefined || isNaN(qty) || qty < 0) {
    itemQuantities.value[itemId] = 0;
  } else {
    itemQuantities.value[itemId] = Math.floor(qty);
  }
};

const incrementQuantity = (itemId: number) => {
  if (
    itemQuantities.value[itemId] === undefined ||
    itemQuantities.value[itemId] === null ||
    isNaN(itemQuantities.value[itemId])
  ) {
    itemQuantities.value[itemId] = 0;
  }
  itemQuantities.value[itemId]++;
  ensurePositiveQuantity(itemId);
};

const decrementQuantity = (itemId: number) => {
  if (
    itemQuantities.value[itemId] === undefined ||
    itemQuantities.value[itemId] === null ||
    isNaN(itemQuantities.value[itemId])
  ) {
    itemQuantities.value[itemId] = 0;
  }
  if (itemQuantities.value[itemId] > 0) {
    itemQuantities.value[itemId]--;
  }
  ensurePositiveQuantity(itemId);
};

const orderItemsForPayload = computed(() => {
  const items: { id: number; qty: number; price: number }[] = [];
  for (const categoryName in menuCategories.value) {
    const categoryItems = menuCategories.value[categoryName];
    for (const menuItem of categoryItems) {
      if (menuItem.isActive) {
        const qty = itemQuantities.value[menuItem.id] || 0;
        if (qty > 0) {
          items.push({
            id: menuItem.id,
            qty: qty,
            price: menuItem.price * qty,
          });
        }
      }
    }
  }
  return items;
});

const orderTotal = computed(() => {
  return orderItemsForPayload.value.reduce((sum, item) => sum + item.price, 0);
});

const menuItemsMap = computed(() => {
  const map = new Map<number, MenuItem>();
  for (const categoryName in menuCategories.value) {
    const categoryItems = menuCategories.value[categoryName];
    for (const menuItem of categoryItems) {
      map.set(menuItem.id, menuItem);
    }
  }
  return map;
});

const orderSummaryItems = computed(() => {
  return orderItemsForPayload.value.map((payloadItem) => {
    const menuItem = menuItemsMap.value.get(payloadItem.id);
    return {
      id: payloadItem.id,
      name: menuItem ? menuItem.name : "Unknown Item",
      qty: payloadItem.qty,
      unitPrice: menuItem ? menuItem.price : 0,
      lineTotal: payloadItem.price,
    };
  });
});

interface SubmitOrderResponse {
  success: boolean;
  message: string;
  order?: {
    id: string;
    note: string;
    total: number;
    isPaid: boolean;
    items: Array<{
      id: string;
      idMenu: number;
      qty: number;
      price: number;
    }>;
  };
}

const isSubmittingOrder = ref(false);

const submitOrder = async () => {
  if (!tokenForDisplay.value) {
    alert("Authentication error. Please refresh and try again.");
    return;
  }
  if (!idOrder) {
    alert("Order ID is missing. Please check the URL.");
    return;
  }
  if (orderItemsForPayload.value.length === 0) {
    alert("Your order is empty. Please add items.");
    return;
  }

  isSubmittingOrder.value = true;

  const orderData = {
    order: {
      id: idOrder,
      total: orderTotal.value,
      note: sellerNote.value,
      item: orderItemsForPayload.value,
    },
  };

  console.log("Submitting Order Data:", JSON.stringify(orderData, null, 2));

  try {
    const apiEndpoint = `/api/order/${idOrder}/submit`;

    const response = await $fetch<SubmitOrderResponse>(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenForDisplay.value}`,
        "X-CSRF-Token": csrf,
      },
      body: orderData,
    });

    if (response.success && response.order) {
      Object.keys(itemQuantities.value).forEach(
        (key) => (itemQuantities.value[parseInt(key)] = 0)
      );
      sellerNote.value = "";
      navigateTo(`/order/done/${response.order.id}`);
    } else {
      throw new Error(
        response.message ||
          "Order submission failed but no error message was provided."
      );
    }
  } catch (error: any) {
    console.error("Error submitting order:", error);
    const errorMessage =
      error.data?.message ||
      error.message ||
      "An unexpected error occurred while submitting the order.";
    alert(`Error submitting order: ${errorMessage}`);
  } finally {
    isSubmittingOrder.value = false;
  }
};
</script>

<style>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
