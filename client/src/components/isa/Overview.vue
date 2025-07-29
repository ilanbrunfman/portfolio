<script setup>
import Wrapper from '@/components/isa/shared/wrapper/Wrapper.vue'

const items = [
    {
        class: 'mb-1', list: [
            { type: '', class: 'list-link', text: `<a href='/isa/summary'>Approved Email<a/>` },
            { type: '', class: 'list-link', text: `<a href='/isa/summary'>Medical Inquiry</a>` },
            { type: '', class: 'list-link', text: `<a href='/isa/summary'>Order</a>` },
            { type: '', class: 'list-link', text: `<a href='/isa/summary'>Summary</a>` },
        ]
    },
]

</script>

<template>
    <Wrapper class="overview">
        <template #body>
            <div class="container hero">
                <div class="row">
                    <div class="col-8 pt-4 mb-2 mx-auto">
                        <img class="mb-2" width="188" src="@/assets/images/abbvie-logo.svg" />
                        <p class="lh-1-4 mb-1">AbbVie Inc. is a research-based biopharmaceutical company headquartered in North Chicago, Illinois. It was founded in 2013 as a spin-off from Abbott Laboratories. AbbVie focuses on developing and commercializing innovative medicines and solutions, with a strong emphasis on areas like immunology, oncology, neuroscience, and virology. Their major products include Humira, Skyrizi, Rinvoq, and Botox. </p>
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

