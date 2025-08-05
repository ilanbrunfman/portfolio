<script setup>
import { ref, computed } from 'vue'
import './Patient.scss'
import { dataset } from '@/database/dataset.js'
import Wrapper from '@/components/isa/components/shared/wrapper/Wrapper.vue'

const groups = ref({
    gender: [
        { label: 'male', selected: false },
        { label: 'female', selected: false }
    ],
    category: [
        { label: 'sales', selected: false },
        { label: 'service', selected: false },
        { label: 'marketing', selected: false }
    ],
})

// Computed: check if gender is selected
const isGenderSelected = computed(() => {
    return groups.value.gender.some(option => option.selected)
})

// toggle group
const toggleGroup = (group, label) => {
    // Prevent selecting category if gender not selected
    if (group === 'category' && !isGenderSelected.value) return

    // Toggle logic
    groups.value[group].forEach(option => {
        option.selected = option.label === label ? !option.selected : false
    })

    // Reset category if gender is deselected
    if (group === 'gender' && !isGenderSelected.value) {
        groups.value.category.forEach(option => option.selected = false)
    }

    
}

// Computed: selected values from each group
const selectedGroupsMap = computed(() => {
    const map = {}
    for (const key in groups.value) {
        const group = groups.value[key]

        // Handle radio groups (array of objects with .label and .selected)
        if (Array.isArray(group) && group.every(opt => 'label' in opt && 'selected' in opt)) {
            const selected = group.find(opt => opt.selected)
            map[key] = selected ? selected.label : ''
        }

        // Handle plain inputs (e.g., city, age)
        else if (typeof group === 'string' && group !== '') {
            map[key] = group
        }
    }
    return map
})

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
    <Wrapper class="patient">
        <template #body>

            <div class="container">

                <div class="row">
                    <div class="col-12 pt-4 mb-2">
                        <h1>ISA - Patient</h1>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 d-grid grid-5-7 gap-1">
                        <div class="col">
                            <div class="row">
                                <div class="col-12">
                                    <h2 class="fs-20 fw-600 mb-1">Filter:</h2>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 ">
                                    <form class="d-grid grid-2 gap-1">
                                        <div class="col">
                                            <div class="card card-filter">
                                                <div class="row">
                                                    <div class="col-12 mb-1">
                                                        <label class="label fs-14 fw-bold">Gender:</label>
                                                    </div>
                                                    <div class="col-12">
                                                        <label v-for="gender in groups.gender" :key="gender.label" :class="['btn', gender.selected ? 'active' : '']">
                                                            <input type="radio" :checked="gender.selected" :id="gender.label" @click="toggleGroup('gender', gender.label)" />
                                                            {{ gender.label }}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <div class="card card-filter">
                                                <div class="row">
                                                    <div class="col-12 mb-1">
                                                        <label class="label fs-14 fw-bold">Category:</label>
                                                    </div>
                                                    <div class="col-12">
                                                        <label 
                                                            v-for="category in groups.category" 
                                                            :key="category.label" 
                                                            :class="['btn', category.selected ? 'active' : '', !isGenderSelected ? 'disabled' : '']"
                                                        >
                                                            <input 
                                                                type="radio" 
                                                                :checked="category.selected" 
                                                                :id="category.label" 
                                                                :disabled="!isGenderSelected"
                                                                @click="toggleGroup('category', category.label)" 
                                                            />
                                                            {{ category.label }}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div class="col">
                            <div class="row">
                                <div class="col-12">
                                    <h2 class="fs-20 fw-600 mb-1">Patients:</h2>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 d-grid grid-3 gap-1" v-if="filteredDataset.length > 0">
                                    <div v-for="(item, index) in filteredDataset" :key="index" :class="['card card-item',]">
                                        <div class="row">
                                            <div class="col-12 d-flex gap-0-5">
                                                <div class="d-flex gap-0-5 mb-0-5">
                                                    <label class="label fs-14 fw-bold">Name:</label>
                                                    <p class="text-capitalize" v-html="item.name"></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-12">
                                                <div class="d-flex gap-0-5 mb-0-5">
                                                    <label class="label fs-14 fw-bold">Gender:</label>
                                                    <p class="text-capitalize" v-html="item.gender"></p>
                                                </div>
                                                <div class="d-flex gap-0-5 mb-0">
                                                    <label class="label fs-14 fw-bold">Category:</label>
                                                    <p class="text-capitalize" v-html="item.category"></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-else class="col-12">
                                    <p>No results match.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>

        </template>
    </Wrapper>
</template>