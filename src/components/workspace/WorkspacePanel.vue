<template>
  <section class="border border-gray-200 bg-white text-left shadow-sm">
    <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <h2 class="font-semibold text-gray-900">{{ title }}</h2>
      <button class="rounded border border-gray-300 px-3 py-1 text-sm" data-testid="toggle-panel" @click="$emit('toggle')">
        {{ minimized ? "復元" : "最小化" }}
      </button>
    </header>
    <div v-if="!minimized" class="p-4">
      <slot />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "WorkspacePanel",
  props: {
    minimized: {
      default: false,
      type: Boolean,
    },
    title: {
      required: true,
      type: String,
    },
  },
  emits: ["toggle"],
});
</script>

