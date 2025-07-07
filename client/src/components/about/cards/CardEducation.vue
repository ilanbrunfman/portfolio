<script setup>

const props = defineProps({
  array: Array,
  getImagePath: Function,
})

</script>

<template>
<div class="card">
    <div v-for="(item, index) in array" :key="index" class="card-item card-item-divider d-flex align-items-start gap-1">
        <img :src="getImagePath(item.logo)"
            :alt="item.logo"
            class="item-logo"
        />
        <div class="">
            <h3 class="fs-16 fw-600 lh-1-5">{{ item.location }}</h3>
            <p class="fs-14 fw-400 lh-1-5">{{ item.title }}</p>
            <p class="fs-14 fw-400 lh-1-5">{{ item.period }}</p>
        </div>
    </div>
</div>   
</template>

<style lang="scss" scoped>

</style>