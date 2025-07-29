<script setup>
import { markRaw, computed, onMounted } from 'vue'
import { useStore } from '@/stores/index.js'
import { useRoute, useRouter } from 'vue-router'
import './Header.scss';

import IconArrowLeft from '@/components/icons/IconArrowLeft.vue'
import IconUser from '@/components/icons/IconUser.vue'
import IconCardsThree from '@/components/icons/IconCardsThree.vue'


// import TestModalOne from '@/components/shared/modal/TestModalOne.vue'
// import TestModalTwo from '@/components/shared/modal/TestModalTwo.vue'

const store = useStore()
const router = useRouter()
const route = useRoute()


// const toggleShowcaseModal = () => {
//    store.ADD_MODAL({ component: markRaw(TestModalOne), id: 'one-modal',  transition: 'slide-down'})
// }
// const toggleCardsModalTwo = () => {
//     store.ADD_MODAL({ component: markRaw(TestModalTwo), id: 'two-modal', transition: 'fade' })
// }

const goBack = () => {
    if(route.path.includes('/isa')) {
        router.push('/')
    } else {
        router.back()
    }
}
</script>

<template>
    <header class="header">
        <div :class="['container mx-auto', ]">
            <div class="col">
                <router-link v-if=" route.path === '/' " to="/" class="sub-title clr-dark fw-600">
                    <span class="fw-600" v-html="'Brunfman'"></span>
                </router-link>
                <button v-else class="icon icon-back pointer"  @click="goBack()">
                    <IconArrowLeft />
                </button>
            </div>
            <div class="col">
                <div class="d-flex align-items-center gap-1">
                    <!-- <button class="icon icon-cards pointer" @click="toggleShowcaseModal()">
                        <IconCardsThree />
                    </button>
                    <button class="icon icon-cards pointer" @click="toggleCardsModalTwo()">
                        <IconCardsThree />
                    </button> -->
                    <router-link to="/about" class="sub-title clr-dark fw-600 icon icon-user">
                        <IconUser />
                    </router-link>
                </div>
            </div>
            
        </div>
    </header>
</template>