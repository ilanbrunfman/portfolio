<script setup>
import './Dosing.scss'

// components
import Wrapper from '@/components/isa/components/wrapper/Wrapper.vue'
import Circle from '@/components/isa/components/grahps/Circle.vue'
import Bar from '@/components/isa/components/grahps/Bar.vue'
import Line from '@/components/isa/components/grahps/Line.vue'

const circles = [
    // { 
    //     percent: 100,
    //     label: 'Design',
    //     type: 'gradient',
    //     colors: [
    //         { offset: '0%', color: 'rgba(42, 123, 155, 1)' },
    //         { offset: '100%', color: 'rgba(87, 199, 133, 1)' },
    //     // { offset: '100%', color: 'rgba(237, 221, 83, 1)' }
    //     ] 
    // },
    { percent: 22, label: 'Design', stroke: '#c0392b' },
    {
        percent: 45,
        label: 'Development',
        type: 'solid',
        stroke: '#f1c40f'
    },
    {
        percent: 90,
        label: 'Marketing',
        type: 'solid',
        stroke: '#42b983'
    }
]

const chart =  [
    {
        width: 490,
        height: 220,
        padding: 10,
        // color: '#1976D2',
        points: [
            { x: 0, y: 0 },
            { x: 1, y: 50 },
            { x: 2, y: 33 },
            { x: 3, y: 64 },
            { x: 4, y: 48 },
            { x: 5, y: 75 },
            { x: 6, y: 135 }
        ]
    },
    {
        width: 490,
        height: 220,
        padding: 10,
        color: '#c0392b',
        points: [
            { x: 0, y: 0 },
            { x: 1, y: 20 },
            { x: 2, y: 3 },
            { x: 3, y: 8 },
            { x: 4, y: 16 },
            { x: 5, y: 33 },
            { x: 6, y: 44 }
        ]
    },
    {
        width: 490,
        height: 220,
        padding: 10,
        color: '#42b983',
        points: [
            { x: 0, y: 0 },
            { x: 1, y: 70 },
            { x: 2, y: 89 },
            { x: 3, y: 102 },
            { x: 4, y: 78 },
            { x: 5, y: 95 },
            { x: 6, y: 111 }
        ]
    }
]


const bars = {
    items: [
        //   { percent: 80, label: 'Vue', color: '#42b983' },
        { percent: 38, label: 'Ilan', gradient: 'linear-gradient(90deg,rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)' },
        { percent: 35, label: 'React', color: '#c0392b' },
        { percent: 65, label: 'GSAP', color: '#f1c40f' },
    ]
}

const bars2 = {
    items: [
        { percent: 99, label: 'HTML', color: '#42b983' },
        { percent: 86, label: 'CSS', color: '#1976D2' },
        { percent: 72, label: 'Vue', gradient: 'linear-gradient(0deg,rgba(131, 58, 180, 1) 0%, rgba(253, 29, 29, 1) 50%, rgba(252, 176, 69, 1) 100%)' },
        { percent: 35, label: 'React', color: '#c0392b' },
        { percent: 65, label: 'GSAP', color: '#f1c40f' },
    ]
}

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

</script>

<template>
    <Wrapper class="dosing">
        <template #body>
            <div class="container">
                <div class="row">
                    <div class="col-12 pt-4 mb-1">
                        <h1>ISA - Dosing</h1>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 d-grid grid-2 gap-4 mb-2">
                        <div class="col-12 d-grid grid-3 gap-1 ">
                            <Circle 
                                v-for="(circle,index) in circles" 
                                :key="index" 
                                :item="circle" 
                                :index="index"
                            />
                        </div>
                        <div class="col-12 ">
                            <div class="chart" style="position: relative;">
                                <Line v-for="(line, index) in chart" :key="index" :data="line"/>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12 d-grid grid-2 gap-3">
                        <div class="bar-chart d-flex flex-direction-column gap-1">
                            <Bar 
                                v-for="(bar,index) in bars.items" 
                                :key="index" 
                                :item="bar" 
                                :index="index" 
                                group="h"
                                direction="horizontal" 
                            />
                        </div>
                        <div class="bar-chart d-flex gap-0-5">
                            <Bar 
                                v-for="(bar,index) in bars2.items" 
                                :key="index" 
                                :item="bar" 
                                :index="index" 
                                group="v"
                                direction="vertical" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Wrapper>
</template>


<style scoped>
.bar-chart {
    width: 600px;
    margin: 2rem auto;
}
</style>
