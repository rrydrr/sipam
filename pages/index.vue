<template>
    <!-- Card for medium and up -->
    <Card :max-width="'max-w-md'" :display-classes="'hidden sm:block'">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        Selamat Datang di Situs SIPaM!
      </h1>
      <p class="text-gray-600 text-lg">
        Untuk melanjutkan proses pemesanan, silakan gunakan kode QR yang telah disediakan. Terima kasih atas kepercayaan Anda!
      </p>
    </Card>
    <!-- Direct content for small screens -->
    <Card :bg-color="''" :display-classes="'block sm:hidden'" :shadow="''">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">
        Selamat Datang di Situs SIPaM!
      </h1>
      <p class="text-gray-600 text-base">
        Untuk melanjutkan proses pemesanan, silakan gunakan kode QR yang telah disediakan. Terima kasih atas kepercayaan Anda!
      </p>
    </Card>
</template>
