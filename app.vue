<template>
  <div class="font-sans">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts"></script>

<style>
@import "tailwindcss";

@theme {
  --font-sans: 'Poppins', sans-serif;
  --color-primary: #F6F7FC;
  --color-secondary: #FDD300;
  --color-secondary-dark: #C2A600;
}
</style>
