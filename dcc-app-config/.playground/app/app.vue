<script setup lang="ts">
const apps = useAppList("TextMate");
</script>

<template>
    <div class="p-8">
        <h1 class="mb-4 text-xl font-bold">dcc-app-config playground</h1>
        <ul class="flex flex-col gap-2">
            <li v-for="app in apps" :key="app.name">
                <img :src="app.image">
                <NuxtLink :to="app.to">{{ app.name }}</NuxtLink>
            </li>
        </ul>
    </div>
</template>

<style>
img {
    height: 80px;
    width: auto;
}
</style>
