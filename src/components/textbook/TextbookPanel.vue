<template>
  <div class="textbook-panel">
    <MaterialModeSwitcher :model-value="mode" @update:model-value="setMode" />

    <section v-if="mode === 'materials'" class="textbook-panel__body textbook-panel__body--materials">
      <p class="textbook-panel__description">{{ description }}</p>
      <div class="textbook-panel__actions">
        <label class="textbook-panel__upload">
          PDFをアップロード
          <input class="sr-only" data-testid="textbook-file" type="file" accept="application/pdf" @change="handleFileChange" />
        </label>
        <button class="textbook-panel__select" type="button">ファイルを選択</button>
      </div>
      <p class="textbook-panel__limit">上限: {{ limitLabel }}</p>
      <p v-if="errorMessage" class="textbook-panel__error">{{ errorMessage }}</p>
      <div class="textbook-panel__material-list">
        <TextbookList :selected-id="selectedTextbookId" :textbooks="materials" @select="selectTextbook" />
      </div>
    </section>

    <section v-else-if="mode === 'contents'" class="textbook-panel__body textbook-panel__body--contents">
      <p class="textbook-panel__selected-material">{{ selectedTextbookTitle }}</p>
      <MaterialTableOfContents
        :items="selectedTableOfContents"
        :page-count="selectedMaterial?.pageCount"
        :selected-page="selectedPage"
        @add="addTocItem"
        @navigate="openTocItem"
      />
    </section>

    <section v-else class="textbook-panel__body textbook-panel__body--preview">
      <TextbookPreview :page="selectedPage" :textbook-title="selectedTextbookTitle" />
      <PageThumbnailStrip :pages="pages" :selected-page="selectedPage" @select-page="selectPage" />
    </section>
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { computed, defineComponent, ref, type PropType } from "vue";
import type { AuthUser } from "@/features/auth/types";
import { canPersistHistory, getUploadLimitBytes } from "@/features/auth/accessPolicy";
import { createMaterialFromFile, sampleMaterials } from "@/features/textbook/materials";
import type { MaterialTocItem } from "@/features/textbook/materialTableOfContents";
import { type MaterialPanelMode, useTextbookPanelStore } from "@/features/textbook/textbookPanelStore";
import MaterialModeSwitcher from "@/components/textbook/MaterialModeSwitcher.vue";
import MaterialTableOfContents from "@/components/textbook/MaterialTableOfContents.vue";
import PageThumbnailStrip from "@/components/textbook/PageThumbnailStrip.vue";
import TextbookList from "@/components/textbook/TextbookList.vue";
import TextbookPreview from "@/components/textbook/TextbookPreview.vue";

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${Math.floor(bytes / (1024 * 1024 * 1024))}GB`;
  }

  return `${Math.floor(bytes / (1024 * 1024))}MB`;
};

const createId = () => globalThis.crypto?.randomUUID?.() ?? `material-${Date.now()}`;

export default defineComponent({
  name: "TextbookPanel",
  components: {
    MaterialModeSwitcher,
    MaterialTableOfContents,
    PageThumbnailStrip,
    TextbookList,
    TextbookPreview,
  },
  props: {
    currentUser: {
      default: null,
      type: Object as PropType<AuthUser | null>,
    },
    noteId: {
      required: true,
      type: String,
    },
  },
  emits: ["select-file"],
  setup(props, { emit }) {
    const store = useTextbookPanelStore();
    const panelState = computed(() => store.stateForNote(props.noteId, sampleMaterials));
    const errorMessage = ref("");
    const materials = computed(() => panelState.value.materials);
    const mode = computed(() => panelState.value.mode);
    const selectedPage = computed(() => panelState.value.selectedPage);
    const selectedTextbookId = computed(() => panelState.value.selectedTextbookId);
    const selectedMaterial = computed(() =>
      materials.value.find((material) => material.id === selectedTextbookId.value),
    );
    const uploadLimitBytes = computed(() => getUploadLimitBytes(props.currentUser));
    const limitLabel = computed(() => formatBytes(uploadLimitBytes.value));
    const pages = computed(() =>
      Array.from({ length: selectedMaterial.value?.pageCount ?? 1 }, (_value, index) => index + 1),
    );
    const selectedTextbookTitle = computed(() => selectedMaterial.value?.title ?? "資料が選択されていません");
    const selectedTableOfContents = computed(
      () => panelState.value.tocByMaterialId[selectedTextbookId.value] ?? [],
    );
    const description = computed(() => {
      if (canPersistHistory(props.currentUser)) {
        return "アップロードした教材は自分の教材履歴に保存されます。";
      }

      return "未ログインでは10MBまで一時利用できます。保存と履歴にはログインが必要です。";
    });

    const handleFileChange = (event: Event) => {
      const { files } = event.target as HTMLInputElement;
      const [file] = files ?? [];
      if (!file) {
        return;
      }

      if (file.size > uploadLimitBytes.value) {
        errorMessage.value = `${limitLabel.value}以下のPDFを選択してください。`;
        return;
      }

      errorMessage.value = "";
      store.addMaterial(props.noteId, createMaterialFromFile(file, createId()), sampleMaterials);
      emit("select-file", file);
    };
    const selectTextbook = (textbookId: string) => {
      store.selectTextbook(props.noteId, textbookId, sampleMaterials);
    };
    const selectPage = (page: number) => {
      store.selectPage(props.noteId, page, sampleMaterials);
    };
    const setMode = (nextMode: MaterialPanelMode) => {
      store.setMode(props.noteId, nextMode, sampleMaterials);
    };
    const addTocItem = (item: MaterialTocItem) => {
      store.addTocItem(props.noteId, {
        initialMaterials: sampleMaterials,
        item,
        materialId: selectedTextbookId.value,
      });
    };
    const openTocItem = (item: MaterialTocItem) => {
      store.openTocItem(props.noteId, {
        initialMaterials: sampleMaterials,
        item,
        materialId: selectedTextbookId.value,
      });
    };

    return {
      addTocItem,
      description,
      errorMessage,
      handleFileChange,
      limitLabel,
      materials,
      mode,
      openTocItem,
      pages,
      selectPage,
      selectTextbook,
      selectedMaterial,
      selectedPage,
      selectedTableOfContents,
      selectedTextbookId,
      selectedTextbookTitle,
      setMode,
    };
  },
});
</script>

<style scoped>
.textbook-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-3);
  height: 100%;
  min-height: 0;
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
}

.textbook-panel__body {
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.textbook-panel__body--materials {
  display: grid;
  grid-template-rows: auto auto auto auto minmax(0, 1fr);
  align-content: start;
  gap: var(--space-3);
  overflow: hidden;
}

.textbook-panel__body--contents {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-2);
  overflow: hidden;
}

.textbook-panel__body--preview {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: var(--space-3);
  overflow: hidden;
}

.textbook-panel__description,
.textbook-panel__limit,
.textbook-panel__selected-material {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.textbook-panel__selected-material {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.textbook-panel__material-list {
  min-height: 0;
  overflow: auto;
}

.textbook-panel__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.textbook-panel__upload,
.textbook-panel__select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 2.35rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-raised-sm);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  text-align: center;
}

.textbook-panel__upload {
  background: var(--color-blue);
  color: white;
}

.textbook-panel__select {
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: var(--color-surface);
  color: var(--color-blue);
}

.textbook-panel__error {
  margin: 0;
  border-radius: var(--radius-md);
  background: var(--color-red-soft);
  color: var(--color-red);
  font-size: 0.82rem;
  padding: var(--space-2);
}
</style>
