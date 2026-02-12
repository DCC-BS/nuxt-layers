<script setup lang="ts">
const logger = useLogger();

logger.error("this is a erro");

onMounted(() => {
    logger.debug("This is a debug");
    logger.info("This is a info");
    logger.warn("This is a warning");
    logger.error("This is an error");

    const breadcrumbs = logger.getBreadcrumbs();
    logger.info(`Total breadcrumbs: ${breadcrumbs.length}`);

    logger.clearBreadcrumbs();
});
</script>

<template>
    <div></div>
</template>
