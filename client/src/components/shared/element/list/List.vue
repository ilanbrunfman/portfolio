<script setup>
const props = defineProps({
  prop: { type: Object, required: true, }
})
</script>

<template>
    <ul :class="['', props.prop.class]">
        <li 
          v-for="(li, index) in props.prop.list" 
          :key="index" 
          :class="['', li.class]" 
          v-html="li.html"
        ></li>
    </ul>
</template>