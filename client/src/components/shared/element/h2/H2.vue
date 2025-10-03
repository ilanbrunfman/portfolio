<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <h2 :class="['', props.prop.class]" v-html="props.prop.html"></h2>
</template>