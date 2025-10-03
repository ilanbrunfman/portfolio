<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { gsap } from 'gsap'
import './Patient.scss'
import { dataset } from '@/database/dataset.js'
import Wrapper from '@/components/isa/components/wrapper/Wrapper.vue'

const groups = ref({
    stepOne: [
        { id: 'dlbcl', indication: 'dlbcl', label: 'dlbcl', selected: false },
        { id: 'fl', indication: 'fl', label: 'fl', selected: false }
    ],
    stepTwo: [
        { id: 'monotherapy-dlbcl', indication: 'dlbcl', rule: 'monotherapy', label: 'Monotherapy', selected: false },
        // { id: 'therapy-dlbcl', indication: 'dlbcl', rule: 'therapy', label: `Combination Therapy with R<sup>2</sup>`, selected: false },
        { id: 'monotherapy-fl', indication: 'fl', rule: 'monotherapy', label: 'Monotherapy', selected: false },
        { id: 'therapy-fl', indication: 'fl', rule: 'therapy', label: `Combination Therapy with R<sup>2</sup>`, selected: false },
    ],
    stepThree: [
        { id: 'age', indication: 'dlbcl', rule: 'monotherapy', label: `Age`, active: false },
        { id: 'gender', indication: 'dlbcl', rule: 'monotherapy', label: `Gender`, active: false },
        { id: 'race', indication: 'dlbcl', rule: 'monotherapy', label: `Race`, active: false },
        { id: 'ecog', indication: 'dlbcl', rule: 'monotherapy', label: `Baseline ECOG performance score`, active: false },
        { id: 'prior_car-t', indication: 'dlbcl', rule: 'monotherapy', label: `Number of prior antilymphoma therapies`, active: false },
        { id: 'last_anti-CD20', indication: 'dlbcl', rule: 'monotherapy', label: `Time from last CD20 therapy`, active: false },
        { id: 'refractory_prior_car-t', indication: 'dlbcl', rule: 'monotherapy', label: `Refractory to prior<br/> CAR T`, active: false },
        { id: 'prior_asct', indication: 'dlbcl', rule: 'monotherapy', label: `Prior ASCT`, active: false },
        { id: 'prior_anti-lymphoma', indication: 'dlbcl', rule: 'monotherapy', label: `Prior antilymphoma therapy status`, active: false },
        { id: 'recent_prior_anti-CD20', indication: 'dlbcl', rule: 'monotherapy', label: `Most recent prior anti-CD20-containing therapy status`, active: false },
        { id: 'chromosomal_abnormality', indication: 'dlbcl', rule: 'monotherapy', label: `Chromosomal<br/> abnormality`, active: false },
        { id: 'ann_arbor_staging', indication: 'dlbcl', rule: 'monotherapy', label: `Ann Arbor staging`, active: false },
        { id: 'ipi_score', indication: 'dlbcl', rule: 'monotherapy', label: `IPI score`, active: false },
        { id: 'dlbcl_disease_state', indication: 'dlbcl', rule: 'monotherapy', label: `DLBCL disease state`, active: false },

        { id: 'age', indication: 'fl', rules: 'monotherapy', label: `Age`, active: false },
        { id: 'gender', indication: 'fl', rules: 'monotherapy', label: `Gender`, active: false },
        { id: 'race', indication: 'fl', rule: 'monotherapy', label: `Race`, active: false },
        { id: 'baseline_ECOG', indication: 'fl', rule: 'monotherapy', label: `Baseline ECOG performance score`, active: false },
        { id: 'prior_anti-lymphoma', indication: 'fl', rule: 'monotherapy', label: `Number of prior antilymphoma therapies`, active: false },
        { id: 'last_recent_therapy', indication: 'fl', rule: 'monotherapy', label: `Time from last therapy`, active: false },
        { id: 'last_anti-CD20', indication: 'fl', rule: 'monotherapy', label: `Time from last anti-CD20 therapy`, active: false },
        { id: 'prior_car_t', indication: 'fl', rule: 'monotherapy', label: `Prior CAR T experience`, active: false },
        { id: 'prior_acst', indication: 'fl', rule: 'monotherapy', label: `Prior ASCT`, active: false },
        { id: 'pod24_immuno', indication: 'fl', rule: 'monotherapy', label: `POD24 (any 1L therapy)`, active: false },
        { id: 'pod24_first-line', indication: 'fl', rule: 'monotherapy', label: `POD24 (first CIT)`, active: false },
        { id: 'refractory_prior_therapy', indication: 'fl', rule: 'monotherapy', label: `Refractory to last prior therapy`, active: false },
        { id: 'double_refractory', indication: 'fl', rule: 'monotherapy', label: `Double refractory`, active: false },
        // prior_anti-CD20
    ],
    stepFour: [],
})

const results = ref(false)

// --- Step One (Histology) ---
const toggleStepOne = (id) => {
    groups.value.stepOne.forEach(opt => opt.selected = opt.id === id && !opt.selected)

    // Reset step two & three whenever histology changes
    groups.value.stepTwo.forEach(opt => (opt.selected = false))
    groups.value.stepThree.forEach(opt => (opt.active = false))
}

// Computed: user selected stepOne
const selectedStepOne = computed(() => {
    const selected = groups.value.stepOne.find(opt => opt.selected)
    return selected ? selected.id : null // fallback default
})

// Computed: user selected stepTwo
const selectedStepTwo = computed(() => {
    const selected = groups.value.stepTwo.find(opt => opt.selected)
    return selected ? selected.rule : ''
})

// --- Step Two (Regimen) ---
const toggleStepTwo = (item) => {
    if (!selectedStepOne.value) return // can’t pick stepTwo without stepOne
    groups.value.stepTwo.forEach(opt => opt.selected = opt.id === item.id && !opt.selected)

    // Reset step three if regimen changes
    groups.value.stepThree.forEach(opt => (opt.active = false))
}

// --- Step Two (Regimen) ---
const filteredStepTwo = computed(() => {
    return groups.value.stepTwo.filter(opt => opt.indication === selectedStepOne.value)
})

// --- Step Three (Patient’s Characteristics:) ---
const toggleStepThree = (item) => {
    const target = groups.value.stepThree.find(
        opt => opt.id === item.id && opt.indication === item.indication
    )
    if (!target) return

    if (target.active) {
        // Allow de-selection always
        target.active = false
    } else {
        // Only allow new selection if less than 3 active
        const activeCount = groups.value.stepThree.filter(opt => opt.active).length
        if (activeCount < 3) {
            target.active = true
        }
    }
}

// Computed: user selected stepOne and stepTwo
const filteredStepThree = computed(() => {
  // Require both stepOne and stepTwo
  if (!selectedStepOne.value || !selectedStepTwo.value) {
    return []
  }

  return groups.value.stepThree
    .filter(opt => {
      if (opt.indication !== selectedStepOne.value) return false

      // normalize rule(s) into an array for consistency
      const rules = Array.isArray(opt.rules) ? opt.rules : [opt.rule]

      return rules.includes(selectedStepTwo.value)
    })
    .slice() // clone to avoid mutating original
    .sort((a, b) => a.label.localeCompare(b.label))
})

// Computed: Collect User Selection - This is helpful to debug or send results:
const userSelection = computed(() => ({
    stepOne: selectedStepOne.value,
    stepTwo: selectedStepTwo.value,
    stepThree: groups.value.stepThree
        .filter(opt => opt.active)
        .map(opt => opt.id)
}))

// --- Structured Dataset (Group by stepThree.id / group_value) ---
const structuredDataset = computed(() => {
    if ( !userSelection.value.stepOne || !userSelection.value.stepTwo || userSelection.value.stepThree.length === 0 ) return []

    // Filter rows that match StepOne, StepTwo, StepThree
    const filtered = dataset.filter(row => {
        if (row.indication !== userSelection.value.stepOne) return false
        if (row.rule !== userSelection.value.stepTwo) return false
        return userSelection.value.stepThree.includes(row.group_value)
    })

    // Reduce into grouped object by group_value
    const grouped = filtered.reduce((acc, row) => {
        if (!acc[row.group_value]) {
            acc[row.group_value] = {
                id: row.group_value,
                label: row.group_label,
                items: []
            }
        }
        acc[row.group_value].items.push(row)
        return acc
    }, {})

    // Convert to array for Vue looping
    return Object.values(grouped)
})


// Reuse stepFour as the place to store results:
const stepFour = computed(() => {
    return structuredDataset.value.map(group => ({
        ...group,
        selected: false // optional flag if you want to toggle groups later
    }))
})

const resetSteps = (id) => {
    groups.value.stepOne.forEach(opt => opt.selected = opt.id === id && !opt.selected)

    // Reset step two & three whenever histology changes
    groups.value.stepTwo.forEach(opt => (opt.selected = false))
    groups.value.stepThree.forEach(opt => (opt.active = false))
    results.value = false
    console.log('nextStep', results.value)
}

const goBackStep = () => {
    results.value = false
}
const nextStep = () => {
    if( stepFour.value.length > 0 ) results.value = true
}

/// store refs for pr/cr bars
let prRefs = {}
let crRefs = {}

// Animate PR/CR bars whenever dataset changes
watch([structuredDataset, () => results.value], async ([data, isResults]) => {
  if (!isResults || !data.length) return

  // Clear previous refs
  prRefs = {}
  crRefs = {}

  // Wait for DOM to render the v-else block
  await nextTick()

  const columnHeight = 260

  data.forEach(group => {
    group.items.forEach((item, i) => {
      const key = `${group.id}-${i}`
      const prEl = prRefs[key]
      const crEl = crRefs[key]

      if (prEl) {
        const h = (Number(item.pr_value) / 100) * columnHeight
        gsap.fromTo(prEl, { height: '0px' }, { height: `${h}px`, duration: 0.01 })
      }

      if (crEl) {
        const h = (Number(item.cr_value) / 100) * columnHeight
        gsap.fromTo(crEl, { height: '0px' }, { height: `${h}px`, duration: 0.01 })
      }
    })
  })
})







</script>

<template>
    <Wrapper class="patient">
        <template #body>

            <div class="container">

                <div class="row">
                    <div class="col-12 pt-4 mb-2">
                        <h1>Patient</h1>
                    </div>
                </div>

                <template v-if="!results">
                    <div class="row">
                        <div class="col-12 d-grid grid-7-5 gap-1 mb-1">
                            <div class="col">
    
                                <div class="row">
                                    <div class="col-12">
                                        <h2 class="fs-20 fw-600 mb-1">Filter:</h2>
                                    </div>
                                </div>
    
                                <div class="row">
                                    <div class="col-12 mb-1">
                                        <form class="d-grid grid-2 gap-1">
                                            <div class="col">
                                                <div :class="['card card-filter',]">
                                                    <div class="row">
                                                        <div class="col-12 mb-1">
                                                            <label class="label fs-14 fw-bold text-capitalize">histology:</label>
                                                        </div>
                                                        <div class="col-12">
                                                            <label v-for="(item, index) in groups.stepOne" :key="index" :class="['btn btn-radio text-uppercase', item.selected ? 'active' : '']">
                                                                <input 
                                                                    type="radio" 
                                                                    :checked="item.selected" 
                                                                    :id="item.label" 
                                                                    @click="toggleStepOne(item.id)" 
                                                                />
                                                                <span class="fw-bold text-center" v-html="item.label"></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <div :class="['card card-filter', !selectedStepOne ? 'disabled' : '']">
                                                    <div class="row">
                                                        <div class="col-12 mb-1">
                                                            <label class="label fs-14 fw-bold text-capitalize">regimen:</label>
                                                        </div>
                                                        <div class="col-12">
                                                            <label 
                                                                v-for="(item, index) in filteredStepTwo" 
                                                                :key="index" 
                                                                :class="['btn btn-radio', item.selected ? 'active' : '', !selectedStepOne ? 'disabled' : '']"
                                                            >
                                                                <input 
                                                                    type="radio" 
                                                                    :checked="item.selected" 
                                                                    :id="item.label" 
                                                                    :disabled="!selectedStepOne && item.selected"
                                                                    @click="toggleStepTwo(item)" 
                                                                />
                                                                <span class="fw-bold text-center" v-html="item.label"></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                     <div class="col-12 d-none">
                                        <h2 class="fs-20 fw-600 mb-1">User Selection:</h2>
                                        <h3>{{ userSelection }}</h3>
                                    </div>

                                    <div class="col-12 d-none">
                                        <h2 class="fs-20 fw-600 mt-1 mb-1">Dataset output:</h2>
                                        <div style="overflow-y: auto; height: 200px; max-width: 500px;">
                                            <pre v-if="structuredDataset.length > 0">{{ structuredDataset }}</pre>
                                            <p v-else>No results</p>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
    
                            <div class="col">
                                <div class="row">
                                    <div class="col-12">
                                        <h2 class="fs-20 fw-600 mb-1">Patient’s Characteristics:</h2>
                                    </div>
                                </div>
    
                                <div class="row">
                                    <div :class="['card card-filter', !selectedStepOne || !selectedStepTwo ? 'disabled' : '']">
                                        <div class="col-12 mb-1">
                                            <label class="label fs-14 fw-bold text-capitalize">Categories:</label>
                                        </div>
    
                                        <template v-if="selectedStepTwo && filteredStepThree.length > 0">
    
                                            <div class="mb-1" style="overflow-y: auto; max-height: 340px;">
                                                <div class="col-12 d-grid grid-2 gap-1 " >
                                                    <button 
                                                        v-for="(item, index) in filteredStepThree" 
                                                        :key="index" 
                                                        :class="[
                                                            'btn btn-item',
                                                            selectedStepOne ? 'show' : 'hide',
                                                            selectedStepTwo && item.active ? 'btn-item-selected' : '',
                                                        ]"
                                                        :disabled="!selectedStepTwo"
                                                        @click="toggleStepThree(item)"
                                                    >
                                                        <h3 class="text-center fw-bold" v-html="item.label"></h3>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="d-flex justify-center gap-1">
                                                    <button class="btn btn-defualt" @click="resetSteps()">Reset</button>
                                                    <button :class="['btn', userSelection.stepThree.length > 0 ? 'btn-primary' : 'btn-defualt']" @click="nextStep()">Next</button>
                                                </div>
                                            </div>
                                        </template>

                                        <div v-if="selectedStepTwo && !filteredStepThree.length > 0" class="col-12">
                                            <p>Filter Patient's Characteristics List is empty!</p>
                                        </div>
                                    </div>
                                </div>
    
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div class="row">
                        <div class="col-12">
                            <div class="d-flex justify-start gap-1">
                                <button class="btn btn-primary" @click="goBackStep()">Go Back</button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 d-grid grid-8-4 gap-1">
                            <div class="col">
                                <h2 class="fs-20 fw-600 mt-1 mb-1">Output:</h2>
                                <div class="d-flex align-items-end gap-1" v-if="structuredDataset.length > 0">
                                    <div
                                        v-for="(group, g) in structuredDataset"
                                        :key="g"
                                        class="chart-group"
                                    >
                                        <div class="chart-group-body">
                                            <div class="chart-group-header text-center">
                                                <h3 class="fs-12 fw-bold lh-1-2" style="max-width: 120px;">{{ group.label }}</h3>
                                            </div>
                                            <div class="chart-group-columns d-flex justify-center gap-1 ">
                                                <div 
                                                    v-for="(item, i) in group.items"
                                                    :key="i"
                                                    class="chart-group-column"
                                                >
                                                    <div class="chart-group-orr">
                                                        <h3 class="fs-24 fw-bold text-center">{{ item.orr_value }}<sup>%</sup></h3>
                                                        <p v-if="item.orr_label" class="fs-11 fw-400 lh-1-2 text-center mb-0-5">{{ item.orr_label }}</p>
                                                    </div>
                                                    <div class="chart-group-column-container">
                                                        <div class="chart-group-pr">
                                                            <div class="chart-bar" :ref="el => prRefs[group.id + '-' + i] = el">
                                                                <h3 class="fs-16 fw-bold text-center clr-white">{{ item.pr_value }}<sup>%</sup></h3>
                                                                <p v-if="!item.pr_label">{{ item.pr_label }}</p>
                                                            </div>
                                                        </div>
                                                        <div class="chart-group-cr">
                                                            <div class="chart-bar" :ref="el => crRefs[group.id + '-' + i] = el">
                                                                <h3 class="fs-16 fw-bold text-center clr-white">{{ item.cr_value }}<sup>%</sup></h3>
                                                                <p v-if="!item.cr_label">{{ item.cr_label }}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="chart-group-column-footer">
                                                        <p class="fs-11 fw-400 lh-1-2 text-center">{{ item.sub_group }}</p>
                                                        <h5 class="fs-11 fw-bold text-center">{{ item.sub_group_n_value }}</h5>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    

                                </div>
                                <p v-else>No results</p>
                            </div>
                            <!-- <div class="col pr-2" style="overflow-y: auto; max-height: 460px;">
                                 <h2 class="fs-20 fw-600 mt-1 mb-1">Dataset:</h2>
                                <pre v-if="structuredDataset.length > 0">{{ structuredDataset }}</pre>
                            </div> -->
                        </div>
                    </div>
                </template>
            
            </div>

        </template>
    </Wrapper>
</template>

<style lang="scss" scoped>
.chart{
    &-group{
        &-body{
            position: relative;
            background-color: #F2EBF3;
            border-top-left-radius: 20px;
            border-top-right-radius: 20px;
            padding: 10px 20px 0px 20px;
            min-height: 384px;
        }
        &-header{
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 64px;
        }
        &-column{
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            height: 310px;
            width: 62px;
            // background-color: red;

            &-container{
                background-color: #2B3272;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 4px 4px 0 4px;
                // height: 244px;

                sup{
                    font-weight: bold;
                    position: relative;
                    top: 1px;
                    font-size: 10px;
                }
            }

            &-footer{
                position: absolute;
                bottom: -52px;
                height: 52px;
                width: 100%;
                // background-color: pink;
            }
        }
        .chart-bar{
            height: 0; // GSAP animates from 0
            display: flex;
            align-items: center;
            justify-content: center;
        }
        &-orr{
            sup{
                font-weight: bold;
                position: relative;
                top: 2px;
                font-size: 14px;
            }
        }
        &-pr{
            .chart-bar{ background-color: #9B60A1; }
        }
        &-cr{
            .chart-bar{ background-color: #00838F; }
        }
    }
}
</style>