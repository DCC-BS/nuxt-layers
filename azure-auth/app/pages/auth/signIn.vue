<script setup lang="ts">
import * as microsoftTeams from "@microsoft/teams-js";

definePageMeta({
    public: true,
    layout: "auth",
});

const { signIn } = useAppAuth();
const { t } = useI18n();

const loadingText = ref(t("auth.connecting"));
const loadingStates = [
    t("auth.connecting"),
    t("auth.authenticating"),
    t("auth.redirecting"),
];

let currentStateIndex = 0;
const isLoading = ref(false);

onMounted(async () => {
    const loadingInterval = setInterval(() => {
        currentStateIndex = (currentStateIndex + 1) % loadingStates.length;
        loadingText.value = loadingStates[currentStateIndex] as string;
    }, 1000);

    setTimeout(() => {
        clearInterval(loadingInterval);
    }, 1000);

    if (await signInWithTeams()) {
        return;
    }

    await signInWithAzureAd();
});

async function signInWithAzureAd() {
    isLoading.value = true;

    try {
        await signIn();
    } catch (e) {
        isLoading.value = false;
    }
}

async function signInWithTeams() {
    isLoading.value = true;

    try {
        await microsoftTeams.app.initialize();
        const token = await microsoftTeams.authentication.getAuthToken();

        const session = useState<AuthSession | null>(
            "auth:session",
            () => null,
        );

        const response = await $fetch<AuthSession>("/api/auth/teams-sso", {
            method: "POST",
            body: { token },
        });

        session.value = response;
        await navigateTo("/");
        return true;
    } catch (e) {
        isLoading.value = false;
        return false;
    }
}
</script>

<template>
    <div class="main-container">
        <div class="background-overlay">
            <div class="bg-circle bg-circle-1"></div>
            <div class="bg-circle bg-circle-2"></div>
            <div class="bg-circle bg-circle-3"></div>
        </div>

        <div class="content-wrapper">
            <div class="brand-section">
                <div class="logo-container">
                    <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z">
                        </path>
                    </svg>
                </div>
                <h1 class="main-title">{{ t("auth.welcomeBack") }}</h1>
                <p class="subtitle">{{ t("auth.signInToContinue") }}</p>
            </div>

            <div class="loading-card">
                <div class="card-content">
                    <h2 class="loading-title">{{ loadingText }}</h2>

                    <p class="description">{{ t("auth.azureAdDescription") }}</p>

                    <div class="progress-dots">
                        <div class="dot dot-1"></div>
                        <div class="dot dot-2"></div>
                        <div class="dot dot-3"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.main-container {
    min-height: 100vh;
    background: linear-gradient(to bottom right, #dbeafe, #ffffff, #e0e7ff);
    position: relative;
    overflow: hidden;
}

.background-overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    opacity: 0.2;
}

.bg-circle {
    position: absolute;
    width: 24rem;
    height: 24rem;
    border-radius: 50%;
    mix-blend-mode: multiply;
    filter: blur(64px);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.bg-circle-1 {
    top: 25%;
    left: 25%;
    background-color: #93c5fd;
}

.bg-circle-2 {
    top: 33.333333%;
    right: 25%;
    background-color: #c4b5fd;
    animation-delay: 2s;
}

.bg-circle-3 {
    bottom: 25%;
    left: 33.333333%;
    background-color: #f9a8d4;
    animation-delay: 4s;
}

.content-wrapper {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
}

.brand-section {
    margin-bottom: 3rem;
    text-align: center;
}

.logo-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    background: linear-gradient(to right, #3b82f6, #9333ea);
    border-radius: 50%;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    margin-bottom: 1.5rem;
    animation: bounce 2s infinite;
}

.logo-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: white;
}

.main-title {
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #4b5563;
}

.loading-card {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 2rem;
    max-width: 28rem;
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-content {
    text-align: center;
}

.loading-title {
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1rem;
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.description {
    color: #4b5563;
    margin-bottom: 1.5rem;
    line-height: 1.625;
}

.progress-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
}

.dot {
    width: 0.5rem;
    height: 0.5rem;
    background-color: #3b82f6;
    border-radius: 50%;
    animation: bounce 2s infinite;
}

.dot-2 {
    animation-delay: 0.2s;
}

.dot-3 {
    animation-delay: 0.4s;
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

@keyframes bounce {

    0%,
    20%,
    53%,
    80%,
    100% {
        transform: translate3d(0, 0, 0);
    }

    40%,
    43% {
        transform: translate3d(0, -8px, 0);
    }

    70% {
        transform: translate3d(0, -4px, 0);
    }

    90% {
        transform: translate3d(0, -2px, 0);
    }
}

* {
    transition: all 0.3s ease;
}

@media (max-width: 640px) {
    .content-wrapper {
        padding: 1rem;
    }

    .main-title {
        font-size: 1.875rem;
        line-height: 2.25rem;
    }

    .loading-card {
        padding: 1.5rem;
    }

    .bg-circle {
        width: 16rem;
        height: 16rem;
    }
}
</style>
