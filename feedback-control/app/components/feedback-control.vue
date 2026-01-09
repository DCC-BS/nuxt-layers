<script lang="ts" setup>
import { motion } from "motion-v";

interface InputProps {
    defaultMail?: string;
}

const props = withDefaults(defineProps<InputProps>(), {
    defaultMail: "",
});

const { t } = useI18n();

const feedbackText = ref("");
const selectedRating = ref("");
const emailAddress = ref(props.defaultMail);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref("");
const attachments = ref<File[]>([]);

const ratings = [
    { emoji: "😕", value: "poor" },
    { emoji: "😐", value: "okay" },
    { emoji: "🙂", value: "good" },
    { emoji: "😀", value: "great" },
    { emoji: "🤩", value: "excellent" },
];

async function submitFeedback() {
    // Clear any previous error
    errorMessage.value = "";

    // Validate form using Zod schema
    const validationResult = bodySchema.safeParse({
        rating: selectedRating.value,
        message: feedbackText.value.trim(),
        email: emailAddress.value.trim(),
        attachments: [], // Will be filled after validation
    });

    if (!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors;

        if (fieldErrors.email) {
            errorMessage.value = t("feedback.error_email_invalid");
        } else if (fieldErrors.message) {
            errorMessage.value = t("feedback.error_message_required");
        } else if (fieldErrors.rating) {
            errorMessage.value = t("feedback.error_rating_required");
        } else {
            errorMessage.value = t("feedback.error_validation");
        }
        return;
    }

    isSubmitting.value = true;
    const base64Attachments = await Promise.all(
        attachments.value.map(async (a) => ({ base64: await blobToBase64(a), fileName: a.name } as FeedbackAttachment)));

    try {
        await $fetch("/api/feedback", {
            method: "POST",
            body: {
                rating: selectedRating.value,
                message: feedbackText.value.trim(),
                email: emailAddress.value.trim(),
                attachments: base64Attachments,
            } as FeedbackBody,
            headers: {
                "Content-Type": "application/json",
            },
        });

        isSubmitting.value = false;
        isSubmitted.value = true;

        // Reset after a few seconds
        setTimeout(() => {
            resetForm();
        }, 3000);
    } catch (error) {
        isSubmitting.value = false;
        errorMessage.value = t("feedback.error_submit");
        console.error("Failed to submit feedback:", error);
    }
}

function resetForm() {
    feedbackText.value = "";
    selectedRating.value = "";
    emailAddress.value = "";
    isSubmitted.value = false;
    errorMessage.value = "";
    attachments.value = [];
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string; // "data:<mime>;base64,AAAA..."
            const base64 = dataUrl.split(",")[1] as string; // remove "data:*/*;base64,"
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
</script>

<template>
    <div id="feedback-control" class="fixed bottom-4 right-4 z-9999">
        <UPopover>
            <template #default="{ open }">
                <UButton color="secondary" :aria-label="t('feedback.aria_label')" icon="i-lucide-message-square">
                    {{ t("feedback.button") }}
                </UButton>
            </template>

            <template #content="{ close }">
                <div class="p-2">
                    <!-- Feedback Header -->
                    <div class="relative mb-2">
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm"
                            class="absolute -top-2 -right-2" :aria-label="t('feedback.close')" @click="
                                resetForm();
                            close();
                            " />
                    </div>
                    <!-- Feedback Content -->
                    <div v-if="!isSubmitted" class="flex flex-col gap-5 w-[360px]">
                        <h3 class="text-lg font-bold">
                            {{ t("feedback.title") }}
                        </h3>

                        <div class="flex flex-col gap-3">
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {{ t("feedback.rating_label") }}
                            </p>
                            <div class="flex items-center justify-between flex-wrap gap-2">
                                <motion.button v-for="rating in ratings" :key="rating.value" type="button"
                                    class="flex flex-col items-center gap-1 p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent cursor-pointer flex-1"
                                    :class="{
                                        'border-primary bg-primary/15':
                                            selectedRating === rating.value,
                                    }" :whileHover="{ scale: 1.05 }" :whilePress="{ scale: 0.95 }"
                                    @click="selectedRating = rating.value" :aria-label="t(`feedback.ratings.${rating.value}`)
                                        ">
                                    <span class="text-xl leading-none">{{
                                        rating.emoji
                                        }}</span>
                                    <span class="text-[0.65rem] whitespace-nowrap text-gray-500 dark:text-gray-400">{{
                                        t(
                                            `feedback.ratings.${rating.value}`,
                                        )
                                    }}</span>
                                </motion.button>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="feedback-text" class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
                                t("feedback.message_label") }}</label>
                            <UTextarea id="feedback-text" v-model="feedbackText"
                                :placeholder="t('feedback.message_placeholder')" :rows="4" />
                        </div>

                        <div class="flex flex-col gap-2">
                            <label for="feedback-email" class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
                                t("feedback.email_label") }}</label>
                            <UInput type="email" id="feedback-email" v-model="emailAddress"
                                :placeholder="t('feedback.email_placeholder')" />
                            <small class="text-[0.65rem] text-gray-500 dark:text-gray-400 inline-block mt-1">{{
                                t("feedback.email_help") }}</small>
                        </div>

                        <div>
                            <label for="feedback-attachments"
                                class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
                                    t("feedback.attachments_label") }}</label>
                            <UFileUpload v-model="attachments" multiple layout="list" class="min-h-48" />
                        </div>

                        <motion.div v-if="errorMessage" :initial="{ opacity: 0, x: -10 }"
                            :animate="{ opacity: 1, x: 0 }" :exit="{ opacity: 0, x: 10 }">
                            <UAlert icon="i-lucide-alert-circle" color="error" variant="soft" :title="errorMessage" />
                        </motion.div>

                        <motion.button @click="submitFeedback" :disabled="isSubmitting"
                            :whileHover="{ scale: isSubmitting ? 1 : 1.02 }"
                            :whilePress="{ scale: isSubmitting ? 1 : 0.98 }" class="w-full">
                            <UButton :disabled="isSubmitting" :loading="isSubmitting" icon="i-lucide-send" block>
                                {{
                                    isSubmitting
                                        ? t("feedback.submitting")
                                        : t("feedback.submit")
                                }}
                            </UButton>
                        </motion.button>
                    </div>

                    <motion.div v-else :initial="{ opacity: 0, scale: 0.8 }" :animate="{ opacity: 1, scale: 1 }"
                        :transition="{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                        }" class="flex flex-col items-center justify-center text-center min-h-[200px] gap-4 p-4">
                        <motion.div :initial="{ scale: 0, rotate: -180 }" :animate="{ scale: 1, rotate: 0 }"
                            :transition="{
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                                delay: 0.1,
                            }"
                            class="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-3xl">
                            <UIcon name="i-lucide-check" class="w-10 h-10" />
                        </motion.div>
                        <motion.h3 :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                            :transition="{ delay: 0.2 }" class="text-lg font-bold">
                            {{ t("feedback.success_title") }}
                        </motion.h3>
                        <motion.p :initial="{ opacity: 0, y: 10 }" :animate="{ opacity: 1, y: 0 }"
                            :transition="{ delay: 0.3 }" class="text-sm text-gray-500 dark:text-gray-400">
                            {{ t("feedback.success_message") }}
                        </motion.p>
                    </motion.div>
                </div>
            </template>
        </UPopover>
    </div>
</template>
