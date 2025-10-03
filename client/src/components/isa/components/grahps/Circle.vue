<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})


onMounted(() => {
    const selector = `.progress-circle-${props.index}`
    const circle = document.querySelector(selector)
    const length = circle.getTotalLength()
    const delay = props.index * 0.2 // Add stagger delay here

    gsap.fromTo(circle, 
    {
        strokeDasharray: length,
        strokeDashoffset: length,
        delay,
    },
    {
        strokeDashoffset: length * (1 - props.item.percent / 100),
        duration: 1.5,
        delay,
        ease: 'power1.out',
    })
})
</script>

<template>
    <div class="circle">
        <svg width="150" height="150" viewBox="0 0 100 100">
            <circle
                :class="['progress-circle-' + index]"
                cx="50"
                cy="50"
                r="45"
                :stroke="item.type === 'gradient' ? `url(#gradient-${index})` : item.stroke"
                stroke-width="10"
                fill="none"
                transform="rotate(-90 50 50)"
            />
            <text
                x="50"
                y="55"
                text-anchor="middle"
                font-size="16"
                fill="#333"
            >
                {{ item.percent }}%
            </text>
        </svg>
        <p style="text-align: center; font-weight: bold;">{{ item.label }}</p>
    </div>
</template>

<style lang="scss" scoped>
.circle{
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    
    svg{
        margin-inline: auto;
        margin-bottom: 1.0rem;
    }
}
</style>