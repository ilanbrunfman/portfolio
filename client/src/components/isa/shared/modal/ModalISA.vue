<script setup>
import { useStore } from '@/stores/isa.js'
import './modalISA.scss'

const storeISA = useStore()

const closeModal = () => {
    storeISA.REMOVE_MODAL()
}
</script>

<template>
    <aside :class="['modal-isa', ]">
        <div class="modal-isa-backdrop" @click="closeModal()"></div>
        <div class="modal-isa-container">
            <button class="modal-isa-exit-btn" @click="closeModal()"></button>
            <slot name="modal"/>
        </div>
    </aside>
</template>