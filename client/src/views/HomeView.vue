<script setup>
import { computed } from 'vue'
import { useStore } from '@/stores/index.js'

import Wrapper from '@/components/shared/Wrapper.vue'

const store = useStore()

const data = computed(() => store.data)

</script>

<template>
    <Wrapper wrapperClass="home">
        <template #main>
            <div class="container mx-auto pt-4">
                <div class="row grid-template">
                    <div class="col">
                        <router-view  />
                    </div>
                    <div class="col">
                        <div class="row cards">
                            <router-link :to="card.path" v-for="card in data" :key="card.id" class="card">
                                <div class="card-thumbnail">
                                    <p>Thumbnail</p>
                                </div>
                                <div class="card-content">
                                    <h3 class="title">{{ card.title }}</h3>
                                    <p class="para">{{ card.para }}</p>
                                </div>
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Wrapper>
</template>