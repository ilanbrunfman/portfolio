<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <h1 :class="['', props.prop.class]" v-html="props.prop.html"></h1>
</template>