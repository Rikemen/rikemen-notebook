<template>
  <main class="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
    <section class="ui-raised w-full rounded-[var(--radius-lg)] p-8 text-left">
      <p class="text-sm text-[var(--color-text-secondary)]">{{ eyebrow }}</p>
      <h1 class="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">{{ title }}</h1>
      <p class="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{{ description }}</p>
      <div class="mt-6">
        <slot />
      </div>
    </section>
  </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AuthPageShell",
  props: {
    description: {
      required: true,
      type: String,
    },
    eyebrow: {
      required: true,
      type: String,
    },
    title: {
      required: true,
      type: String,
    },
  },
});
</script>

