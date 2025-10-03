<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import { router } from '@/router/index.js'
import './Footer.scss'
import IconHouse from '@/components/icons/IconHouse.vue'

const route = useRoute()
const router = useRouter()


// const parentMenuItem = computed(() => {
//   for (const item of menu.value) {
//     if (item.children?.some(child => child.path === route.path)) {
//       return item
//     }
//   }
//   return null
// })

const presentation = computed(() => {
    return router.options.routes
        .find( route => route.path.includes('/isa') )
        .children.filter( route => !route.redirect)
})

const currentPage = computed(() => {
    for (const section of presentation.value) {
        if (section.children) {
            const match = section.children.find(child => child.path === route.path)
            if (match) { return { section, page: match } }
        }
        if (section.path === route.path) {
            return { section, page: section }
        }
    }
    return null
})

const currentPageChildren = computed(() => {
    return currentPage.value.section.children.filter( route => !route.redirect)
})
</script>

<template>
    <footer class="footer-isa">

        <!-- <transition name="slide-up" appear mode="out-in"> -->
            <div class="sub-nav" v-if="currentPage.section.children" >
                <div class="sub-nav-container">
                    <router-link v-for="(child, index) in currentPageChildren" :key="`child-${index}`" :class="['router-link']" :to="child.path">
                        <span>{{ child.title }}</span>
                    </router-link>
                </div>
            </div>
        <!-- </transition> -->

        <div class="main-nav">
            <router-link v-for="(link, index) in presentation" :key="`main-${index}`" :class="['router-link', link.title === 'Overview' ? 'router-link-home' : '']" :to="link.path">
                <span v-if="link.title !== 'Overview'">{{ link.title }}</span>
                <IconHouse v-else />
            </router-link>
        </div>

    </footer>
</template>