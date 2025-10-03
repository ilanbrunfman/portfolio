<script setup>
import h1 from './h1/H1.vue'
import h2 from './h2/H2.vue'
import p from './p/P.vue'
import href from './href/href.vue'
import button from './button/Button.vue'
import image from './image/Image.vue'
import list from './list/List.vue'

const props = defineProps({
  prop: { type: Object, required: true }
})

const registry = {
  h1: h1,
  h2: h2,
  p: p,
  href: href,
  button: button,
  img: image,
  ul: list,
}

const key = props.prop.component || props.prop.tag

</script>

<template>
  <component 
    :is="registry[key] || key" 
    :prop="props.prop" 
  />
</template>