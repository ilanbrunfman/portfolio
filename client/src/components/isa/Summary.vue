<script setup>
import Wrapper from '@/components/isa/shared/wrapper/Wrapper.vue'
const items = [
    {
        class: 'mb-1', list: [
            { type: '', class: 'list-link', text: `<a href='/isa/support/dosing'>Approved Email<a/>` },
            { type: '', class: 'list-link', text: `<a href='/isa/support/moa'>Medical Inquiry</a>` },
            { type: '', class: 'list-link', text: `<a href='/isa/support/efficacy'>Order</a>` },
            { type: '', class: 'list-link', text: `<a href='/isa/summary'>Summary</a>` },
        ]
    },
    // const itemsOne = [
    //     {
    //         class: 'mb-1', list: [
    //             { type: '', class: 'list-title mb-0-5', text: `Content Creators` },
    //             { type: '', class: 'list-item', text: `<span class='fw-bold'>Creating Interactive Content</span> – Using HTML, CSS, and Veeva’s multichannel JavaScript library, content creators can create reusable, compelling, and interactive content for end users to present during calls and events` },
    //         ]
    //     },
    //     {
    //         class: 'mb-1', list: [
    //             { type: '', class: 'list-title mb-0-5', text: `Integration Users` },
    //             { type: '', class: 'list-item mb-0', text: `<span class='fw-bold'>ntegrating Vault with CRM</span> – The integration user can customize the connection between CRM and Veeva Vault, including mapping fields between the two systems, and manage the content available for end users and for testing` },
    //         ]
    //     },
    // ]
    // const itemsTwo = [
    //     {
    //         class: ' mb-1', list: [
    //             { type: '', class: 'list-title mb-0-5', text: `Content Admins` },
    //             { type: '', class: 'list-item mb-0-5', text: `<span class='fw-bold'>Managing CLM Content</span> – Content admins can upload content to CRM via FTP or sync content from Veeva Vault, manage how content displays, and control which end users have access to the content. They can also test staged content in CRM using the same flow as an end user to ensure content functions correctly` },
    //             { type: '', class: 'list-item mb-0', text: `<span class='fw-bold'>Tracking CLM Activity</span> – Content admins can track activity tied to a CLM presentation, for example, related products, viewing duration of each slide, and reactions to key messages, and use that information to optimize content` },
    //         ]
    //     },
    //     {
    //         class: 'mb-1', list: [
    //             { type: '', class: 'list-title mb-0-5', text: `End Users` },
    //             { type: '', class: 'list-item mb-0-5', text: `<span class='fw-bold'>MNavigating the Media Library</span> – End users can customize the organization of presentations in the media library to simplify navigation` },
    //             { type: '', class: 'list-item mb-0-5', text: `<span class='fw-bold'>Displaying Presentations</span> – When displaying content, end users can interact with the media player and connect with other areas of CRM` },
    //             { type: '', class: 'list-item mb-0', text: `<span class='fw-bold'>Reporting on CLM</span> – End users can view reports and dashboards to observe trends in CLM activity and improve future presentations` },
    //         ]
    //     },
    // ]
]
</script>

<template>
    <Wrapper class="overview">
        <template #body>
            <div class="container hero">
                <div class="row">
                    <div class="row">
                    <div class="col-8 pt-4 mb-2 mx-auto">
                        <h1 class="fw-500 lh-1-0 mb-1">AbbVie CLM Overview</h1>
                        <p class="lh-1-4 mb-1">Veeva's closed loop marketing (CLM) functionality allows commercial and medical reps to engage with HCPs and key opinion leaders using compelling visual content hosted in Veeva Vault. Users can display marketing or informational material during calls and track CLM activity for accounts, allowing marketers to gain insight into their targets and improve the content to maximize relevance and effectiveness.</p>
                        <p class="mb-1">Users can access the following directly from CLM:</p>
                        <ul v-for="(item, index) in items" :key="index" :class="['', item.class ]">
                            <li v-for="(list, index) in item.list" :key="index" :class="['', list.class]" v-html="list.text"></li>
                        </ul>
                        <p class="lh-1-4">Additionally, users hosting meetings from the CRM Engage app can present CLM content. See Engage CLM Content Creation Guidelines for more information. Users can also display CLM content directly from a call objective. See Using CLM Call Objectives for more information.</p>
                    </div>
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
</style>