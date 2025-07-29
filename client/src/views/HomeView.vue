<script setup>
import { computed } from 'vue'
import { useStore } from '@/stores/index.js'

import Wrapper from '@/components/shared/wrapper/Wrapper.vue'

const store = useStore()

const data = computed(() => store.data)
</script>

<template>
     <Wrapper wrapperClass="home">
        <template #main>
            <section class="showcase">

                    <div class="container mx-auto">
                        <div class="row">
                            <div class="col pb-5">
                                <h1 class="title fw-600 lh-1-0 mb-1">Projects:</h1>
                                <h4 class="d-none para fw-400 lh-1-0">Software Engineer <!--Senior Frontend Feveloper--> | <a href="https://www.eversanaintouch.com/" target="_blank" class="z">Eversana Intouch</a></h4>
                            </div>
                        </div>
                    </div>

            </section>
            <section class="hero">
                <div class="container mx-auto px-3">
                    <div class="row">
                        <div class="col-12 cards pt-5">
                            <router-link :to="card.path" v-for="card in data" :key="card.id" class="card">
                                <!-- <div class="card-thumbnail">
                                    <p>Thumbnail</p>
                                </div> -->
                                <div class="card-content">
                                    <h3 class="title">{{ card.title }}</h3>
                                    <p class="para">{{ card.para }}</p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                </div>
            </section>
        </template>
     </Wrapper>
</template>