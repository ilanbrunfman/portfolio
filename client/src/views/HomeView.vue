<script setup>
import { useStore } from '@/stores/index.js'

const store = useStore()
</script>

<template>
    <h1>Home View {{ store.count }}</h1>
</template>