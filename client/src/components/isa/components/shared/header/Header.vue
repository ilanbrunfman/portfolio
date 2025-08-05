<script setup>
import { markRaw } from 'vue'
import { useStore } from '@/stores/isa.js'
import './Header.scss'

// components
import IconEllipse from '@/components/icons/IconEllipse.vue'
import ModalISI from '@/components/isa/components/shared/modal/ModalISI.vue'
import ModalPI from '@/components/isa/components/shared/modal/ModalPI.vue'
import ModalReference from '@/components/isa/components/shared/modal/ModalReference.vue'

const storeISA = useStore()

const toggleModalISI = () => {
    storeISA.ADD_MODAL({ component: markRaw(ModalISI), id: 'modal-isa-isi', transition: 'nested', mode: 'in-out' })
}
const toggleModalPI = () => {
    storeISA.ADD_MODAL({ component: markRaw(ModalPI), id: 'modal-isa-pi', transition: 'nested', mode: '' })
}
const toggleModalReference = () => {
    storeISA.ADD_MODAL({ component: markRaw(ModalReference), id: 'modal-isa-reference', transition: 'nested', mode: 'false' })
}

</script>

<template>
    <header class="header-isa">
        <div class="container">
            <div class="col d-flex gap-2">
                <button class="icon icon-ellipse">
                    <IconEllipse />
                </button>
                <a href="https://www.abbvie.com/" target="_black" class="nav nav-link">
                    <img width="74" src="@/assets/images/abbvie-logo-white.svg" />
                </a>
                <button class="nav nav-btn" @click="toggleModalISI()">Indication And Important Safety Information</button>
            </div>
            <div class="col d-flex gap-2">
                <button class="nav nav-btn"  @click="toggleModalPI()">Prescribing Information</button>
                <button class="nav nav-btn" @click="toggleModalReference()">References</button>
            </div>
        </div>
    </header>
</template>

<style lang="scss" scoped></style>