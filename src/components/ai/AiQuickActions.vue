<template>
  <div class="ai-quick-actions" aria-label="AIクイックアクション">
    <button v-for="action in actions" :key="action" type="button" @click="$emit('select', action)">
      {{ action }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

const actions = ["この式を説明", "例を解く", "別解を出して", "関連概念を教えて"];

export default defineComponent({
  name: "AiQuickActions",
  emits: ["select"],
  setup() {
    return {
      actions,
    };
  },
});
</script>

<style scoped>
.ai-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.ai-quick-actions button {
  min-height: 1.9rem;
  border-radius: var(--radius-pill);
  background: white;
  box-shadow: var(--shadow-raised-sm);
  color: var(--color-blue);
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0 var(--space-3);
}
</style>

