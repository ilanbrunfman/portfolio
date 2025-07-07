<script setup>
import IconPlus from '@/components/icons/IconPlus.vue'
import IconMinus from '@/components/icons/IconMinus.vue'

const props = defineProps({
  array: Array,
  getImagePath: Function,
  toggleAccordion: Function,
})

</script>

<template>
<div class="card">
    <div v-for="(item, index) in array" :key="index" :class="['card-item card-item-divider d-flex align-items-start gap-1 pointer', item.active ? 'active' : '']" @click="toggleAccordion(array, item, index)">
        <img :src="getImagePath(item.logo)"
            alt="experience logo"
            class="item-logo"
        />
        <div class="card-content">
            <component class="icon" :is="item.active ? IconMinus : IconPlus" />
            <h3 class="fs-16 fw-600 lh-1-5">{{ item.title }}</h3>
            <p class="fs-14 fw-400 lh-1-5">{{ item.company }} · {{ item.status ? 'Full-time' : 'Part-time' }}</p>
            <p :class="['fs-14 fw-400 lh-1-5', item.active ? 'mb-0-5' : '']"> {{ item.period }}</p>
            <transition name="accordion">
                <div v-show="item.active" class="accordion py-0-5">
                    <div class="accordion-header">
                        <p class="para fw-600 lh-1-5 mb-0-5">Work Description:</p>
                    </div>
                    <ul  class="accordion-body">
                        <li v-for="list in item.role" :key="list" class="item-list fs-14 fw-400 lh-1-5" v-html="list"></li>
                    </ul>
                </div>
            </transition>
            
        </div>
    </div>
</div> 
</template>

<style lang="scss" scoped>
.card{
    &-content{
        position: relative;
        width: 100%;

        .icon{
            position: absolute;
            right: 0px;
            top: 0px;
            width: 40px;
            height: 40px;
            padding: 8px;
            border-radius: 100%;
            //  background-color: var(--soft-background);
        }
    }
}
</style>