<script setup>
const props = defineProps({
  prop: { type: Object, required: true }
})

const getImagePath = (filename) => {
  return new URL(`../../../../assets/images/${filename}`, import.meta.url).href
}
</script>

<template>
    <img 
        :class="['', props.prop.class]"
        :src="getImagePath(props.prop.src)"
        :alt="props.prop.alt"
    />
</template>