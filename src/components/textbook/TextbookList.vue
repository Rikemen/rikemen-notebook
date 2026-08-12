<template>
  <section aria-label="アップロード済みの資料" class="textbook-list">
    <p v-if="textbooks.length === 0" class="textbook-list__empty">PDFを追加してください。画像・ブックマークにも対応しています。</p>
    <template v-for="textbook in textbooks" :key="textbook.id">
      <a v-if="textbook.kind === 'bookmark'" class="textbook-list__item" :href="textbook.url" rel="noopener noreferrer" target="_blank">
        <span class="textbook-list__icon textbook-list__icon--bookmark">URL</span>
        <span>
          <strong>{{ textbook.title }}</strong>
          <small>{{ textbook.url }}</small>
          <small v-if="materialStatusLabel(textbook.status)" class="textbook-list__status">{{ materialStatusLabel(textbook.status) }}</small>
        </span>
      </a>
      <div v-else class="textbook-list__row">
        <button
          class="textbook-list__item"
          :class="{ 'textbook-list__item--selected': textbook.id === selectedId }"
          type="button"
          @click="$emit('select', textbook.id)"
        >
          <span class="textbook-list__icon" :class="{ 'textbook-list__icon--image': textbook.kind === 'image' }">{{ materialKindLabel(textbook.kind) }}</span>
          <span class="textbook-list__details">
            <strong>{{ textbook.title }}</strong>
            <small>{{ textbook.sizeLabel }}・{{ textbook.uploadedAt }}</small>
            <small v-if="materialStatusLabel(textbook.status, textbook.uploadProgress)" class="textbook-list__status">
              {{ materialStatusLabel(textbook.status, textbook.uploadProgress) }}
            </small>
          </span>
        </button>
        <form v-if="editingId === textbook.id" class="textbook-list__rename" @submit.prevent="submitRename(textbook)">
          <input
            ref="renameInput"
            v-model="draftName"
            aria-label="資料名"
            maxlength="120"
            @keydown.enter.prevent="submitRename(textbook)"
            @keydown.escape.prevent="cancelRename"
          />
          <AppIconButton icon="check" label="資料名を保存" type="submit" />
          <AppIconButton icon="close" label="資料名の変更を取消" @click="cancelRename" />
          <small v-if="renameError" class="textbook-list__rename-error" role="alert">{{ renameError }}</small>
        </form>
        <div v-else class="textbook-list__actions">
          <AppIconButton
            :disabled="!canRename(textbook)"
            icon="edit"
            :label="`${textbook.title}の資料名を変更`"
            @click="startRename(textbook)"
          />
          <AppIconButton
            v-if="textbook.status === 'saving'"
            icon="close"
            :label="`${textbook.title}のアップロードを取消`"
            @click="$emit('cancel-upload', textbook.id)"
          />
          <AppIconButton
            v-if="textbook.status === 'error' || textbook.status === 'cancelled'"
            icon="refresh"
            :label="`${textbook.title}のアップロードを再試行`"
            @click="$emit('retry-upload', textbook.id)"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, type PropType } from "vue";
import { materialKindLabel, materialStatusLabel, type MaterialListItem } from "@/features/textbook/materials";
import { validateMaterialDisplayName } from "@/features/textbook/materialDisplayName";
import AppIconButton from "@/components/ui/AppIconButton.vue";

export default defineComponent({
  name: "TextbookList",
  components: { AppIconButton },
  props: {
    selectedId: {
      required: true,
      type: String,
    },
    textbooks: {
      required: true,
      type: Array as PropType<MaterialListItem[]>,
    },
  },
  emits: ["cancel-upload", "rename", "retry-upload", "select"],
  setup(_props, { emit }) {
    const draftName = ref("");
    const editingId = ref("");
    const renameError = ref("");
    const renameInput = ref<HTMLInputElement | null>(null);
    const canRename = (material: MaterialListItem) => material.status === "saved" || material.status === "temporary" || material.status === undefined;
    const startRename = (material: MaterialListItem) => {
      if (!canRename(material)) return;
      editingId.value = material.id;
      draftName.value = material.title;
      renameError.value = "";
      nextTick(() => renameInput.value?.focus()).catch(() => undefined);
    };
    const cancelRename = () => {
      editingId.value = "";
      draftName.value = "";
      renameError.value = "";
    };
    const submitRename = (material: MaterialListItem) => {
      const validation = validateMaterialDisplayName(draftName.value);
      if (!validation.ok) {
        renameError.value = validation.message;
        return;
      }
      if (validation.displayName !== material.title) {
        emit("rename", [material.id, validation.displayName]);
      }
      cancelRename();
    };
    return {
      cancelRename,
      canRename,
      draftName,
      editingId,
      materialStatusLabel,
      materialKindLabel,
      renameError,
      renameInput,
      startRename,
      submitRename,
    };
  },
});
</script>

<style scoped>
.textbook-list {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.textbook-list__empty {
  margin: 0;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  padding: var(--space-4) var(--space-3);
  text-align: center;
}

.textbook-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text);
  text-align: left;
  text-decoration: none;
}

.textbook-list__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
}

.textbook-list__details {
  min-width: 0;
}

.textbook-list__actions {
  display: flex;
  gap: var(--space-1);
}

.textbook-list__actions :deep(.app-icon-button),
.textbook-list__rename :deep(.app-icon-button) {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

.textbook-list__rename {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-1);
  min-width: 0;
  padding: var(--space-1) var(--space-2) var(--space-2);
}

.textbook-list__rename input {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-surface-inset);
  box-shadow: var(--shadow-inset);
  color: var(--color-text);
  font: inherit;
  padding: var(--space-1) var(--space-2);
}

.textbook-list__rename input:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.textbook-list__rename-error {
  grid-column: 1 / -1;
  color: var(--color-red);
}

.textbook-list__icon--bookmark,
.textbook-list__icon--image {
  background: var(--color-blue);
}

.textbook-list__item--selected {
  border-color: var(--color-border);
  border-left-color: var(--color-blue);
  box-shadow: var(--shadow-inset);
}

.textbook-list__icon {
  border-radius: var(--radius-xs);
  background: var(--color-red);
  color: white;
  font-size: 0.66rem;
  font-weight: 800;
  padding: 0.25rem 0.3rem;
}

.textbook-list strong,
.textbook-list small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textbook-list__status {
  color: var(--color-blue);
  font-weight: 700;
}

.textbook-list small {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
</style>
