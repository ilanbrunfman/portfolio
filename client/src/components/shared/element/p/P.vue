<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <p :class="['', props.prop.class]" v-html="props.prop.html"></p>
</template>