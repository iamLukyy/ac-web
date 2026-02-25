<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'AC Web',
  description: 'Web control panel for AssettoServer — manage your Assetto Corsa server from the browser',
  ogTitle: 'AC Web',
  ogDescription: 'Web control panel for AssettoServer — manage your Assetto Corsa server from the browser'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
