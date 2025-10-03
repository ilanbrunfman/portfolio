<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import gsap from 'gsap';

const props = defineProps({
    data: { type: Object, require: true },
});

const lineRef = ref(null);

const scaledPoints = computed(() => {
    const maxX = Math.max(...props.data.points.map(p => p.x));
    const minX = Math.min(...props.data.points.map(p => p.x));
    return props.data.points.map(p => ({
        x: props.data.padding + ((p.x - minX) / (maxX - minX)) * (props.data.width - props.data.padding * 2),
        y: props.data.height - props.data.padding - p.y
    }));
});

const linePath = computed(() =>
    scaledPoints.value
        .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
        .join(" ")
);

const pathLength = computed(() => {
    let len = 0;
    const points = scaledPoints.value;
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
});

onMounted(async () => {
    await nextTick();

    const line = lineRef.value;
    line.style.strokeDasharray = pathLength.value;
    line.style.strokeDashoffset = pathLength.value;

    const tl = gsap.timeline();

    // draw line
    tl.to(line, {
        strokeDashoffset: 0,
        duration: 3,
        ease: "power2.out"
    }, "start"); // label this as "start"

    // animate circles at the SAME time as line
    props.data.points.forEach((_, i) => {
        tl.fromTo(`#circle-${i}`,
            { scale: 0, opacity: 0, transformOrigin: "center center" },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" },
            `start+=${i * 0.3}`  // offset each circle slightly, but all during the line draw
        );
    });
});
</script>

<template>
    <svg :width="data.width" :height="data.height" style="position: absolute; top: 0; left: 0;">
        <path
            ref="lineRef"
            :d="linePath"
            fill="none"
            :stroke="data.color ? data.color : '#1976D2'"
            stroke-width="2.5"
        />
        <circle
            v-for="(p, i) in scaledPoints"
            :id="`circle-${i}`"
            :key="i"
            :cx="p.x"
            :cy="p.y"
            r="5"
            :fill="data.color ? data.color : '#1976D2'"
        />
    </svg>
</template>