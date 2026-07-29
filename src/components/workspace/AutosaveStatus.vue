<template>
  <p class="text-sm text-gray-600">{{ label }}</p>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import { autosaveStatusLabel, type AutosaveStatus } from "@/features/notes/autosaveStatus";

export default defineComponent({
  name: "AutosaveStatus",
  props: {
    status: {
      required: true,
      type: Object as PropType<AutosaveStatus>,
    },
  },
  setup(props) {
    const label = computed(() => autosaveStatusLabel(props.status));

    return {
      label,
    };
  },
});
</script>

