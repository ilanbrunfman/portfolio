<script setup>
import { computed } from 'vue'
import { useStore } from '@/stores/index.js'
import Header from '@/components/shared/header/Header.vue'
import Toast from '@/components/shared/toast/Toast.vue'
// import Footer from '@/components/shared/footer/Footer.vue'

import './Wrapper.scss'

defineProps({
  wrapperClass: { type: String,  }
})

const store = useStore()
const modal = computed(() => store.modalArray[store.modalArray.length - 1] || null)
let currentTransition = 'fade'
const transition = computed(() => {
  if (modal.value?.transition) currentTransition = modal.value.transition
  return currentTransition
})
</script>

<template>
    <div :class="['wrapper', wrapperClass]">
        <Header />
        <Toast />

        <transition :name="transition" appear mode="out-in"  >
            <component v-if="modal" :key="modal.id" :is="modal.component" :modal="modal" />
        </transition>

        <main>
            <slot name="main" />
        </main>

        <!-- <Footer />  -->

    </div>
</template>