<template>
  <figure class="whiteboard-math-object">
    <MathRenderer :expression="expression" />
    <figcaption>{{ label }}</figcaption>
  </figure>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MathRenderer from "@/components/math/MathRenderer.vue";

export default defineComponent({
  name: "WhiteboardMathObject",
  components: {
    MathRenderer,
  },
  props: {
    expression: {
      required: true,
      type: String,
    },
    label: {
      required: true,
      type: String,
    },
  },
});
</script>

<style scoped>
.whiteboard-math-object {
  display: inline-grid;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-raised-sm);
}

.whiteboard-math-object figcaption {
  color: var(--color-text-muted);
  font-size: 0.72rem;
}
</style>
