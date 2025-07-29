<script setup>
import Wrapper from '@/components/isa/shared/wrapper/Wrapper.vue'
</script>

<template>
    <Wrapper class="access">
        <template #body>
            <router-view />
        </template>
    </Wrapper>
</template>