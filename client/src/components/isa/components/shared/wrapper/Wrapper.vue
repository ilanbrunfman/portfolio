<script setup>
import { computed } from 'vue'
import { useStore } from '@/stores/isa.js'
import './Wrapper.scss'

import Header from '@/components/isa/components/shared/header/Header.vue'
import Footer from '@/components/isa/components/shared/footer/Footer.vue'
// import Modal from '@/components/isa/shared/modal/Modal.vue'

const storeISA = useStore()
const modal = computed(() => storeISA.modalArray[storeISA.modalArray.length - 1] || null)
let currentTransition = 'fade'
const transition = computed(() => {
  if (modal.value?.transition) currentTransition = modal.value.transition
  return currentTransition
})

</script>

<template>
    <div :class="['wrapper-isa']">
        <Header />
        <transition :name="transition" appear :mode="modal?.mode || 'out-in'"  >
            <component v-if="modal" :key="modal.id" :is="modal.component" :modal="modal" />
        </transition>
        <router-view v-slot="{ Component }">
            <transition name="fade" appear mode="out-in">
                <component :is="Component" v-if="Component" />
                <slot name="body" v-else />
            </transition>
        </router-view>
        <Footer />
    </div>
</template>