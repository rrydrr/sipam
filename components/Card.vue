<script setup>
import { computed } from "vue";

const props = defineProps({
  // Props for the container styling
  bgColor: {
    type: String,
    default: "bg-white",
  },
  padding: {
    type: String,
    default: "p-8",
  },
  rounded: {
    type: String,
    default: "rounded-lg",
  },
  shadow: {
    type: String,
    default: "shadow-md",
  },
  maxWidth: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "w-full",
  },
  margin: {
    type: String,
    default: "",
  },
  textAlign: {
    type: String,
    default: "text-center",
  },
  // Add a prop for the 'hidden sm:block' behavior if you want to control it
  displayClasses: {
    type: String,
    default: "", // Default to the original behavior
  },
});

// Compute the dynamic class string for the parent div
const containerClasses = computed(() => {
  return [
    props.displayClasses, // Apply the display classes first
    props.bgColor,
    props.padding,
    props.rounded,
    props.shadow,
    props.maxWidth,
    props.width,
    props.margin,
    props.textAlign,
  ].join(" ");
});
</script>

<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>
