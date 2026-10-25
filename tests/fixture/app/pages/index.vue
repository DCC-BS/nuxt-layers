<script setup lang="ts">
const { data, isAuthEnabled } = useAppAuth();
const logger = useLogger();
const apps = useAppList("TextMate");

logger.info("fixture page rendered");
</script>

<template>
    <main>
        <p data-test="auth-enabled">{{ isAuthEnabled }}</p>
        <p data-test="user-name">{{ data?.user.name }}</p>
        <ul>
            <li v-for="app in apps" :key="app.name" data-test="app-link">
                <a :href="app.to">{{ app.name }}</a>
            </li>
        </ul>
        <FeedbackControl />
    </main>
</template>
