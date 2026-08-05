<template>
  <div aria-label="資料の表示モード" class="material-mode-switcher" role="toolbar">
    <AppIconButton
      v-for="mode in modes"
      :key="mode.value"
      :aria-pressed="modelValue === mode.value"
      :disabled="disabledModes.includes(mode.value)"
      :icon="mode.icon"
      :label="mode.label"
      :tooltip="mode.label"
      @click="$emit('update:modelValue', mode.value)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import type { MaterialPanelMode } from "@/features/textbook/textbookPanelStore";

const modes: Array<{
  icon: string;
  label: string;
  value: MaterialPanelMode;
}> = [
  {
    icon: "folder_open",
    label: "資料一覧",
    value: "materials",
  },
  {
    icon: "format_list_bulleted",
    label: "目次",
    value: "contents",
  },
  {
    icon: "preview",
    label: "プレビュー",
    value: "preview",
  },
];

export default defineComponent({
  name: "MaterialModeSwitcher",
  components: {
    AppIconButton,
  },
  props: {
    disabledModes: {
      default: () => [],
      type: Array as PropType<MaterialPanelMode[]>,
    },
    modelValue: {
      required: true,
      type: String as PropType<MaterialPanelMode>,
    },
  },
  emits: ["update:modelValue"],
  setup() {
    return {
      modes,
    };
  },
});
</script>

<style scoped>
.material-mode-switcher {
  display: grid;
  grid-template-columns: repeat(3, minmax(44px, 1fr));
  gap: var(--space-2);
  min-width: 0;
}

.material-mode-switcher :deep(.app-icon-button) {
  width: 100%;
  height: 44px;
}

.material-mode-switcher :deep(.app-icon-button[aria-pressed="true"]) {
  box-shadow: var(--shadow-inset);
  color: var(--color-blue);
}
</style>
