<script setup>
import QRCode from 'qrcode' 
// https://www.youtube.com/watch?v=X6MFUagtKiQ&t=334s&ab_channel=dcode 
// https://www.npmjs.com/package/qrcode#todataurltext-options-cberror-url
import { ref, computed, onMounted} from 'vue'

import IconDownload from '@/components/icons/IconDownload.vue'

const qrCodeUrlName = ref('')
const qrCodeUrl = ref('')
const qrCodeImage = ref('')
const qrCodeDownload = ref('')

const isFocused = ref(false)
const error = ref({ active: false, msg: 'Invalid URL' })
const URL_Validation = ref(false)

const items = ref([
    { id: 'downloadPNGBtn', active: false, type: 'png', class: ``, html: `QRcode.png`, tooltip: 'Download QRcode.png' },
    { id: 'downloadSVGBtn', active: false, type: 'svg', class: ``, html: `QRcode.svg`, tooltip: 'Download QRcode.svg' }
])

const onFocus = () => {
    isFocused.value = true;
    errorValidation.value = { active: false, msg: '', }
    qrCodeUrl.value.length < 2 ? URL_Validation.value = true : URL_Validation.value = false
};

const onBlur = () => {
    qrCodeUrl.value.length > 0 ?  isFocused.value = true :  isFocused.value = false
};

const createQRCode = () => {
    console.log('createQRCode', qrCodeUrl.value)
    errorValidation()

    if(error.value.active){
        console.log('QR Code creation aborted due to error.');
        return;
    } else {
        console.log('Passed error valiadtion!')
        qrCodeUrlName.value = qrCodeUrl.value
            .replace("http://", "")
            .replace("https://", "")
            .replace("www.", "")


        // With promises 
        QRCode.toDataURL(qrCodeUrl.value)
            .then(dataUrl => {
                qrCodeDownload.value = dataUrl
                console.log('Data URL: ', dataUrl)
            })
            .catch(err => {
                console.error(err)
            })
        
        // SVG
        QRCode.toString(qrCodeUrl.value, { type:'svg' }, 
            function (err, svg) {
                console.log('qrcode as svg', svg)
                qrCodeImage.value = svg
            }
        )

        onBlur()
    }
}

const errorValidation = () => {
    const url = qrCodeUrl.value.trim();

    if (!url) {
        error.value = {
            active: true,
            msg: 'Please enter a link'
        };
    } else if (!url.includes('www.') && !url.includes('http')) {
        error.value = {
            active: true,
            msg: 'Invalid URL - potential link issue.'
        };
    } else {
        error.value = { active: false, msg: '' };
    }

    if (error.value.active) {
        setTimeout(() => {
            error.value = { active: false, msg: '' };
        }, 5000);
    }
}

const displayUrl = computed(() => {
    return qrCodeUrl.value.length > 40 
        ? qrCodeUrl.value.slice(0, 40) + '…' 
        : qrCodeUrl.value;
})

const selectedItem = ref(null)

const selectItem = (item) => {
    console.log('selectItem', item)

    items.value = items.value.map((i) => ({
        ...i,
        active: i.id === item.id,
    }))

    selectedItem.value = item
}



// const download = (item) => {

//     if( item.type === 'svg' ){
//         // download SVG QRcode
//         console.log('download', item.id)
//         setTimeout( () => {
//             const svg = document.getElementById("rhombus");
//             const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)));
//             const a = document.createElement('a');
//             const e = new MouseEvent('click');
//             a.download = 'QRcode.svg';
//             a.href = 'data:image/svg+xml;base64,' + base64doc;
//             a.dispatchEvent(e);
//         }, 10)
//     } else if ( item.type === 'png' ){
//         setTimeout( () => {
//             console.log('download', item.id)
//             const canvas = document.getElementById("canvas");
//             const dataURL = qrCodeDownload.value;
//             // const dataURL = canvas.toDataURL('image/png');
//             const a = document.createElement('a');
//             const my_evt = new MouseEvent('click');
//             a.download = 'QRcode.png';
//             a.href = dataURL;
//             a.dispatchEvent(my_evt);
//         }, 10)
//     }

//     // qrCodeDownload.value = ''
// }

const download = (item) => {
    if (item.type === 'svg') {
        setTimeout(() => {
            const svg = document.getElementById("rhombus")
            if (!svg) {
                console.warn("SVG element not found")
                return
            }

            const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)))
            const a = document.createElement("a")
            a.download = "QRcode.svg"
            a.href = "data:image/svg+xml;base64," + base64doc
            a.dispatchEvent(new MouseEvent("click"))
        }, 10)
    } else if (item.type === 'png') {
        setTimeout(() => {
            const dataURL = qrCodeDownload.value
            if (!dataURL) {
                console.warn("PNG dataURL not available")
                return
            }

            const a = document.createElement("a")
            a.download = "QRcode.png"
            a.href = dataURL
            a.dispatchEvent(new MouseEvent("click"))
        }, 10)
    }
}


const reset = () => {
    console.log('reset has been click')
    qrCodeUrl.value = ''
    isFocused.value = false
    qrCodeImage.value = ''
    items.value = items.value.map(i => ({ ...i, active: false }))
    selectedItem.value = null
}
</script>

<template>
    <div class="card">
        <div class="card-container">

            <div class="row">
                <div class="col-12">
                    <h3 class="sub-title fw-600 mb-2 text-center">Generate your own QR code</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <form class="form" @submit.prevent>
                        <div :class="['form-field mb-1 d-flex justify-content-between']">
                            <transition name="fade">
                                <span v-if="error.active" class="error-output">{{ error.msg }}</span>
                            </transition>
                            <div :class="['form-field-container', error.active ? 'active-error' : '']">
                                <input 
                                    type="url" 
                                    placeholder=""
                                    autocomplete="url" 
                                    v-model="qrCodeUrl"
                                    @focus="onFocus" @blur="onBlur"
                                    :class="['', isFocused ? 'focused' : '', error.active ? 'error' : '']"
                                />
                                <label :class="['para fw-500', isFocused ? 'focused' : '', error.active ? 'error' : '']">Enter your website link</label>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <h5 class="fs-12 fw-400 mb-2">www.example.com</h5>
                </div>
            </div>

            <transition name="fade" mode="out-in">
                <div class="row" v-if="!qrCodeImage">
                    <div class="col-12">
                        <button class="btn btn-primary btn-submit fs-16 fw-600 py-1 px-2 mx-auto" @click="createQRCode()">
                            Generate QR Code
                        </button>
                    </div>
                </div>
                <div v-else>
                    <div class="row">
                        <div class="col-12 items mb-2">
                            <button 
                                v-for="(item, index) in items" 
                                :key="index" 
                                :class="['item pointer', item.class, item.active ? 'item-selected' : 'item-disable']" 
                                :title="`Donwload ${item.html}`"
                                @click="selectItem(item)"
                            >
                                <div class="col d-flex gap-1 align-items-center">
                                    <div v-if="qrCodeImage" class="qrcode" id="rhombus" v-html="qrCodeImage"></div>
                                    <!-- <canvas id="canvas"></canvas> -->
                                     <div class="content">
                                        <label class="" v-html="item.html"></label>
                                        <p class="fs-14 fw-400 lh-1-4 " style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-all;">{{ displayUrl }}</p>
                                     </div>
                                </div>
                                <!-- <button class="btn-download-icon" >
                                </button> -->
                                <IconDownload class="icon" @click="download.stop(item)"/>
                            </button>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 d-flex gap-1">
                            <button :class="['btn  fs-16 fw-600 py-1 px-2 w-100 justify-center align-items-center', selectedItem ? 'btn-primary' : 'btn-defualt']" :disabled="!selectedItem" @click="download(selectedItem)">Download</button>
                            <button class="btn btn-defualt fs-16 fw-600 py-1 px-2 w-100 justify-center align-items-center" @click="reset()">Reset</button>
                        </div>
                    </div>
                </div>
            </transition>




            <!-- <div class="row">
                        <div class="col-12 col-lg-9 mx-auto">
                            <div class="showcase-qrcode mb-2" id="rhombus" v-html="qrCodeImage"></div>
                            <h3 class="para fw-600 lh-1-4 text-center mb-2" style="word-wrap: break-word; overflow-wrap: break-word; word-break: break-all;">{{ displayUrl }}</h3>
                        </div>
                    </div> -->

                    

            

        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/shared/variables" as var;
.card{
    border-radius: var(--radius);
    background-color: var(--soft-background);
    padding: 4.0rem 2.0rem;

    &-container{
        // display: flex;
        // align-items: center;
        // justify-content: center;
        max-width: 400px;
        margin-inline: auto;

        
        
        // border: solid 2px var(--soft-background);
        aspect-ratio: 16 / 9 ;
    }

    .form{
        --clr-error: #EF5350;

        &-field{
            position: relative;
            z-index: 1;
            border-radius: 5px;
            margin-inline: auto;
            
            &-container{
                width: 100%;
                position: relative;
                z-index: 1;
                border-radius: 10px;
                overflow: hidden;
                background-color: var(--background);
                border: solid 1px rgba(var(--darkRGB), 0.125);
                transition: all 0.25s ease;

                &.active-error{
                    border: solid 1px var(--clr-error);
                }
            }


            input{
                z-index: 2;
                padding: 20px 20px;
                outline: none;
                border: none;
                background-color: transparent;
                width: 100%;
                font-size: 14px;
                transition: all 0.5s ease;
                display: block;
                color: inherit;

                &.focused{
                    padding-top: 30px;
                    padding-bottom: 10px;
                }

            }
            input:is(:-webkit-autofill, :autofill) {
                // border: 1px solid var(--copy);
                // -webkit-text-fill-color: var(--white);
                -webkit-box-shadow: 0 0 0px 1000px rgba(#000,0) inset;
                transition: background-color 5000s ease-in-out 0s;
            }

            label{
                position: absolute;
                z-index: -1;
                top: 20px;
                left: 20px;
                font-size: 14px;
                transition: all 0.5s ease;

                @media (min-width: var.$md) {
                    font-size: 16px;
                }

                &.focused{
                    top: 10px;
                    font-size: 12px;
                }

                // &.error{
                //     color: #d24345;
                // }
            }

            .error-output{
                position: absolute;
                top: -16px;
                height: 24px;
                font-size: 12px;
                font-weight: 500;
                color: var(--clr-error);
            }

            button{
                position: absolute;
                right: 0;
                top: 0;

                align-items: center;

                padding-inline: 24px;

                height: 56px;

                white-space: nowrap;
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;

                transition: all 0.25s ease;


            }

        }
    }

    .showcase-qrcode{
        margin-inline: auto;
        width: clamp(120px, 10vw, 320px);

        svg{
            width: clamp(200px, 10vw, 440px);
        }
    }

    .items{
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        justify-content: center;
        gap: 20px;
        max-width: 440px;
        margin-inline: auto;

        .item{
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 4px;
            padding-right: 14px;
            border-radius: 10px;
            background-color: var(--background);
            color: var(--dark);
            // border: solid 1px rgba(#000, 0.125);
            box-shadow: 0px 0px 0px 1px rgba(var(--darkRGB), 0.125);
            // background-color: #fafbfc;
            
            &-selected{
                box-shadow: 0px 0px 0px 2px rgba(#4880FF, 1.0);
                background-color: #4880FF;
                color: #fff;
            }

            .content{
                display: flex;
                flex-direction: column;
                align-items: start;
            }

            label{
                font-size: clamp(14px, 2vw, 16px);
                font-weight: 600;
                line-height: 1.4;
                text-align: left;
            }

            .qrcode{
                width: 48px !important;
                height: 48px !important;

                svg{
                    path{
                        fill: transparent !important;
                    }
                }
            }

            &:hover{
                box-shadow: 0px 0px 0px 2px rgba(#4880FF, 1.0);
                // box-shadow: 
                //     0px 0px 0px 1px rgba(var(--darkRGB), 0.25),
                //     // 0px 0px 24px -4px rgba(#000, 0.125);
            }

            .icon{
                width: 24px;
                height: 24px;
            }
            
        }
    }
}
</style>