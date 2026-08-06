<template>
  <div class="textbook-panel" :class="{ 'textbook-panel--maximized': isMaximized }">
    <MaterialModeSwitcher :disabled-modes="disabledModes" :model-value="mode" @update:model-value="setMode" />

    <section v-if="mode === 'materials'" class="textbook-panel__body textbook-panel__body--materials">
      <p class="textbook-panel__description">{{ description }}</p>
      <MaterialAddControls @add-bookmark="addBookmark" @select-file="handleFileChange" />
      <p class="textbook-panel__limit">上限: {{ limitLabel }}</p>
      <p v-if="errorMessage" class="textbook-panel__error">{{ errorMessage }}</p>
      <p v-if="loadError" class="textbook-panel__error">{{ loadError }}</p>
      <p v-if="isLoading" class="textbook-panel__limit" aria-live="polite">保存済み教材を読み込んでいます。</p>
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

    <section
      v-else
      class="textbook-panel__body textbook-panel__body--preview"
      :class="{
        'textbook-panel__body--preview-maximized': isMaximized,
        'textbook-panel__body--thumbnails-collapsed': thumbnailsCollapsed,
      }"
    >
      <ImageMaterialPreview v-if="selectedMaterial?.kind === 'image'" :source-url="selectedMaterial.sourceUrl" :title="selectedTextbookTitle" />
      <TextbookPreview
        v-else
        :page="selectedPage"
        :pdf-document="selectedPdfDocument"
        :source-url="selectedMaterial?.sourceUrl"
        :textbook-title="selectedTextbookTitle"
        :zoom-enabled="isMaximized"
      />
      <PageThumbnailStrip
        v-if="selectedMaterial?.kind !== 'image'"
        :collapsed="thumbnailsCollapsed"
        :orientation="thumbnailOrientation"
        :pages="pages"
        :pdf-document="selectedPdfDocument"
        :selected-page="selectedPage"
        @select-page="selectPage"
        @update:collapsed="setThumbnailsCollapsed"
      />
    </section>
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines, max-lines-per-function, max-statements, no-ternary, prefer-destructuring */
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import type { AuthUser } from "@/features/auth/types";
import { canPersistHistory, getUploadLimitBytes } from "@/features/auth/accessPolicy";
import {
  createMaterialFromBookmark,
  createMaterialFromFile,
  createMaterialFromSavedTextbook,
  materialUploadStatus,
  validateBookmark,
  validateMaterialFile,
} from "@/features/textbook/materials";
import type { MaterialTocItem } from "@/features/textbook/materialTableOfContents";
import { type MaterialPanelMode, useTextbookPanelStore } from "@/features/textbook/textbookPanelStore";
import type { TextbookRepository } from "@/features/textbook/textbookRepository";
import { pdfJsDocumentLoader, type PdfDocumentLoader } from "@/features/textbook/pdfDocument";
import { usePdfDocument } from "@/features/textbook/usePdfDocument";
import { createDefaultTextbookRepository } from "@/features/textbook/textbookRepositoryProvider";
import MaterialModeSwitcher from "@/components/textbook/MaterialModeSwitcher.vue";
import MaterialAddControls from "@/components/textbook/MaterialAddControls.vue";
import MaterialTableOfContents from "@/components/textbook/MaterialTableOfContents.vue";
import ImageMaterialPreview from "@/components/textbook/ImageMaterialPreview.vue";
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
const defaultRepository = createDefaultTextbookRepository();
export default defineComponent({
  name: "TextbookPanel",
  components: {
    ImageMaterialPreview,
    MaterialAddControls,
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
    isMaximized: {
      default: false,
      type: Boolean,
    },
    noteId: {
      required: true,
      type: String,
    },
    pdfLoader: {
      default: () => pdfJsDocumentLoader,
      type: Object as PropType<PdfDocumentLoader>,
    },
    repository: {
      default: undefined,
      type: Object as PropType<TextbookRepository | undefined>,
    },
  },
  emits: ["select-file"],
  setup(props, { emit }) {
    const store = useTextbookPanelStore();
    const panelState = computed(() => store.stateForNote(props.noteId));
    const errorMessage = ref("");
    const isLoading = ref(false);
    const loadError = ref("");
    const materials = computed(() => panelState.value.materials);
    const mode = computed(() => panelState.value.mode);
    const selectedPage = computed(() => panelState.value.selectedPage);
    const selectedTextbookId = computed(() => panelState.value.selectedTextbookId);
    const thumbnailsCollapsed = computed(() => panelState.value.thumbnailsCollapsed);
    const thumbnailOrientation = computed(() => {
      if (props.isMaximized) {
        return "vertical";
      }
      return "horizontal";
    });
    const selectedMaterial = computed(() => materials.value.find((material) => material.id === selectedTextbookId.value));
    const uploadLimitBytes = computed(() => getUploadLimitBytes(props.currentUser));
    const limitLabel = computed(() => formatBytes(uploadLimitBytes.value));
    const pages = computed(() => Array.from({ length: selectedMaterial.value?.pageCount ?? 1 }, (_value, index) => index + 1));
    const selectedTextbookTitle = computed(() => selectedMaterial.value?.title ?? "資料が選択されていません");
    const selectedTableOfContents = computed(() => panelState.value.tocByMaterialId[selectedTextbookId.value] ?? []);
    const description = computed(() => {
      if (canPersistHistory(props.currentUser)) {
        return "アップロードした教材は自分の教材履歴に保存されます。";
      }

      return "未ログインでは10MBまで一時利用できます。保存と履歴にはログインが必要です。";
    });
    const disabledModes = computed<MaterialPanelMode[]>(() => {
      if (materials.value.length === 0) {
        return ["contents", "preview"];
      }
      if (selectedMaterial.value?.kind === "bookmark") {
        return ["contents", "preview"];
      }
      if (selectedMaterial.value?.kind === "image") {
        return ["contents"];
      }
      return [];
    });
    const repository = computed(() => props.repository ?? defaultRepository);
    const { loadPdfDocument, pdfDocument, pdfDocumentSource } = usePdfDocument(() => props.pdfLoader);
    const selectedPdfDocument = computed(() => {
      if (selectedMaterial.value?.sourceUrl !== pdfDocumentSource.value) {
        return null;
      }
      return pdfDocument.value;
    });
    let loadRequestId = 0;

    watch(
      () => [props.currentUser?.uid ?? "", props.noteId] as const,
      async ([uid, noteId]) => {
        loadRequestId += 1;
        const requestId = loadRequestId;
        loadError.value = "";
        if (!uid) {
          return;
        }

        isLoading.value = true;
        try {
          const savedTextbooks = await repository.value.list(uid, noteId);
          if (requestId === loadRequestId) {
            store.hydrateMaterials(noteId, savedTextbooks.map(createMaterialFromSavedTextbook));
          }
        } catch {
          if (requestId === loadRequestId) {
            loadError.value = "保存済み教材の読み込みに失敗しました。";
          }
        } finally {
          if (requestId === loadRequestId) {
            isLoading.value = false;
          }
        }
      },
      { immediate: true },
    );

    watch(
      () => [selectedMaterial.value?.id ?? "", selectedMaterial.value?.sourceUrl ?? ""] as const,
      async ([materialId, sourceUrl]) => {
        if (selectedMaterial.value?.kind === "image" || !sourceUrl || sourceUrl === pdfDocumentSource.value) {
          return;
        }

        const document = await loadPdfDocument(sourceUrl);
        if (!document) {
          errorMessage.value = "PDFを読み込めませんでした。別のPDFを選択してください。";
          return;
        }
        if (selectedMaterial.value?.id === materialId) {
          store.updateMaterial(props.noteId, materialId, { pageCount: document.pageCount });
        }
      },
      { immediate: true },
    );

    const handleFileChange = async (file: File) => {
      const validation = validateMaterialFile(file, uploadLimitBytes.value);
      if (!validation.ok) {
        if (validation.message === "file-too-large") {
          errorMessage.value =
            file.type === "application/pdf" ? `${limitLabel.value}以下のPDFを選択してください。` : `${limitLabel.value}以下の画像を選択してください。`;
        } else {
          errorMessage.value = validation.message;
        }
        return;
      }

      errorMessage.value = "";
      const materialId = createId();
      const sourceUrl = URL.createObjectURL(file);
      let pageCount = 1;
      if (validation.kind === "pdf") {
        const document = await loadPdfDocument(sourceUrl);
        if (!document) {
          URL.revokeObjectURL(sourceUrl);
          errorMessage.value = "PDFを読み込めませんでした。別のPDFを選択してください。";
          return;
        }
        pageCount = document.pageCount;
      }
      store.addMaterial(
        props.noteId,
        createMaterialFromFile(file, materialId, {
          kind: validation.kind,
          pageCount,
          sourceUrl,
          status: materialUploadStatus(props.currentUser),
        }),
      );
      store.setMode(props.noteId, "preview");
      emit("select-file", file);

      if (props.currentUser) {
        try {
          const metadata = await repository.value.save(
            {
              file,
              id: materialId,
              kind: validation.kind,
              noteId: props.noteId,
              pageCount,
            },
            props.currentUser,
          );
          store.updateMaterial(props.noteId, materialId, {
            status: "saved",
            storagePath: metadata.kind === "bookmark" ? undefined : metadata.storagePath,
          });
        } catch {
          store.updateMaterial(props.noteId, materialId, { status: "error" });
          errorMessage.value = "資料の保存に失敗しました。プレビューはこの画面で一時利用できます。";
        }
      }
    };
    const addBookmark = async (input: { title: string; url: string }) => {
      const validation = validateBookmark(input.title, input.url);
      if (!validation.ok) {
        errorMessage.value = validation.message;
        return;
      }
      errorMessage.value = "";
      const materialId = createId();
      store.addMaterial(
        props.noteId,
        createMaterialFromBookmark({
          id: materialId,
          status: materialUploadStatus(props.currentUser),
          title: validation.title,
          url: validation.url,
        }),
      );
      store.setMode(props.noteId, "materials");
      if (!props.currentUser) return;
      try {
        await repository.value.save(
          {
            id: materialId,
            kind: "bookmark",
            noteId: props.noteId,
            title: validation.title,
            url: validation.url,
          },
          props.currentUser,
        );
        store.updateMaterial(props.noteId, materialId, { status: "saved" });
      } catch {
        store.updateMaterial(props.noteId, materialId, { status: "error" });
        errorMessage.value = "ブックマークの保存に失敗しました。この画面では一時利用できます。";
      }
    };
    const selectTextbook = (textbookId: string) => {
      store.selectTextbook(props.noteId, textbookId);
    };
    const selectPage = (page: number) => {
      store.selectPage(props.noteId, page);
    };
    const setMode = (nextMode: MaterialPanelMode) => {
      if (!disabledModes.value.includes(nextMode)) {
        store.setMode(props.noteId, nextMode);
      }
    };
    const setThumbnailsCollapsed = (collapsed: boolean) => {
      store.setThumbnailsCollapsed(props.noteId, collapsed);
    };
    const addTocItem = (item: MaterialTocItem) => {
      store.addTocItem(props.noteId, {
        item,
        materialId: selectedTextbookId.value,
      });
    };
    const openTocItem = (item: MaterialTocItem) => {
      store.openTocItem(props.noteId, {
        item,
        materialId: selectedTextbookId.value,
      });
    };

    return {
      addBookmark,
      addTocItem,
      description,
      disabledModes,
      errorMessage,
      handleFileChange,
      isLoading,
      limitLabel,
      loadError,
      materials,
      mode,
      openTocItem,
      pages,
      pdfDocument,
      selectPage,
      selectTextbook,
      selectedMaterial,
      selectedPdfDocument,
      selectedPage,
      selectedTableOfContents,
      selectedTextbookId,
      selectedTextbookTitle,
      setMode,
      setThumbnailsCollapsed,
      thumbnailOrientation,
      thumbnailsCollapsed,
    };
  },
});
</script>

<style scoped src="../../styles/components/textbook-panel.css"></style>
