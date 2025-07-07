<script setup>
const props = defineProps({
  array: Array,
})
</script>

<template>
    <ul class="d-flex gap-1 flex-wrap">
        <li v-for="tag in array" :key="tag" :class="['tag',]">{{ tag.name }}</li>
    </ul>
</template>

<style lang="scss" scoped>
.tag{
    font-size: 14px;
    padding: 8px 10px;
    border-radius: 4px;
    background-color: var(--soft-background);
    cursor: default;
}
</style>