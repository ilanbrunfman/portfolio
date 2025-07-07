<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from '@/stores/index.js'

import IconCopy from '@/components/icons/IconCopy.vue'
import IconArrowsClockwise from '@/components/icons/IconArrowsClockwise.vue'
import IconTrash from '@/components/icons/IconTrash.vue'

const store = useStore()
store.fetchPassword()

onMounted(() => {
    generatePassword()
})

const length = ref(12)
const useUppercase = ref(true)
const useLowercase = ref(true)
const useNumbers = ref(true)
const useSymbols = ref(true)
const password = ref('')
const rotating = ref(false)

const generate = () => {
    
    if (!password.value.includes('Select at least one type')) {
        rotating.value = true
        setTimeout(() => {
            rotating.value = false
        }, 300) 
        generatePassword()
    }
}

const generatePassword = () => {
    let chars = ''
    if (useUppercase.value) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useLowercase.value) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (useNumbers.value) chars += '0123456789'
    if (useSymbols.value) chars += '!@#$%^&*()-_=+[]{}<>?'

    if (!chars) {
        password.value = 'Select at least one type'
        return
    }

    let result = ''
    for (let i = 0; i < length.value; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    password.value = result
}

const strengthLevel = computed(() => {
    const val = password.value
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[a-z]/.test(val)) score++
    if (/\d/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    if (val.includes('Select at least one type')) score = 0
    return score
})

const strengthLabel = computed(() => {
    if (strengthLevel.value <= 2) return 'Weak'
    if (strengthLevel.value === 3 || strengthLevel.value === 4) return 'Moderate'
    return 'Strong'
})

const strengthColor = computed(() => {
    if (strengthLevel.value <= 2) return 'red'
    if (strengthLevel.value === 3 || strengthLevel.value === 4) return 'orange'
    return 'green'
})

const copyPassword = async () => {

    const data = { 
        id: store.generateId(),
        text: password.value, 
        level: strengthLevel.value,
    }

    try {
        await navigator.clipboard.writeText(password.value)
        // Check if password.text already exists
        const alreadyExists = store.password.some(item => item.text === password.value)

        if (!alreadyExists && strengthLevel.value > 1) {
            store.addPassword(data)
        } else if (strengthLevel.value < 1){
            store.setToast({ type: 'error', message: `Please select type!` }) 
        } else {
            console.log('Password already exists in store')
        }
        
        if(strengthLevel.value > 1){
            store.setToast({ type: 'success', message: `Password copied to clipboard!` }) 
        }
    } catch (err) {
        console.error('Failed to copy: ', err)
        store.setToast({ type: 'error', message: `Failed to copy!` }) 
    }
}

const deletePassword = (list) => {
    store.deletePassword(list)
}

</script>

<template>
    <div class="generate-password">
        <div class="generate-password-container mb-2">
            <div class="row">
                <div class="col-12">
                    <h2 class="sub-title fw-600 lh-1-0 clr-dark mb-2">Generate Password</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12 d-flex justify-between align-items-center control mb-1">
                    <h3 class="sub-title fw-500">{{ password }}</h3>
                    <div class="d-flex gap-1">
                        <button class="icon pointer" title="Copy" @click="copyPassword">
                            <IconCopy />
                        </button>
                        <button class="icon pointer" title="Generate" @click="generate()">
                            <IconArrowsClockwise :class="{ rotate: rotating }"/>
                        </button>
                    </div>
                </div>
            </div>
    
            <div class="row">
                <div class="col-12 mb-2">
                    <div class="strength-meter mb-1">
                        <div class="bar" :style="{ width: (strengthLevel * 20) + '%', backgroundColor: strengthColor }"></div>
                    </div>
                    <p class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }} password</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <h4 class="para fw-600 mb-1">Customize your password:</h4>
                </div>
    
                <div class="form d-flex gap-2 gap-lg-3 mb-2">
                    <div class="form-field">
                        <label class="d-flex para fw-600 mb-1">Length: {{ length }}<br/></label>
                        <input type="range" min="4" max="16" v-model="length" @input="generatePassword" />
                    </div>
    
                    <div class="form-field">
                        <h4 class="para fw-600 mb-1">Type:</h4>
                        <label class="d-flex gap-1 mb-0-5"><input type="checkbox" v-model="useUppercase" @change="generatePassword" /> Uppercase</label>
                        <label class="d-flex gap-1 mb-0-5"><input type="checkbox" v-model="useLowercase" @change="generatePassword" /> Lowercase</label>
                        <label class="d-flex gap-1 mb-0-5"><input type="checkbox" v-model="useNumbers" @change="generatePassword" /> Numbers</label>
                        <label class="d-flex gap-1 mb-0"><input type="checkbox" v-model="useSymbols" @change="generatePassword" /> Symbols</label>
                    </div>
                </div>
            </div>
    
            <div class="row">
                <div class="col-12 d-flex gap-1 gap-lg-1">
                    <button class="btn btn-primary  mx-auto px-1 w-100 justify-center align-items-center gap-1" @click="copyPassword">
                        <IconCopy />
                        <span class="para fw-600">Copy Password</span>
                    </button>
                    <button class="btn btn-defualt mx-auto px-1 w-100 justify-center align-items-center gap-1" @click="generate">
                        <IconArrowsClockwise :class="{ rotate: rotating }"/>
                        <span class="para fw-600">Generate Password</span>
                    </button>
                </div>
            </div>
        </div>

        <transition name="fade">
            <div  v-if="store.password.length > 0">
                <div class="row">
                    <div class="col-12">
                        <p class="para fw-600 mb-2">Copied {{ store.password.length > 1 ? 'passwords': 'password'}} list:</p>
                    </div>
                </div>
    
                <div class="row mb-6">
                    <table class="col-12">
                        <thead>
                            <tr>
                                <th width="40" class="para fw-600 text-center"></th>
                                <th class="para fw-600 text-left">Password</th>
                                <th width="240" class="para fw-600 text-center">Level</th>
                                <th width="40" class="para fw-600"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(list, index) in [...store.password].reverse()" :key="index">
                                <td class="text-center">{{ index+1 }}</td>
                                <td>{{ list.text }}</td>
                                <td :class="['fw-600', list.level <= 2 ? 'weak' : list.level === 3 || list.level === 4 ? 'moderate' : 'strong']">{{ list.level <= 2 ? 'Weak' : list.level === 3 || list.level === 4 ? 'Moderate' : 'Strong' }}</td>
                                <td class="text-right pointer" @click="deletePassword(list)"><IconTrash class="icon"/></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </transition>
    </div>
</template>

<style lang="scss" scoped>
.generate-password{

    &-container{
        padding: 2.0rem;
        background-color: var(--soft-background);
        border-radius: var(--radius);
        min-height: 400px;
    }
    
    .control{
        padding: 14px;
        padding-bottom: 14px;
        border-radius: calc(var(--radius) / 1);
        background-color: var(--background);
        // border: solid 1px rgba(var(--darkRGB),0.125);

    }

    .form{
        &-field{
            label {
                display: flex;
                align-items: center;
                gap: 1.0rem;
        
                input[type='checkbox'] {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--lightDark);
                    border-radius: 4px;
                    background-color: var(--background);
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s ease;
                    margin: 0;
        
                    &:checked {
                    background-color: var(--primary, #007BFF);
                    border-color: var(--primary, #007BFF);
        
                    &::after {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 7px;
                        width: 6px;
                        height: 12px;
                        border: solid var(--background);
                        border-width: 0 2px 2px 0;
                        transform: rotate(45deg);
                    }
                    }
        
                    &:focus {
                        outline: none;
                        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                    }
                }
            }
        }
    }


    .icon{
        svg {
            fill: var(--dark);
            path{
            
            }
        }
    }

    .rotate {
        animation: rotate 0.3s linear;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(180deg);
        }
    }

    .strength-meter {
        height: 6px;
        background-color: #eee;
        border-radius: 3px;
        margin-top: 4px;
        width: 100%;
    }
    .bar {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    .strength-label {
        margin-top: 4px;
        font-weight: bold;
    }

    table{
        width: calc( 100% - 12px );
        // background-color: pink;
        background-color: var(--background);
        border-radius: var(--radius);
        border-collapse: collapse;
        // border: solid 10px var(--soft-background);
        box-shadow: 0px 0px 0px 6px var(--soft-background);
        margin-left: 6px;
        // margin-bottom: 200px;

        thead{ border-bottom: solid 1px rgba(var(--darkRGB), 0.125); }

        tbody{
            tr{
                &:hover{
                    background-color: var(--soft-background);
                }
            }
        }
        tr{
            border-bottom: solid 1px rgba(var(--darkRGB), 0.125);
            &:last-child{
                border-bottom: none;
            }
            th{
                // text-align: left;
                padding: 12px;
                border-right: solid 1px rgba(var(--darkRGB), 0.125);

                &:last-child{
                    border-right: none;
                }
            }
            td{
                padding: 12px;
                border-right: solid 1px rgba(var(--darkRGB), 0.125);

                &:last-child{ border-right: none; }

                &.weak{
                    text-align: center;
                    background-color: red;
                    color: #fff;
                }
                &.moderate{
                    text-align: center;
                    background-color: orange;
                    color: #fff;
                    
                }
                &.strong{
                    text-align: center;
                    background-color: green;
                    color: #fff;
                    
                }

                .icon{
                    width: 20px;
                    height: 20px;
                }
            }
        }
    }
}
</style>