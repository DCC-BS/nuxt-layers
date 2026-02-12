<script setup lang="ts">
const logger = useLogger();

const breadcrumbManager = useBreadcrumbs();

logger.error("this is a error");

onMounted(() => {
    logger.debug("This is a debug");
    logger.info({ someProps: 5 }, "This is a info");
    logger.warn("This is a warning");
    logger.error("This is an error");

    breadcrumbManager.addBreadcrumb({
        message: "This is a breadcrumb",
        category: "test",
        origin: "app.vue",
    });

    $fetch("/api/test");

    const crumbs = logger.getBreadcrumbs();
    logger.info(crumbs, `Total breadcrumbs: ${crumbs.length}`);
});
</script>

<template>
    <div></div>
</template>
