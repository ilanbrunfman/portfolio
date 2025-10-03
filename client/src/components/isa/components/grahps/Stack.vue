<script setup>
import { onMounted, ref, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  item: { type: Object, required: true },
})

const barRefs = ref([])

const setBarRef = (el) => {
  if (el) barRefs.value.push(el) // only push non-null elements
}

onMounted(async () => {
  barRefs.value = [] // clear refs before mounting
  await nextTick()

  const columnHeight = 260

  props.item.columns.forEach((column) => {
    column.items.forEach((bar) => {
      const el = barRefs.value.shift()
      if (!el) return

      const barHeightPx = (bar.percent / 100) * columnHeight

      gsap.fromTo(
        el,
        { height: '0px' },
        { height: barHeightPx + 'px', duration: 0.01, ease: 'power2.out', }
      )
    })
  })
})


</script>

<template>
    <div class="chart">
        <div class="chart-wrapper">
            <div 
                v-for="(chart, c) in item.columns" 
                :key="c" 
                class="chart-column">
                <div 
                    v-for="(bar, b) in chart.items" 
                    :key="b"
                    :class="['chart-group', `chart-group-${bar.label.toLowerCase()}`]"
                >
                    <h5 class="fs-11 text-center nowrap" v-html="bar.title"></h5>
                    <div
                        class="chart-bar"
                        :ref="setBarRef"
                        :data-percent="bar.percent"
                        
                    >
                        <h3 class="label text-uppercase" v-html="bar.percent + `<sup>%</sup><br/>` + bar.label"></h3>
                    </div>
                </div>
            </div>
            
        </div>
        <h3 class="sub-title text-center fw-bold fs-16 pt-0-5" v-html="item.title"></h3>
    </div>
</template>

<style lang="scss" scoped>
.chart{
    &-wrapper{
        display: flex;
        justify-content: center;
        
    }
    &-column{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;

        height: 260px;
        width: 140px;
        // background-color: pink;

        &:last-child{
            align-items: flex-start;
            .chart-group{
                flex-direction: row-reverse;

                .chart-bar{
                    width: 48px;
                }
            }
        }
    }
    &-group {
        display: flex;
        // flex-direction: column;
        align-items: center;
        gap: 10px;
        // margin-bottom: 12px;
        // width: 80px; // optional: fixed width for bars
        
        &-orr .chart-bar{ background-color: #071d49; }
        &-cr .chart-bar{ background-color: #00838F; }
        &-pr .chart-bar{ background-color: #9B60A1; }
        
    }
    &-bar {
        width: 62px;
        height: 0%; // initial, GSAP will animate
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        // border-radius: 4px;
        // overflow: hidden;
        transition: background 0.3s ease;
        
        .label{
            text-align: center;
            font-size: 12px;
            font-weight: bold;
        }
    }
}
</style>