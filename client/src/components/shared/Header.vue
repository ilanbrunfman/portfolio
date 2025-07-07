<script setup>
import { useRoute } from 'vue-router'

import IconArrowLeft from '@/components/icons/IconArrowLeft.vue'
import IconUser from '@/components/icons/IconUser.vue'

const route = useRoute()
</script>

<template>
    <header class="header">
        <div :class="['container mx-auto', ]">
            <div class="col">
                <button v-if=" route.path === '/about' " class="icon icon-back pointer"  @click="$router.back()">
                    <IconArrowLeft />
                </button>
                <router-link v-else to="/" class="sub-title clr-dark fw-600">
                    <span class="fw-600" v-html="'Brunfman'"></span>
                </router-link>
            </div>
            <div class="col">
                <router-link to="/about" class="sub-title clr-dark fw-600 icon icon-user">
                    <IconUser />
                </router-link>
            </div>
            
        </div>
    </header>
</template>

<style lang="scss" scoped>
// @use "@/assets/styles/shared/variables" as var;
.header{
    position: fixed;
    z-index: 9;
    width: 100%;
    backdrop-filter: blur(10px);

    .container{
        min-height: 4.0rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .icon{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 100%;
            background-color: var(--light);

            svg {
                width: 28px;
                height: 28px;
                fill: var(--dark);

                path{
                    
                }

            }
        }
        
    }
}
</style>