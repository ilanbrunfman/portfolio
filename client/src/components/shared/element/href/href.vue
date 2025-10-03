<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <a  :href="props.prop.url" 
        :target="props.prop.target ? '_blank' : null " 
        :class="['', props.prop.class]" 
        v-html="props.prop.html" ></a>
</template>