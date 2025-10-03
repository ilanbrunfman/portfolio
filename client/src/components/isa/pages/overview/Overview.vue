<script setup>
import { ref, computed } from 'vue'
import Wrapper from '@/components/isa/components/wrapper/Wrapper.vue'
import abbvieLogo from '@/assets/images/abbvie-logo.svg'
import Element from '@/components/shared/element/Element.vue'

const toggle = (item) => {
    console.log('toggle has been clicked', item.html)
}

// const section = [
//     {
//         cls: '',
//         columns: [
//             {
//                 cls: 'col-8 pt-4 mb-2 mx-auto',
//                 items: [
//                     { tag: 'img', cls: 'mb-2', width: 188, src: abbvieLogo, alt: 'abbvie-logo.svg' },
//                     { tag: 'p', cls: 'lh-1-4 mb-2', html: `AbbVie Inc. is a research-based biopharmaceutical company headquartered in North Chicago, Illinois. It was founded in 2013 as a spin-off from Abbott Laboratories. AbbVie focuses on developing and commercializing innovative medicines and solutions, with a strong emphasis on areas like immunology, oncology, neuroscience, and virology. Their major products include Humira, Skyrizi, Rinvoq, and Botox.`},
//                     { tag: 'ul', cls: 'list-disc pl-5 mt-2', list: [], },
//                     { tag: 'a', cls: 'btn btn-primary  mb-1', href: 'https://www.abbvie.com', html: 'Visit AbbVie', attr: '_blank' },
//                     { tag: 'button', cls: 'btn btn-primary', cta: toggle, html: 'Click Me', }
//                 ]
//             }
//         ]
//     },
// ]

const testValue = ref(false)

const test = () => {
    console.log('test button works!', testValue.value)
    testValue.value = !testValue.value
}

const list = computed(() => {
    return [
        { component: 'img', class: 'mb-1', width: 188, src: 'abbvie-logo.svg', alt: 'abbvie-logo.svg' },
        { component: 'p', class: 'lh-1-4 mb-2', html: `AbbVie Inc. is a research-based biopharmaceutical company headquartered in North Chicago, Illinois. It was founded in 2013 as a spin-off from Abbott Laboratories. AbbVie focuses on developing and commercializing innovative medicines and solutions, with a strong emphasis on areas like immunology, oncology, neuroscience, and virology. Their major products include Humira, Skyrizi, Rinvoq, and Botox.` },
        { component: 'href', url: 'https://www.abbvie.com', target: true, class: `link d-block mb-1`, html: `Visit AbbVie.com ` },
        { component: 'button', cta: test, class: `btn  mx-auto ${testValue.value ? 'btn-primary' : 'btn-defualt'}`, html: `Call to action ${testValue.value ? 'open' : 'close'}` },
    ]
}) 

</script>

<template>
    <Wrapper class="overview">
        <template #body>
            <div class="container hero">
                <div class="row mx-auto">
                    <div class="col-8 mx-auto">
                        <Element v-for="(item, index) in list" :key="index" :prop="item" />
                    </div>
                </div>
            </div>
        </template>
    </Wrapper>
</template>

<style lang="scss" scoped>
.hero{
    height: 100%;
    display: flex;
    align-items: center;
    text-align: center;
}
</style>

