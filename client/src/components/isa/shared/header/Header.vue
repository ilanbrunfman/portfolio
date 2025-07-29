<script setup>
import { markRaw } from 'vue'
import { useStore } from '@/stores/isa.js'
import './Header.scss'

import ModalPI from '@/components/isa/shared/modal/ModalPI.vue'
import ModalReference from '@/components/isa/shared/modal/ModalReference.vue'

const storeISA = useStore()

const toggleModalPI = () => {
    storeISA.ADD_MODAL({ component: markRaw(ModalPI), id: 'modal-isa-pi', transition: 'fade' })
}
const toggleModalReference = () => {
    storeISA.ADD_MODAL({ component: markRaw(ModalReference), id: 'modal-isa-reference', transition: 'fade' })
}

</script>

<template>
    <header class="header-isa">
        <div class="container">
            <div class="col d-flex gap-2">
                <a href="https://www.abbvie.com/" target="_black" class="nav nav-link">
                    <img width="74" src="@/assets/images/abbvie-logo-white.svg" />
                </a>
                <button class="nav nav-btn">Indication And Important Safety Information</button>
            </div>
            <div class="col d-flex gap-2">
                <button class="nav nav-btn"  @click="toggleModalPI()">Prescribing Information</button>
                <button class="nav nav-btn" @click="toggleModalReference()">References</button>
            </div>
        </div>
    </header>
</template>

<style lang="scss" scoped></style>