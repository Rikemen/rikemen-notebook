<template>
  <span class="math-renderer" :aria-label="ariaLabel" data-engine="katex-pending" role="math">
    {{ renderedExpression }}
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

const normalizeExpression = (expression: string) =>
  expression
    .replaceAll("\\int", "∫")
    .replaceAll("\\frac", "frac")
    .replaceAll("\\begin{matrix}", "[")
    .replaceAll("\\end{matrix}", "]")
    .replaceAll("^2", "²")
    .replaceAll("_0", "₀")
    .replaceAll("_1", "₁");

export default defineComponent({
  name: "MathRenderer",
  props: {
    expression: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const renderedExpression = computed(() => normalizeExpression(props.expression));
    const ariaLabel = computed(() => `数式 ${props.expression}`);

    return {
      ariaLabel,
      renderedExpression,
    };
  },
});
</script>

<style scoped>
.math-renderer {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: white;
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-text-primary);
  font-family: "Times New Roman", "Noto Serif JP", serif;
  font-size: 1.08em;
}
</style>

