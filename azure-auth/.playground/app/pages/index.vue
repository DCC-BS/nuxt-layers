<script lang="ts" setup>
import { useAppAuth } from "#imports";

const { data, signOut } = useAppAuth();
const pingResponse = ref<string>();

async function ping() {
    const response = await fetch("/api/ping");
    pingResponse.value = await response.text();
}
</script>

<template>
    <ClientOnly>
        <div class="wrapper">
            <div>User: {{ data?.user.name ?? 'NO USER' }}</div>

            <img :src="data.user.image" alt="User Photo" v-if="data?.user.image" />

            <button @click="signOut">Sing Out</button>
        </div>

        <button @click="ping">Ping</button>
        <div>
            <pre> {{ pingResponse }} </pre>
        </div>
    </ClientOnly>
</template>

<style>
.wrapper {
    display: flex;
    gap: 2rem;
}

.wrapper img {
    min-width: 50px;
    min-height: 50px;
    border-radius: 100%;
}
</style>
