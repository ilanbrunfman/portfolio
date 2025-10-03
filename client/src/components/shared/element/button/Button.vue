<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <button @click="props.prop.cta && props.prop.cta(props.prop)"
        :class="['', props.prop.class]" 
        v-html="props.prop.html" ></button>
</template>