<script setup>
import { useStore } from '@/stores/index.js'
import './modal.scss'

const store = useStore()

const closeModal = () => {
    store.REMOVE_MODAL()
}
</script>

<template>
    <aside :class="['modal', ]">
        <div class="modal-backdrop" @click="closeModal()"></div>
        <div class="modal-container">
            <button class="modal-exit-btn" @click="closeModal()"></button>
            <slot name="modal"/>
        </div>
    </aside>
</template>