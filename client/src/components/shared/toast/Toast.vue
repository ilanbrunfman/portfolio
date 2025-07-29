<script setup>
import { computed } from 'vue'
import { useStore } from '@/stores/index.js'
import './Toast.scss';
import IconCheck from '@/components/icons/IconCheck.vue'
import IconError from '@/components/icons/IconError.vue'
import IconWarning from '@/components/icons/IconWarning.vue'
import IconX from '@/components/icons/IconX.vue'

const store = useStore()

const toast = computed(() => {
    switch (store.toast.type) {
        case 'success':
            return  { 
                type: 'success',
                title: store.toast.title ? store.toast.title : 'Success',
                icon: IconCheck, 
                message: store.toast.message ? store.toast.message : 'hello world' 
            };
        case 'error':
            return { 
                type: 'error',
                title: store.toast.title ? store.toast.title :  'Error message', 
                icon: IconError, 
                message: store.toast.message ? store.toast.message : 'doing homework' 
            };
        default:
            return { 
                type: 'warning',
                title: store.toast.title ? store.toast.title :  'Warning', 
                icon: IconWarning, 
                message: store.toast.message ? store.toast.message : 'good day' 
            };
    }
})

const closeToast = () => {
    store.toast = false
}

</script>

<template>
    <transition name="slide-left" mode="out-in">
        <div v-if="store.toast" :class="['toast',`toast-${toast.type}`]">
            <div class="toast-icon">
                <component :is="toast.icon"/>
            </div>
            <div class="toast-header">
                <h3 class="toast-header-title">{{ toast.title }}</h3>
                <p class="toast-header-message">{{ toast.message }}</p>
            </div>
            <IconX @click="closeToast" class="toast-exit"/>
        </div>
    </transition>
</template>