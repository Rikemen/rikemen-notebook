<template>
  <div class="material-add-controls">
    <div class="material-add-controls__tabs" aria-label="資料の追加方法" role="tablist">
      <button type="button" role="tab" :aria-selected="mode === 'file'" @click="mode = 'file'">ファイル</button>
      <button type="button" role="tab" :aria-selected="mode === 'bookmark'" @click="mode = 'bookmark'">ブックマーク</button>
    </div>

    <div v-if="mode === 'file'" class="textbook-panel__actions">
      <label class="textbook-panel__upload">
        PDF・画像をアップロード
        <input
          ref="fileInput"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          class="sr-only"
          data-testid="textbook-file"
          type="file"
          @change="selectFile"
        />
      </label>
      <button class="textbook-panel__select" data-testid="textbook-file-trigger" type="button" @click="fileInput?.click()">ファイルを選択</button>
    </div>

    <form v-else class="material-add-controls__bookmark" @submit.prevent="submitBookmark">
      <AppInput v-model="bookmarkTitle" label="タイトル（任意）" />
      <AppInput v-model="bookmarkUrl" label="URL" />
      <AppButton data-testid="add-bookmark" type="submit" variant="primary">ブックマークを追加</AppButton>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";

export default defineComponent({
  name: "MaterialAddControls",
  components: { AppButton, AppInput },
  emits: {
    "add-bookmark": (payload: { title: string; url: string }) => typeof payload.url === "string",
    "select-file": (file: File) => file instanceof File,
  },
  setup(_props, { emit }) {
    const bookmarkTitle = ref("");
    const bookmarkUrl = ref("");
    const fileInput = ref<HTMLInputElement | null>(null);
    const mode = ref<"bookmark" | "file">("file");
    const selectFile = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) emit("select-file", file);
      input.value = "";
    };
    const submitBookmark = () => {
      emit("add-bookmark", { title: bookmarkTitle.value, url: bookmarkUrl.value });
      bookmarkTitle.value = "";
      bookmarkUrl.value = "";
    };
    return { bookmarkTitle, bookmarkUrl, fileInput, mode, selectFile, submitBookmark };
  },
});
</script>

<style scoped>
.material-add-controls {
  display: grid;
  gap: var(--space-3);
}

.material-add-controls__tabs {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.material-add-controls__tabs button {
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  min-height: 36px;
}

.material-add-controls__tabs button[aria-selected="true"] {
  border-bottom-color: var(--color-blue);
  color: var(--color-blue);
  box-shadow: var(--shadow-inset);
}

.material-add-controls__bookmark {
  display: grid;
  gap: var(--space-3);
}
</style>
