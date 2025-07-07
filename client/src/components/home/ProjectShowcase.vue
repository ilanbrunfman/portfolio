<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/stores/index.js'

import Test from '@/components/home/Test.vue'
import School from '@/components/home/School.vue'
import Car from '@/components/home/Car.vue'

const props = defineProps({
  project: Object, // passed only from Home route
})

const route = useRoute()
const router = useRouter()
const store = useStore()

const dynamicProject = computed(() =>
  store.data.find(p => p.path === route.params.path)
)

const project = computed(() =>
  props.project || dynamicProject.value
)

// Map component names to actual components
const componentMap = {
  Test,
  School,
  Car
}

// Dynamically resolve the actual component object
const ProjectComponent = computed(() =>
  project.value?.component ? componentMap[project.value.component] : null
)

// Redirect to 404 if project or component not found
onMounted(() => {
    if( !project.value ) {
        router.replace({ name: 'page-not-found' })
    }
})


</script>

<template>
    <div class="showcase" v-if="project">
        <div class="showcase-header">
            <!-- <h1>{{ project.title }}</h1> -->
            <component :is="ProjectComponent" />
        </div>
    </div>
</template>