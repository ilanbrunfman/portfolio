<script setup>
import { ref, computed, onMounted } from 'vue'
import { dataset } from '@/database/dataset.js'
import StackTwo from '@/components/isa/components/grahps/StackTwo.vue'

const optionTwo = {
    groups: [
        {
            title: 'Age',
            columns: [
                {
                    groupLabel: { percent: 53, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 19, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 34, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: '<65 years', number: `(n=74/148)` }
                },
                {
                    groupLabel: { percent: 67, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 29, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 38, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: 'Nodal or extranodal mass >6 cm', number: `(n=50/127)` }
                },
                {
                    groupLabel: { percent: 72, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 24, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 48, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: '≥75 years', number: `(n=29/148)` }
                },
            ]
        },
        {
            title: 'Most recent prior anti-<br/>CD20–containing<br/> therapy status',
            columns: [
                {
                    groupLabel: { percent: 53, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 19, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 34, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: 'Refractory', number: `(n=126/148)` }
                },
                {
                    groupLabel: { percent: 100, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 32, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 68, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: 'Relapse', number: `(n=22/148)` }
                },
            ]
        },
        {
            title: 'Time from last anti-CD20<br/> therapy until first dose of<br/> EPKINLY',
            columns: [
                {
                    groupLabel: { percent: 47, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 20, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 27, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: 'Refractory', number: `(n=126/148)` }
                },
                {
                    groupLabel: { percent: 99, type: 'orr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', },
                    items: [
                         { percent: 57, type: 'pr', label: '',  color: '#9B60A1' },
                         { percent: 42, type: 'cr', label: '(n=XX/XXX;<br/> XX% CI, XX-XX)', color: '#00838F' },
                    ],
                    footer: { title: 'Relapse', number: `(n=22/148)` }
                },
            ]
        },
    ]
}

// Computed: filtered dataset
const filteredDataset = computed(() => {
    return dataset.filter(item => {
        for (const key in selectedGroupsMap.value) {
            const selectedValue = selectedGroupsMap.value[key]
            if (selectedValue && item[key] !== selectedValue) {
                return false
            }
        }
        return true
    })
})


</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-12 pt-4 mb-2">
                <h1>ISA - Approved Email</h1>
            </div>
        </div>

        <div class="row">
            <div class="col-12 d-grid grid-1">
                <div class="chart-tool d-flex gap-1">
                    <StackTwo
                        v-for="(item, index) in optionTwo.groups"
                        :key="index"
                        :item="item"
                    />
                </div>
            </div>
        </div>
        
    </div>
</template>

<style lang="scss" scoped>
.chart-tool{
    width: 1280px;
    padding-right: 100px;
    height: 500px;
    overflow-x: scroll;
}
</style>