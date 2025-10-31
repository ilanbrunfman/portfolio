<script setup>
import IconUser from '@/components/icons/IconUser.vue'
import IconHouse from '@/components/icons/IconHouse.vue'
import IconX from '@/components/icons/IconX.vue'
import IconDownload from '@/components/icons/IconDownload.vue'
import IconCopy from '@/components/icons/IconCopy.vue'
import IconScan from '@/components/icons/IconScan.vue'
import IconScanSmiley from '@/components/icons/IconScanSmiley.vue'
import IconPuzzlePiece from '@/components/icons/IconPuzzlePiece.vue'
import IconStack from '@/components/icons/IconStack.vue'
import IconPassword from '@/components/icons/IconPassword.vue'

const props = defineProps({
    prop: { type: Object, required: true }
})

const registry = {
    IconUser,
    IconHouse,
    IconX,
    IconDownload,
    IconCopy,
    IconScan,
    IconScanSmiley,
    IconPuzzlePiece,
    IconStack,
    IconPassword,
}

</script>

<template>
    <component :is="registry[props.prop.html]" />
</template>