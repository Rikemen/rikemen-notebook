<template>
  <div class="whiteboard-panel">
    <div class="whiteboard-panel__pages">
      <button
        v-for="page in state.pages"
        :key="page.id"
        class="whiteboard-panel__page"
        :aria-current="page.id === state.selectedPageId"
        @click="selectPage(page.id)"
      >
        {{ page.title }}
      </button>
      <button class="whiteboard-panel__add" data-testid="add-whiteboard-page" @click="addPage">ページ追加</button>
    </div>

    <div class="whiteboard-panel__toolbar" role="toolbar" aria-label="Markdown表示切り替え">
      <div class="whiteboard-panel__segments">
        <button type="button" :aria-pressed="viewMode === 'md'" data-testid="md-toggle" @click="viewMode = 'md'">md</button>
        <button type="button" :aria-pressed="viewMode === 'preview'" data-testid="preview-toggle" @click="viewMode = 'preview'">preview</button>
      </div>
      <MarkdownFormattingToolbar :disabled="viewMode !== 'md' || !hasMarkdownSelection" @format="formatMarkdownSelection" />
      <AppIconButton
        class="whiteboard-panel__draw"
        data-testid="add-handwriting"
        icon="edit"
        label="手書きを追加"
        tooltip="手書きを追加"
        @click="openNewDrawing"
      />
    </div>

    <textarea
      v-if="viewMode === 'md'"
      ref="markdownTextarea"
      v-model="currentMarkdown"
      class="whiteboard-panel__markdown"
      data-testid="whiteboard-markdown"
      aria-label="Markdownノート"
      @click="syncMarkdownSelection"
      @input="syncMarkdownSelection"
      @keyup="syncMarkdownSelection"
      @select="syncMarkdownSelection"
    />
    <section v-else class="whiteboard-panel__preview" data-testid="whiteboard-preview" aria-label="Markdownプレビュー">
      <template v-for="block in previewBlocks" :key="block.id">
        <component :is="`h${block.level}`" v-if="block.type === 'heading'">
          <MarkdownInlineContent :nodes="block.content" />
        </component>
        <p v-else-if="block.type === 'paragraph'">
          <MarkdownInlineContent :nodes="block.content" />
        </p>
        <pre v-else-if="block.type === 'code'"><code>{{ block.text }}</code></pre>
        <ul v-else-if="block.type === 'list'">
          <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
            <MarkdownInlineContent :nodes="item" />
          </li>
        </ul>
        <blockquote v-else-if="block.type === 'quote'">
          <MarkdownInlineContent :nodes="block.content" />
        </blockquote>
        <figure v-else-if="block.type === 'drawing'" class="whiteboard-panel__drawing">
          <button type="button" :data-testid="drawingTestId(block)" @click="openDrawingDialog(drawingId(block))">
            <img :src="drawingDataUrl(block)" alt="手書きメモ" />
          </button>
        </figure>
      </template>
    </section>

    <WhiteboardDrawingDialog
      v-if="selectedDrawing"
      :drawing="selectedDrawing"
      @close="closeDrawingDialog"
      @delete="deleteSelectedDrawing"
      @edit="editSelectedDrawing"
    />
    <HandwritingCanvas
      v-if="isHandwritingOpen"
      :drawing="editingDrawing"
      @close="closeHandwriting"
      @draft-change="checkpointHandwriting"
      @save="saveHandwriting"
    />
  </div>
</template>

<script lang="ts">
/* eslint-disable max-lines-per-function, max-statements */
import { computed, defineComponent, nextTick, ref } from "vue";
import { applyMarkdownFormatting, type MarkdownFormatAction } from "@/features/whiteboard/markdownFormatting";
import { renderMarkdownPreview, type MarkdownPreviewBlock } from "@/features/whiteboard/markdownPreview";
import { createDrawingMarkdown, createWhiteboardDrawing, type WhiteboardStroke } from "@/features/whiteboard/whiteboardDrawings";
import { useWhiteboardStore, type WhiteboardViewMode } from "@/features/whiteboard/whiteboardStore";
import AppIconButton from "@/components/ui/AppIconButton.vue";
import HandwritingCanvas from "@/components/whiteboard/HandwritingCanvas.vue";
import MarkdownFormattingToolbar from "@/components/whiteboard/MarkdownFormattingToolbar.vue";
import MarkdownInlineContent from "@/components/whiteboard/MarkdownInlineContent.vue";
import WhiteboardDrawingDialog from "@/components/whiteboard/WhiteboardDrawingDialog.vue";

const createDrawingId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `drawing-${Date.now()}`;
};

const getDrawingId = (block: MarkdownPreviewBlock) => {
  if (block.type === "drawing") {
    return block.drawing.id;
  }

  return "";
};

const drawingDataUrl = (block: MarkdownPreviewBlock) => {
  if (block.type === "drawing") {
    return block.drawing.dataUrl;
  }

  return "";
};

const drawingTestId = (block: MarkdownPreviewBlock) => `open-drawing-${getDrawingId(block)}`;

export default defineComponent({
  name: "WhiteboardPanel",
  components: {
    AppIconButton,
    HandwritingCanvas,
    MarkdownFormattingToolbar,
    MarkdownInlineContent,
    WhiteboardDrawingDialog,
  },
  props: {
    noteId: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const store = useWhiteboardStore();
    const document = computed(() => store.documentForNote(props.noteId));
    const state = computed(() => document.value.pageState);
    const drawings = computed(() => document.value.drawings);
    const editingDrawingId = ref("");
    const selectedDrawingId = ref("");
    const isHandwritingOpen = ref(false);
    const markdownTextarea = ref<HTMLTextAreaElement | null>(null);
    const markdownSelection = ref({ end: 0, start: 0 });
    const clearMarkdownSelection = () => {
      markdownSelection.value = { end: 0, start: 0 };
    };
    const viewMode = computed({
      get: () => document.value.viewMode,
      set: (mode: WhiteboardViewMode) => {
        store.setViewMode(props.noteId, mode);
        clearMarkdownSelection();
      },
    });
    const currentPage = computed(() => state.value.pages.find((page) => page.id === state.value.selectedPageId) ?? state.value.pages[0]);
    const currentMarkdown = computed({
      get: () => currentPage.value?.markdown ?? "",
      set: (markdown: string) => store.updateMarkdown(props.noteId, markdown),
    });
    const previewBlocks = computed(() => renderMarkdownPreview(currentMarkdown.value, drawings.value));
    const hasMarkdownSelection = computed(() => markdownSelection.value.end > markdownSelection.value.start);
    const editingDrawing = computed(() => drawings.value.find((drawing) => drawing.id === editingDrawingId.value) ?? null);
    const selectedDrawing = computed(() => drawings.value.find((drawing) => drawing.id === selectedDrawingId.value) ?? null);
    const addPage = () => {
      store.addPage(props.noteId);
      clearMarkdownSelection();
    };
    const selectPage = (pageId: string) => {
      store.selectPage(props.noteId, pageId);
      clearMarkdownSelection();
    };
    const syncMarkdownSelection = () => {
      const textarea = markdownTextarea.value;
      if (!textarea) return;
      markdownSelection.value = { end: textarea.selectionEnd, start: textarea.selectionStart };
    };
    const formatMarkdownSelection = (action: MarkdownFormatAction) => {
      const result = applyMarkdownFormatting({
        action,
        selectionEnd: markdownSelection.value.end,
        selectionStart: markdownSelection.value.start,
        value: currentMarkdown.value,
      });
      currentMarkdown.value = result.value;
      markdownSelection.value = { end: result.selectionEnd, start: result.selectionStart };
      nextTick(() => {
        markdownTextarea.value?.focus();
        markdownTextarea.value?.setSelectionRange(result.selectionStart, result.selectionEnd);
      }).catch(() => undefined);
    };
    const closeHandwriting = () => {
      isHandwritingOpen.value = false;
      editingDrawingId.value = "";
    };
    const openNewDrawing = () => {
      editingDrawingId.value = "";
      isHandwritingOpen.value = true;
    };
    const openDrawingEditor = (targetDrawingId: string) => {
      editingDrawingId.value = targetDrawingId;
      isHandwritingOpen.value = true;
    };
    const openDrawingDialog = (targetDrawingId: string) => {
      selectedDrawingId.value = targetDrawingId;
    };
    const closeDrawingDialog = () => {
      selectedDrawingId.value = "";
    };
    const editSelectedDrawing = () => {
      const targetDrawingId = selectedDrawingId.value;
      closeDrawingDialog();
      openDrawingEditor(targetDrawingId);
    };
    const deleteSelectedDrawing = () => {
      store.deleteDrawing(props.noteId, selectedDrawingId.value);
      closeDrawingDialog();
    };
    const persistHandwriting = (payload: { dataUrl: string; strokes: WhiteboardStroke[] }) => {
      const nowIso = new Date().toISOString();
      const targetDrawingId = editingDrawingId.value || createDrawingId();
      const existingDrawing = drawings.value.find((drawing) => drawing.id === targetDrawingId);
      const drawing = createWhiteboardDrawing({
        dataUrl: payload.dataUrl,
        id: targetDrawingId,
        nowIso,
        strokes: payload.strokes,
      });
      store.saveDrawing(props.noteId, {
        ...drawing,
        createdAt: existingDrawing?.createdAt ?? drawing.createdAt,
      });
      if (!existingDrawing) {
        editingDrawingId.value = targetDrawingId;
        currentMarkdown.value = [currentMarkdown.value.trimEnd(), createDrawingMarkdown(targetDrawingId)].filter(Boolean).join("\n\n");
      }
    };
    const checkpointHandwriting = (payload: { dataUrl: string; strokes: WhiteboardStroke[] }) => {
      persistHandwriting(payload);
    };
    const saveHandwriting = (payload: { dataUrl: string; strokes: WhiteboardStroke[] }) => {
      persistHandwriting(payload);
      viewMode.value = "preview";
      closeHandwriting();
    };

    return {
      addPage,
      checkpointHandwriting,
      closeHandwriting,
      closeDrawingDialog,
      currentMarkdown,
      deleteSelectedDrawing,
      drawingDataUrl,
      drawingId: getDrawingId,
      drawingTestId,
      drawings,
      editingDrawing,
      editSelectedDrawing,
      formatMarkdownSelection,
      hasMarkdownSelection,
      isHandwritingOpen,
      markdownTextarea,
      openDrawingDialog,
      openNewDrawing,
      previewBlocks,
      saveHandwriting,
      selectPage,
      selectedDrawing,
      state,
      syncMarkdownSelection,
      viewMode,
    };
  },
});
</script>
