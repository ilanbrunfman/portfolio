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
        <div class="chart-container">
            <div class="row">
                <div class="col-12 chart-header" >
                    <h3 class="fs-14 text-center" v-html="props.item.title"></h3>
                </div>
            </div>
            <div class="chart-columns">
                <div 
                    v-for="(chart, c) in props.item.columns"
                    :key="c"
                    class="chart-column"
                >   
                    <div class="chart-column-header">
                        <h3 class="chart-column-label" >
                            <span class="title" v-html="`${chart.groupLabel.percent}%<br/>`"></span>
                            <span v-if="chart.groupLabel.label" class="para" v-html="chart.groupLabel.label"></span>
                        </h3>
                    </div>
                    <div class="chart-group-container">
                        <div 
                            v-for="(group, g) in chart.items" 
                            :key="g" 
                            :class="['chart-group', `chart-group-${group.type}`]"
                        >
                            <div 
                                :class="['chart-bar',]"
                                :ref="setBarRef"
                                :data-percent="group.percent"
                            >
                                <h3 class="chart-bar-label" >
                                    <span class="title" v-html="`${group.percent}%<br/>`"></span>
                                    <span v-if="group.label" class="para" v-html="group.label"></span>
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div class="chart-footer">
                        <p class="title" v-html="chart.footer.title"></p>
                        <p class="number" v-html="chart.footer.number"></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chart{
    &-container{
        background-color: #F2EBF3;
        border-top-left-radius: 20px;
        border-top-right-radius: 20px;
        padding: 14px 10px;
        padding-bottom: 0;
    }
    &-header{
        height: 50px;
    }
    &-columns{
        display: flex;
        gap: 10px;
    }
    &-column{
        position: relative;
        height: 340px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;

        &-label{
            text-align: center;

            & .title{
                font-size: 18px;
                font-weight: bold;
                display: block;
                margin-bottom: 2px;
            }
            & .para{
                display: block;
                font-size: 11px;
                margin-bottom: 5px;
            }
        }
    }
    &-group{
        color: #fff;
        width: 70px;

        &-container{
            background-color: #071d49;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            padding: 4px;
            padding-bottom: 0;
        }

        &-pr{
            .chart-bar{ background-color: #9B60A1;}
        }
        &-cr{
            .chart-bar{ background-color: #00838F;}
        }

        &:first-child{
            border-top-left-radius: 4px;
            border-top-right-radius: 4px;
            overflow: hidden;
        }
    }
    &-bar{
        display: flex;
        align-items: center;
        justify-content: center;

        &-label{
            text-align: center;

            & .title{
                font-size: 18px;
                font-weight: bold;
            }
            & .para{
                display: block;
                font-size: 11px;
                padding-top: 5px;
            }
        }

    }
    &-footer{
        position: absolute;
        bottom: -74px;
        height: 68px;
        width: 100%;
        text-align: center;

        .title{
            font-size: 12px;
            margin-bottom: 4px;
            width: 80px;
        }
        .number{
            font-size: 12px;
            font-weight: bold;
            color: #071d49;
        }
    }
}
</style>