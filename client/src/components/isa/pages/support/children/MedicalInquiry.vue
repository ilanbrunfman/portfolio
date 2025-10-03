<script setup>
import Stack from '@/components/isa/components/grahps/Stack.vue'

const data = {
    groups: [
        {
            title: 'EPKINLY + R2',
            columns: [
                {
                    items: [
                        { percent: 100, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'orr', color: '#071d49' },
                    ]
                },
                {
                    items: [
                        { percent: 12, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'pr', color: '#9B60A1' },
                        { percent: 88, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'cr', color: '#00838F' },
                    ]
                }
            ]
        },
        {
            title: 'R2 alone',
            columns: [
                {
                    items: [
                        { percent: 73, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'orr', color: '#071d49' },
                    ]
                },
                {
                    items: [
                        { percent: 33, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'pr', color: '#9B60A1' },
                        { percent: 40, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'cr', color: '#00838F' },
                    ]
                }
            ]
        },
        {
            title: 'R3 alone',
            columns: [
                {
                    items: [
                        { percent: 67, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'orr', color: '#071d49' },
                    ]
                },
                {
                    items: [
                        { percent: 22, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'pr', color: '#9B60A1' },
                        { percent: 45, title: '(n=XX/XXX;<br/> XX% CI, XX-XX)', label: 'cr', color: '#00838F' },
                    ]
                }
            ]
        },
    ]
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-12 pt-4 mb-2">
                <h1>ISA - Medical Inquiry</h1>
            </div>
        </div>

        <div class="row">
            <div class="col-12 d-grid grid-1">
                <div class="chart-tool d-flex gap-1">
                    <Stack 
                        v-for="(item, index) in data.groups" 
                        :key="index"
                        :item="item"
                    />
                </div>
            </div>
        </div>
    </div>
</template>