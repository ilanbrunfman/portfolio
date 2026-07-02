<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { useGsapScroll } from '@/composables/useGsapScroll.js'
import Wrapper from '@/components/shared/wrapper/Wrapper.vue'

const { containerRef } = useGsapScroll()

const helloWorldMsg = () => {
    console.log('Hello World Message!')
}

const items = ref([
    {
        id: 0,
        active: true,
        title: 'Montes pharetra malesuada; magna porttitor et nisi.',
        para: `Lacinia accumsan lobortis vehicula facilisis facilisi. Elit vestibulum molestie congue; tellus elementum molestie penatibus ante.`,
        btn: { label: 'Call to action', cta: () => { console.log('shortcut!')} }
    },
    {
        id: 1,
        active: false,
        title: 'Montes pharetra malesuada; magna porttitor et nisi.',
        para: `Lacinia accumsan lobortis vehicula facilisis facilisi. Elit vestibulum molestie congue; tellus elementum molestie penatibus ante.`,
        btn: { label: 'Call to action', cta: () => { console.log('shortcut!')} }
    },
    {
        id: 2,
        active: false,
        title: 'Montes pharetra malesuada; magna porttitor et nisi.',
        para: `Lacinia accumsan lobortis vehicula facilisis facilisi. Elit vestibulum molestie congue; tellus elementum molestie penatibus ante.`,
        btn: { label: 'Call to action', cta: () => { console.log('shortcut!')} }
    },
])

const toggleAccordion = async (item) => {

    items.value.map((obj) => { 
        if(obj.id === item.id && !item.active) {
            item.active = true
        } else if(obj.id === item.id && item.active) {
             item.active = false
        }
    })
    // items.value = items.value.map((obj) => ({ 
    //     ...obj, 
    //     active: obj.id === item.id ? true : false, 
    // }))

    await nextTick() // Wait for DOM to update before animating

    // Collapse all inactive accordions
    // gsap.utils.toArray('.accordion').forEach((acc) => {
    //     const body = acc.querySelector('.accordion-body')
    //     if (!acc.classList.contains('active')) {
    //         gsap.to(body, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut', })
    //     }
    // })

    // // Animate the active accordion
    // const activeAccordion = document.querySelector(`.accordion-${item.id}.active`)
    // if (activeAccordion && !item.active) {
    //     const body = activeAccordion.querySelector('.accordion-body')
    //     const fullHeight = body.scrollHeight
    //     gsap.fromTo(body, 
    //         { height: 0, opacity: 0 }, 
    //         { height: fullHeight, opacity: 1, duration: 0.5, ease: 'power2.out', onComplete: () => ( body.style.height = 'auto' ), 
    //     })
    //     // gsap.to(body, 
    //     //     // { height: 0, opacity: 0 }, 
    //     //     { height: fullHeight, opacity: 1, duration: 0.5, ease: 'power2.out', onComplete: () => ( body.style.height = 'auto' ), 
    //     // })
    // }
}


</script>

<template>
    <Wrapper wrapperClass="landing-page">
        <template #main>
            
            <div ref="containerRef">

                <section class="showcase">
                    <div class="container mx-auto">
                        <div class="row">
                            <div class="col-12 d-grid grid-1 grid-lg-7-5 gap-3 align-items-center">
                                <div class="col" data-animate>
                                    <h1 class="title fw-600 lh-1-2 mb-1">Tempus tristique viverra sem ridiculus nulla scelerisque</h1>
                                    <h3 class="sub-title col-md-10 fw-600 lh-1-3 mb-2">Lorem tristique hendrerit sit egestas, cursus bibendum eleifend.</h3>
                                    <button class="btn btn-primary">Call to action</button>
                                </div>
                                <div class="col d-flex grid-2 gap-2 justify-center" data-animate>
                                    <div class="image test"></div>
                                    <div class="image test"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
    
                <section class="section-light py-6 mb-6" >
                    <div class="container mx-auto">
                        <div class="row">
                            <div class="col-12 d-grid grid-1 grid-lg-5-7 gap-3 align-items-center ">
                                <div class="col order-2 order-lg-1" data-animate>
                                    <div class="image squre"></div>
                                </div>
                                <div class="col col-lg-8 order-1 order-lg-2" data-animate>
                                    <h2 class="sub-title fw-600 lh-1-3 mb-1">Montes pharetra malesuada; magna porttitor et nisi.</h2>
                                    <p class="para lh-1-3 mb-2">Laoreet commodo dictumst aenean facilisi laoreet tempus, congue congue. Posuere leo diam habitant mollis tempor; </p>
                                    <button class="btn btn-primary">Call to action</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section data-animate>
                    <div class="container mx-auto">
                        <div class="row">
                            <div class="col-12 d-grid grid-1 grid-lg-7-5 gap-3 align-items-center pb-6" style="height: 1000px;">
                                <div class="col col-lg-9" data-animate>

                                    <div v-for="(item, index) in items" :key="index" :class="[`accordion accordion-${item.id}`, item.active ? 'active' : '']">
                                        <div @click="toggleAccordion(item, index)" class="accordion-header">
                                            <h2 class="sub-title fw-600 lh-1-3 mb-1" v-html="item.title"></h2>
                                        </div>
                                        <!-- <transition name="accordion" appear mode="out-in"> -->
                                            <div class="accordion-body">
                                                <p class="para lh-1-3 mb-1" v-html="item.para"></p>
                                                <button v-if="item.btn" class="btn btn-primary mb-2" v-html="item.btn.label" @click="item.btn.cta"></button>
                                                <div class="d-flex d-lg-none align-items-center justify-center image squre"  v-html="index"></div>
                                            </div>
                                        <!-- </transition> -->
                                    </div>

                                </div>
                                <div class="col d-none d-lg-block" data-animate>
                                    <template v-for="(item, index) in items" :key="index">
                                        <!-- <div v-if="item.active" class="image squre d-flex align-items-center justify-center">
                                            <h1 v-html="index"></h1>
                                        </div> -->
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
               
                <section data-animate>
                    <div class="container mx-auto">
                        <div class="row banner mb-6">
                            <div class="col-12 d-grid grid-1 grid-lg-5-7 gap-3 align-items-center px-4 py-4">
                                <div class="col order-1" data-animate>
                                    <div class="image squre"></div>
                                </div>
                                <div class="col col-lg-8 order-2" data-animate>
                                    <h2 class="sub-title fw-600 lh-1-3 mb-1">Montes pharetra malesuada; magna porttitor et nisi.</h2>
                                    <p class="para lh-1-3 mb-2">Laoreet commodo dictumst aenean facilisi laoreet tempus, congue congue. Posuere leo diam habitant mollis tempor; </p>
                                    <button class="btn btn-primary">Call to action</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
            
        </template>
    </Wrapper>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/shared/variables" as var;
.landing-page{
    .showcase{
        padding-block: 6.0rem;
        
        @media (min-width: var.$lg) { padding-block: 8.0rem; }
        @media (min-width: var.$xl) { padding-block: 9.0rem; }
    }

    .section{
        opacity: 0;
        visibility: hidden;
        &-dark{ background-color: var(--dark); color: var(--light); }
        &-blue{ background-color: lightsteelblue; }
        &-light{ background-color: var(--gray); }
    }

    .image{
        border-radius: 2.0rem;
        background-color: #ccc;

        &.test{
            display: flex;
            aspect-ratio: 9/16;
            width: 100%;
            max-height: 100%;

            @media (min-width: var.$xl) { aspect-ratio: 1/2; width: 260px; max-height: 460px; }

        }

        &.squre{ aspect-ratio: 1/1; }
    }

    .banner{ background-color: var(--gray); border-radius: 2.0rem; }

    .accordion{
        margin-bottom: 2.0rem;


        &-header{
            cursor: pointer;
        }
        &-body {
            // background-color: red;
            // max-height: 0;
            min-height: 0px;
            height: 0;
            overflow: hidden;
            transition: height 0.5s ease-out;
        }

        &.active {
            .accordion-body {
                height: auto;
                // background-color: lightgreen;
                // max-height: 1000px; // should be taller than your tallest section
            }
        }

        // &:last-child{ margin-bottom: 0; }
    }
}
</style>