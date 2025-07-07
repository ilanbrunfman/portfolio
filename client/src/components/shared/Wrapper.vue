<script setup>

import Header from '@/components/shared/Header.vue';
import Toast from '@/components/shared/Toast.vue'

defineProps({
  wrapperClass: { type: String,  }
})

</script>

<template>
    <div :class="['wrapper', wrapperClass]">
        <Header />
        <Toast />

        <main >
            <slot name="main" />
        </main>

    </div>
</template>