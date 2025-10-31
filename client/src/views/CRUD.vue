<script setup>
import Wrapper from '@/components/shared/wrapper/Wrapper.vue'
</script>

<template>
     <Wrapper wrapperClass="crud">
        <template #main>
            <router-view />
        </template>
    </Wrapper>
</template>