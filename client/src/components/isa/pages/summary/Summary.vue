<script setup>
import { computed } from 'vue';
import Wrapper from '@/components/isa/components/wrapper/Wrapper.vue'
import Element from '@/components/shared/element/Element.vue';

const list = computed(() => {
    return [
        { component: 'h1', class: 'fw-500 lh-1-0 mb-1', html: `AbbVie CLM Overview` },
        { component: 'p', class: 'lh-1-4 mb-1', html: `Veeva's closed loop marketing (CLM) functionality allows commercial and medical reps to engage with HCPs and key opinion leaders using compelling visual content hosted in Veeva Vault. Users can display marketing or informational material during calls and track CLM activity for accounts, allowing marketers to gain insight into their targets and improve the content to maximize relevance and effectiveness.` },
        { component: 'p', class: 'lh-1-4 mb-1', html: `Users can access the following directly from CLM:` },
        { component: 'ul', class: 'mb-1', list: [
            { class: 'list-link', html: `<a href='/isa/support/dosing'>Approved Email</a>` },
            { class: 'list-link', html: `<a href='/isa/support/moa'>Medical Inquiry</a>` },
            { class: 'list-link', html: `<a href='/isa/support/efficacy'>Order</a>` },
            { class: 'list-link', html: `<a href='/isa/summary'>Summary</a>` },
        ] },
        { component: 'p', class: 'lh-1-4 mb-1', html: `Additionally, users hosting meetings from the CRM Engage app can present CLM content. See Engage CLM Content Creation Guidelines for more information. Users can also display CLM content directly from a call objective. See Using CLM Call Objectives for more information.` },
    ]
})
</script>

<template>
    <Wrapper class="summary">
        <template #body>
            <div class="container hero">
                <div class="row">
                    <div class="col-8 pt-4 mb-2 mx-auto">
                        <Element v-for="(item, index) in list" :key="index" :prop="item" />
                    </div>
                </div>
            </div>
        </template>
    </Wrapper>
</template>

<style lang="scss">
.summary{
    .hero{
        height: 100%;
        display: flex;
        align-items: center;
        // text-align: center;
    }
    ul{
        .list{
            &-title{
                font-size: 18px;
                font-weight: 500;
                color: #2196F3;
            }
    
            &-item{
                list-style-type: disc;
                line-height: 1.3;
                margin-left: 20px;
    
                &::marker{ color: #ff9e16; }
            }
            
            &-link{
                list-style-type: disc;
                line-height: 1.3;
                margin-left: 20px;
                color: #2196F3;
                text-decoration: underline;
    
                &::marker{ color: #ff9e16; }
            }
        }
    }
}
</style>