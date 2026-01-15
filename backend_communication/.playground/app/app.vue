<script lang="ts" setup>
const logger = useLogger();

onMounted(async () => {
    const result = await $fetch("/api/test");

    logger.info(result, "test api called");

    const result2 = await $fetch("/api/test2");

    logger.info(result2, "test 2 api called");
});
</script>

<template>

</template>
