<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
    item: { type: Object, required: true,  },
    index: { type: Number, required: true, },
    group: { type: String, required: true, /* unique per chart group */},
    direction: { type: String, default: 'horizontal',  /* or 'vertical' */ },
})


onMounted(() => {
    const selector = `.bar-fill-${props.group}-${props.index}`
    // const selector = `.bar-fill-${props.index}`
    const percent = props.item.percent
    const delay = props.index * 0.2 // Add stagger delay here

    if (props.direction === 'vertical') {
        gsap.fromTo(selector,
        { height: '0%' },
        {
            height: `${percent}%`,
            duration: 1.4,
            delay,
            ease: "power1.out",
        }
        )
    } else {
        gsap.fromTo(selector,
        { width: '0%' },
        {
            width: `${percent}%`,
            duration: 1.4,
            delay,
            ease: "power1.out",
        }
        )
    }
})
</script>

<template>
    <div class="bar-wrapper" :class="direction">
        <div class="label">{{ item.label }}</div>
        <div class="bar-bg" :class="direction">
            <div
                :class="['bar-fill-' + group + '-' + index, 'bar-fill', direction]"
                :style="{ background: item.color ? item.color : item.gradient }"
            ></div>
        </div>
        <div class="percent">{{ item.percent }}%</div>
    </div>
</template>

<style lang="scss" scoped>
.bar {
  &-wrapper {
    display: flex;
    gap: 0.5rem;

    &.horizontal {
      flex-direction: column;
      align-items: stretch;
    }

    &.vertical {
      flex-direction: column;
      align-items: center;
      height: 200px;
    }
  }

  .label {
    font-weight: bold;
    font-size: 14px;
  }

  &-bg {
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
    position: relative;

    &.horizontal {
      width: 100%;
      height: 20px;
    }

    &.vertical {
      width: 30px;
      height: 100%;
      display: flex;
      align-items: flex-end;
    }
  }

  &-fill {
    background: #42b983;
    border-radius: 4px;

    &.horizontal {
      height: 100%;
      width: 0%;
    }

    &.vertical {
      width: 100%;
      height: 0%;
    }
  }

  .percent {
    font-size: 12px;
    color: #555;
    margin-top: 0.25rem;
    text-align: right;

    .vertical & {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }
  }
}


</style>